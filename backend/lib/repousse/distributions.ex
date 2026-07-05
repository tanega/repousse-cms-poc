defmodule Repousse.Distributions do
  import Ecto.Query
  alias Repousse.Integrations.Emails
  alias Repousse.Repo
  alias Repousse.Distributions.{Event, Slot, Stock, Reservation, ReservationItem, WaitlistEntry}

  # Cancellation is blocked inside this window before the reserved slot
  # (epic-01 US-DIST-09: "annulation possible jusqu'à 48h avant la date du
  # créneau réservé"). Also used, per US-DIST-08, as the window a waitlisted
  # adoptant has to confirm after being notified that stock freed up — the
  # epic leaves the exact delay as an open question, so the cancellation
  # window is reused here as the closest specified value.
  @cancellation_window_hours 48

  # ── Events ────────────────────────────────────────────────────────────────

  def list_events(opts \\ []) do
    Event
    |> maybe_filter_status(opts[:status])
    |> order_by([e], desc: e.published_at)
    |> Repo.all()
  end

  def get_event(id), do: Repo.get(Event, id)
  def get_event!(id), do: Repo.get!(Event, id)

  def get_event_by_slug(slug) do
    Repo.get_by(Event, slug: slug)
  end

  def create_event(attrs) do
    %Event{} |> Event.changeset(attrs) |> Repo.insert()
  end

  def update_event(%Event{} = event, attrs) do
    event |> Event.changeset(attrs) |> Repo.update()
  end

  def publish_event(%Event{status: :draft} = event) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:event, Event.publish_changeset(event))
    |> Ecto.Multi.run(:email, fn _repo, %{event: published_event} ->
      Repousse.Integrations.Emails.broadcast_event_published(published_event)
      {:ok, :sent}
    end)
    |> Repo.transaction()
  end

  def publish_event(%Event{}), do: {:error, :invalid_status}

  def close_event(%Event{} = event) do
    event |> Event.close_changeset() |> Repo.update()
  end

  def delete_event(%Event{} = event), do: Repo.delete(event)

  # ── Slots ─────────────────────────────────────────────────────────────────

  def list_slots(event_id) do
    from(s in Slot, where: s.event_id == ^event_id, order_by: [asc: s.date, asc: s.start_time])
    |> Repo.all()
  end

  def get_slot!(id), do: Repo.get!(Slot, id)

  @doc """
  Adds a slot to an event (US-DIST-02). Blocked once the event is Closed.
  """
  def create_slot(attrs) do
    event_id = attrs["event_id"] || attrs[:event_id]

    with :ok <- assert_event_open(event_id) do
      %Slot{} |> Slot.changeset(attrs) |> Repo.insert()
    end
  end

  @doc """
  Updates a slot (US-DIST-02). Blocked once the event is Closed.
  """
  def update_slot(%Slot{} = slot, attrs) do
    with :ok <- assert_event_open(slot.event_id) do
      slot |> Slot.changeset(attrs) |> Repo.update()
    end
  end

  @doc """
  Deletes a slot (US-DIST-02). Blocked once the event is Closed, or when the
  slot still has active (confirmed) reservations.
  """
  def delete_slot(%Slot{} = slot) do
    with :ok <- assert_event_open(slot.event_id) do
      if has_active_reservations?(slot.id) do
        {:error, :slot_has_active_reservations}
      else
        Repo.delete(slot)
      end
    end
  end

  # ── Stocks ────────────────────────────────────────────────────────────────

  def list_stocks(event_id) do
    from(s in Stock, where: s.event_id == ^event_id, preload: [:taxon])
    |> Repo.all()
  end

  def get_stock!(id), do: Repo.get!(Stock, id)

  def create_stock(attrs), do: %Stock{} |> Stock.changeset(attrs) |> Repo.insert()
  def update_stock(%Stock{} = stock, attrs), do: stock |> Stock.changeset(attrs) |> Repo.update()
  def delete_stock(%Stock{} = stock), do: Repo.delete(stock)

  # ── Reservations ──────────────────────────────────────────────────────────

  def get_reservation!(id), do: Repo.get!(Reservation, id)

  def get_user_reservation(user_id, event_id) do
    Repo.get_by(Reservation, user_id: user_id, event_id: event_id)
  end

  def list_slot_reservations(slot_id) do
    from(r in Reservation,
      where: r.slot_id == ^slot_id and r.status != :cancelled,
      preload: [:user, :project, items: [:taxon]]
    )
    |> Repo.all()
  end

  def create_reservation(user, slot, event, project, items_attrs) do
    if event.status == :published do
      do_create_reservation(user, slot, event, project, items_attrs)
    else
      {:error, :event_not_open_for_reservations}
    end
  end

  defp do_create_reservation(user, slot, event, project, items_attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(
      :reservation,
      Reservation.changeset(%Reservation{}, %{
        user_id: user.id,
        slot_id: slot.id,
        event_id: event.id,
        project_id: project.id
      })
    )
    |> Ecto.Multi.run(:items, fn _repo, %{reservation: reservation} ->
      Enum.reduce_while(items_attrs, {:ok, []}, fn attrs, {:ok, acc} ->
        stock = get_stock!(attrs.stock_id)

        with :ok <- check_stock_available(stock, attrs.qty),
             {:ok, item} <- create_reservation_item(reservation, stock, attrs) do
          decrement_stock(stock, attrs.qty)
          {:cont, {:ok, [item | acc]}}
        else
          error -> {:halt, error}
        end
      end)
    end)
    |> Repo.transaction()
  end

  @doc """
  Cancels a reservation (US-DIST-09): blocked once the event is closed or
  once less than 48h remain before the reserved slot, restores the
  cancelled quantities to the event's shared stock pool, and — per
  US-DIST-08 — notifies the next waitlisted adoptant (in registration
  order) for each taxon whose stock just freed up.
  """
  def cancel_reservation(%Reservation{} = reservation) do
    reservation = Repo.preload(reservation, [:slot, :event, items: [:taxon]])

    cond do
      reservation.status != :confirmed ->
        {:error, :not_cancellable}

      reservation.event.status == :closed ->
        {:error, :event_closed}

      not cancellable_before_deadline?(reservation.slot) ->
        {:error, :cancellation_window_closed}

      true ->
        Ecto.Multi.new()
        |> Ecto.Multi.update(:reservation, Reservation.cancel_changeset(reservation))
        |> Ecto.Multi.run(:restore_stock, fn _repo, _ ->
          restore_stock_from_reservation(reservation)
          {:ok, :restored}
        end)
        |> Ecto.Multi.run(:notify_waitlist, fn _repo, _ ->
          notify_waitlist_for_reservation(reservation)
          {:ok, :notified}
        end)
        |> Repo.transaction()
    end
  end

  @doc """
  Records the quantities actually distributed to an adoptant (US-DIST-11).
  The reserved quantity is pre-filled on each item but can be freely
  overridden: pass `attrs["items"]` as a list of
  `%{"item_id" => id, "distributed_qty" => qty}` maps. `attrs` may also
  include `"coordinator_note"`. Validation is stored on the reservation
  itself, independently per adoptant.
  """
  def validate_reservation(%Reservation{} = reservation, attrs \\ %{}) do
    items_attrs = attrs["items"] || attrs[:items] || []

    Ecto.Multi.new()
    |> Ecto.Multi.run(:items, fn _repo, _changes -> update_distributed_quantities(items_attrs) end)
    |> Ecto.Multi.update(:reservation, Reservation.validate_changeset(reservation, attrs))
    |> Repo.transaction()
  end

  @doc """
  Marks a reservation as "non venu" (US-DIST-11): the adoptant didn't show
  up to collect their plants.
  """
  def mark_no_show(%Reservation{} = reservation) do
    reservation |> Reservation.no_show_changeset() |> Repo.update()
  end

  def list_reservations_for_event(event_id) do
    from(r in Reservation,
      where: r.event_id == ^event_id and r.status != :cancelled,
      preload: [:user, :slot, :project, items: [:taxon]]
    )
    |> Repo.all()
  end

  # ── Waitlist ──────────────────────────────────────────────────────────────

  def join_waitlist(user_id, event_id, taxon_id) do
    position = next_waitlist_position(event_id, taxon_id)

    %WaitlistEntry{}
    |> WaitlistEntry.changeset(%{user_id: user_id, event_id: event_id, taxon_id: taxon_id})
    |> Ecto.Changeset.put_change(:position, position)
    |> Repo.insert()
  end

  def leave_waitlist(user_id, event_id, taxon_id) do
    case Repo.get_by(WaitlistEntry, user_id: user_id, event_id: event_id, taxon_id: taxon_id) do
      nil -> {:error, :not_found}
      entry -> Repo.delete(entry)
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status), do: where(query, [e], e.status == ^status)

  defp assert_event_open(nil), do: {:error, :not_found}

  defp assert_event_open(event_id) do
    case get_event(event_id) do
      nil -> {:error, :not_found}
      %Event{status: :closed} -> {:error, :event_closed}
      %Event{} -> :ok
    end
  end

  defp has_active_reservations?(slot_id) do
    from(r in Reservation, where: r.slot_id == ^slot_id and r.status == :confirmed)
    |> Repo.exists?()
  end

  defp update_distributed_quantities(items_attrs) do
    Enum.reduce_while(items_attrs, {:ok, []}, fn item_attrs, {:ok, acc} ->
      item_id = item_attrs["item_id"] || item_attrs[:item_id]
      distributed_qty = item_attrs["distributed_qty"] || item_attrs[:distributed_qty]

      case Repo.get(ReservationItem, item_id) do
        nil ->
          {:halt, {:error, :reservation_item_not_found}}

        item ->
          case item |> ReservationItem.validate_changeset(distributed_qty) |> Repo.update() do
            {:ok, updated} -> {:cont, {:ok, [updated | acc]}}
            error -> {:halt, error}
          end
      end
    end)
  end

  defp check_stock_available(%Stock{quantity_unknown: true}, _qty), do: :ok

  defp check_stock_available(%Stock{} = stock, qty) do
    if Stock.available_quantity(stock) >= qty, do: :ok, else: {:error, :insufficient_stock}
  end

  defp create_reservation_item(reservation, stock, %{qty: qty, taxon_id: taxon_id}) do
    %ReservationItem{}
    |> ReservationItem.changeset(%{
      reservation_id: reservation.id,
      stock_id: stock.id,
      taxon_id: taxon_id,
      reserved_qty: qty
    })
    |> Repo.insert()
  end

  defp decrement_stock(%Stock{} = stock, qty) do
    stock |> Stock.reserve_changeset(qty) |> Repo.update!()
  end

  defp restore_stock_from_reservation(%Reservation{} = reservation) do
    reservation = Repo.preload(reservation, :items)

    Enum.each(reservation.items, fn item ->
      stock = get_stock!(item.stock_id)
      stock |> Stock.release_changeset(item.reserved_qty) |> Repo.update!()
    end)
  end

  defp cancellable_before_deadline?(%Slot{date: date, start_time: start_time}) do
    slot_datetime = DateTime.new!(date, start_time, "Etc/UTC")
    DateTime.diff(slot_datetime, DateTime.utc_now(), :second) >= @cancellation_window_hours * 3600
  end

  # US-DIST-08: on a cancellation that frees up stock, notify the
  # longest-waiting adoptant for each affected taxon (registration order).
  # The confirmation delay itself is an open point in the epic ("délai à
  # préciser"); expiry-driven cascading to the next entrant is left for a
  # follow-up once that delay is specified — this only sends the notification
  # for the head of the queue.
  defp notify_waitlist_for_reservation(%Reservation{} = reservation) do
    reservation.items
    |> Enum.map(& &1.taxon_id)
    |> Enum.uniq()
    |> Enum.each(&notify_next_waitlist_entry(reservation.event_id, &1))
  end

  defp notify_next_waitlist_entry(event_id, taxon_id) do
    case next_waiting_entry(event_id, taxon_id) do
      nil ->
        :ok

      entry ->
        expires_at =
          DateTime.utc_now()
          |> DateTime.add(@cancellation_window_hours * 3600, :second)
          |> DateTime.truncate(:second)

        entry
        |> WaitlistEntry.notify_changeset(expires_at)
        |> Repo.update!()
        |> Emails.notify_waitlist_stock_available()

        :ok
    end
  end

  defp next_waiting_entry(event_id, taxon_id) do
    from(w in WaitlistEntry,
      where: w.event_id == ^event_id and w.taxon_id == ^taxon_id and w.status == :waiting,
      order_by: [asc: w.position],
      limit: 1,
      preload: [:user, :taxon]
    )
    |> Repo.one()
  end

  defp next_waitlist_position(event_id, taxon_id) do
    from(w in WaitlistEntry,
      where: w.event_id == ^event_id and w.taxon_id == ^taxon_id,
      select: count(w.id)
    )
    |> Repo.one()
    |> Kernel.+(1)
  end
end
