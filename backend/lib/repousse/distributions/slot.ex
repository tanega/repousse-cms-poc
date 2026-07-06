defmodule Repousse.Distributions.Slot do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :location_name,
             :address,
             :date,
             :start_time,
             :end_time,
             :contact,
             :event_id,
             :inserted_at,
             :updated_at
           ]}

  schema "distribution_slots" do
    field :location_name, :string
    field :address, :string
    field :date, :date
    field :start_time, :time
    field :end_time, :time
    field :contact, :string

    belongs_to :event, Repousse.Distributions.Event
    has_many :reservations, Repousse.Distributions.Reservation

    timestamps(type: :utc_datetime)
  end

  def changeset(slot, attrs) do
    slot
    |> cast(attrs, [:location_name, :address, :date, :start_time, :end_time, :contact, :event_id])
    |> validate_required([:location_name, :date, :start_time, :end_time, :event_id])
    |> validate_times()
  end

  defp validate_times(changeset) do
    start_time = get_field(changeset, :start_time)
    end_time = get_field(changeset, :end_time)

    if start_time && end_time && Time.compare(start_time, end_time) != :lt do
      add_error(changeset, :end_time, "must be after start_time")
    else
      changeset
    end
  end
end
