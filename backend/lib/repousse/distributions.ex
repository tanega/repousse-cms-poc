defmodule Repousse.Distributions do
  import Ecto.Query
  alias Repousse.Repo
  alias Repousse.Distributions.{Event, Slot, Stock, Reservation, ReservationItem, WaitlistEntry}

  # ── Events ────────────────────────────────────────────────────────────────

  def list_events(opts \\ []) do
    Event
    |> maybe_filter_status(opts[:status])
    |> order_by([e], desc: e.published_at)
    |> Repo.all()
    |> Enum.map(&put_reservations_count/1)
  end

  def get_event(id) do
    case Repo.get(Event, id) do
      nil -> nil
      event -> put_reservations_count(event)
    end
  end

  def get_event!(id), do: Repo.get!(Event, id) |> put_reservations_count()

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

  def create_slot(attrs), do: %Slot{} |> Slot.changeset(attrs) |> Repo.insert()
  def update_slot(%Slot{} = slot, attrs), do: slot |> Slot.changeset(attrs) |> Repo.update()
  def delete_slot(%Slot{} = slot), do: Repo.delete(slot)

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
    case Repo.get_by(Reservation, user_id: user_id, event_id: event_id) do
      nil -> nil
      reservation -> Repo.preload(reservation, :items)
    end
  end

  def list_slot_reservations(slot_id) do
    from(r in Reservation,
      where: r.slot_id == ^slot_id and r.status == :confirmed,
      preload: [:user, items: [:taxon]]
    )
    |> Repo.all()
  end

  def create_reservation(user, slot, event, project, items_attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:reservation, Reservation.changeset(%Reservation{}, %{
      user_id: user.id,
      slot_id: slot.id,
      event_id: event.id,
      project_id: project.id
    }))
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
    |> case do
      {:ok, %{reservation: reservation} = result} ->
        {:ok, %{result | reservation: Repo.preload(reservation, :items)}}

      error ->
        error
    end
  end

  def cancel_reservation(%Reservation{} = reservation) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:reservation, Reservation.cancel_changeset(reservation))
    |> Ecto.Multi.run(:restore_stock, fn _repo, _ ->
      restore_stock_from_reservation(reservation)
      {:ok, :restored}
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{reservation: cancelled} = result} ->
        {:ok, %{result | reservation: Repo.preload(cancelled, :items)}}

      error ->
        error
    end
  end

  def validate_reservation(%Reservation{} = reservation, attrs \\ %{}) do
    case reservation |> Reservation.validate_changeset(attrs) |> Repo.update() do
      {:ok, validated} -> {:ok, Repo.preload(validated, :items)}
      error -> error
    end
  end

  def list_reservations_for_project(project_id) do
    from(r in Reservation,
      where: r.project_id == ^project_id and r.status in [:confirmed, :validated],
      order_by: [desc: r.inserted_at],
      preload: [items: [:taxon]]
    )
    |> Repo.all()
  end

  def list_reservations_for_event(event_id) do
    from(r in Reservation,
      where: r.event_id == ^event_id,
      preload: [:user, :slot, items: [:taxon]]
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

  def list_user_waitlist_entries(user_id, event_id) do
    from(w in WaitlistEntry, where: w.user_id == ^user_id and w.event_id == ^event_id)
    |> Repo.all()
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

  defp put_reservations_count(%Event{} = event) do
    event = Repo.preload(event, :reservations)
    %{event | reservations_count: Enum.count(event.reservations, &(&1.status == :confirmed))}
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

  defp next_waitlist_position(event_id, taxon_id) do
    from(w in WaitlistEntry,
      where: w.event_id == ^event_id and w.taxon_id == ^taxon_id,
      select: count(w.id)
    )
    |> Repo.one()
    |> Kernel.+(1)
  end
end
