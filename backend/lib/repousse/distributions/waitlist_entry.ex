defmodule Repousse.Distributions.WaitlistEntry do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "waitlist_entries" do
    field :position, :integer
    field :notified_at, :utc_datetime
    field :notification_expires_at, :utc_datetime
    field :status, Ecto.Enum, values: [:waiting, :notified, :expired, :converted], default: :waiting

    belongs_to :user, Repousse.Accounts.User
    belongs_to :event, Repousse.Distributions.Event
    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:user_id, :event_id, :taxon_id])
    |> validate_required([:user_id, :event_id, :taxon_id])
    |> unique_constraint([:user_id, :event_id, :taxon_id])
  end

  def notify_changeset(entry, expires_at) do
    change(entry,
      status: :notified,
      notified_at: DateTime.utc_now() |> DateTime.truncate(:second),
      notification_expires_at: expires_at
    )
  end
end
