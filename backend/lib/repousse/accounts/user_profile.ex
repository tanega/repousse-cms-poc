defmodule Repousse.Accounts.UserProfile do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @profile_types [:volunteer, :adoptant, :host_family]

  @derive {Jason.Encoder,
           only: [
             :id,
             :profile_type,
             :engagement_note,
             :address,
             :avatar_url,
             :notification_prefs,
             :hosting_capacity,
             :hosting_address,
             :hosting_lat,
             :hosting_lng,
             :hosting_availability,
             :inserted_at,
             :updated_at
           ]}

  schema "user_profiles" do
    field :profile_type, Ecto.Enum, values: @profile_types
    field :engagement_note, :string
    field :address, :string
    field :avatar_url, :string
    field :notification_prefs, :map, default: %{}

    # Host family specific fields
    field :hosting_capacity, :integer
    field :hosting_address, :string
    field :hosting_lat, :float
    field :hosting_lng, :float
    field :hosting_availability, :string

    belongs_to :user, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(profile, attrs) do
    profile
    |> cast(attrs, [
      :profile_type,
      :engagement_note,
      :address,
      :avatar_url,
      :notification_prefs,
      :hosting_capacity,
      :hosting_address,
      :hosting_lat,
      :hosting_lng,
      :hosting_availability,
      :user_id
    ])
    |> validate_required([:profile_type, :user_id])
    |> validate_inclusion(:profile_type, @profile_types)
    |> unique_constraint([:user_id, :profile_type])
  end

  def profile_types, do: @profile_types
end
