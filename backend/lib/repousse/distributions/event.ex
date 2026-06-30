defmodule Repousse.Distributions.Event do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "distribution_events" do
    field :title, :string
    field :description, :string
    field :general_contact, :string
    field :image_url, :string
    field :slug, :string
    field :status, Ecto.Enum, values: [:draft, :published, :closed], default: :draft
    field :published_at, :utc_datetime

    has_many :slots, Repousse.Distributions.Slot
    has_many :stocks, Repousse.Distributions.Stock
    has_many :reservations, Repousse.Distributions.Reservation

    timestamps(type: :utc_datetime)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:title, :description, :general_contact, :image_url, :status])
    |> validate_required([:title])
    |> maybe_generate_slug()
    |> unique_constraint(:slug)
  end

  def publish_changeset(event) do
    change(event,
      status: :published,
      published_at: DateTime.utc_now() |> DateTime.truncate(:second)
    )
    |> validate_can_publish()
  end

  def close_changeset(event), do: change(event, status: :closed)

  defp maybe_generate_slug(changeset) do
    if get_change(changeset, :title) && is_nil(get_field(changeset, :slug)) do
      slug =
        changeset
        |> get_change(:title)
        |> String.downcase()
        |> String.replace(~r/[^a-z0-9\s-]/, "")
        |> String.replace(~r/\s+/, "-")
        |> String.trim("-")

      suffix = :crypto.strong_rand_bytes(3) |> Base.encode16(case: :lower)
      put_change(changeset, :slug, "#{slug}-#{suffix}")
    else
      changeset
    end
  end

  defp validate_can_publish(changeset) do
    validate_change(changeset, :status, fn :status, _val ->
      # Could add business rules here (e.g., must have at least one slot)
      []
    end)
  end
end
