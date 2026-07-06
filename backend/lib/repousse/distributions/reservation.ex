defmodule Repousse.Distributions.Reservation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :status,
             :cancelled_at,
             :validated_at,
             :coordinator_note,
             :user_id,
             :slot_id,
             :event_id,
             :project_id,
             :inserted_at,
             :updated_at
           ]}

  schema "reservations" do
    field :status, Ecto.Enum,
      values: [:confirmed, :cancelled, :no_show, :validated],
      default: :confirmed

    field :cancelled_at, :utc_datetime
    field :validated_at, :utc_datetime
    field :coordinator_note, :string

    belongs_to :user, Repousse.Accounts.User
    belongs_to :slot, Repousse.Distributions.Slot
    belongs_to :event, Repousse.Distributions.Event
    belongs_to :project, Repousse.Projects.Project
    has_many :items, Repousse.Distributions.ReservationItem

    timestamps(type: :utc_datetime)
  end

  def changeset(reservation, attrs) do
    reservation
    |> cast(attrs, [:user_id, :slot_id, :event_id, :project_id])
    |> validate_required([:user_id, :slot_id, :event_id, :project_id])
    |> unique_constraint([:user_id, :event_id], message: "already has a reservation for this event")
  end

  def cancel_changeset(reservation) do
    change(reservation,
      status: :cancelled,
      cancelled_at: DateTime.utc_now() |> DateTime.truncate(:second)
    )
    |> validate_cancellable()
  end

  def validate_changeset(reservation, attrs) do
    reservation
    |> cast(attrs, [:coordinator_note])
    |> change(
      status: :validated,
      validated_at: DateTime.utc_now() |> DateTime.truncate(:second)
    )
  end

  def no_show_changeset(reservation) do
    change(reservation, status: :no_show)
  end

  defp validate_cancellable(changeset) do
    validate_change(changeset, :status, fn :status, _val ->
      if changeset.data.status in [:confirmed] do
        []
      else
        [status: "cannot cancel a #{changeset.data.status} reservation"]
      end
    end)
  end
end
