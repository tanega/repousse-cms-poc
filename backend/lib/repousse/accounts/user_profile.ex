defmodule Repousse.Accounts.UserProfile do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @profile_types [:volunteer, :adoptant, :host_family]
  @statuses [:pending, :active, :rejected]
  # Profiles a member can't self-activate: a coordinator validates the request.
  @approval_required [:adoptant, :host_family]
  @equipment [:greenhouse, :tarp, :auto_watering, :artificial_light, :cold_frame, :outdoor_ground]

  @derive {Jason.Encoder,
           only: [
             :id,
             :profile_type,
             :status,
             :requested_at,
             :decided_at,
             :rejection_reason,
             :engagement_note,
             :address,
             :avatar_url,
             :notification_prefs,
             :hosting_capacity,
             :hosting_address,
             :hosting_lat,
             :hosting_lng,
             :hosting_availability,
             :hosting_surface_m2,
             :hosting_equipment,
             :hosted_species,
             :inserted_at,
             :updated_at
           ]}

  schema "user_profiles" do
    field :profile_type, Ecto.Enum, values: @profile_types
    field :status, Ecto.Enum, values: @statuses, default: :active
    field :requested_at, :utc_datetime
    field :decided_at, :utc_datetime
    field :rejection_reason, :string
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
    field :hosting_surface_m2, :float
    field :hosting_equipment, {:array, :string}, default: []

    belongs_to :user, Repousse.Accounts.User
    belongs_to :decided_by, Repousse.Accounts.User
    has_many :hosted_species, Repousse.Accounts.HostedSpecies, on_replace: :delete

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
      :hosting_surface_m2,
      :hosting_equipment,
      :user_id
    ])
    |> validate_required([:profile_type, :user_id])
    |> validate_inclusion(:profile_type, @profile_types)
    |> validate_number(:hosting_capacity, greater_than_or_equal_to: 0)
    |> validate_number(:hosting_surface_m2, greater_than_or_equal_to: 0)
    |> validate_subset(:hosting_equipment, Enum.map(@equipment, &Atom.to_string/1))
    |> cast_assoc(:hosted_species)
    |> unique_constraint([:user_id, :profile_type])
  end

  @doc "Changeset for a member asking to join a profile that needs approval."
  def request_changeset(profile, attrs) do
    profile
    |> changeset(attrs)
    |> validate_host_family_details()
    |> put_change(:status, :pending)
    |> put_change(:requested_at, DateTime.utc_now() |> DateTime.truncate(:second))
    |> put_change(:decided_at, nil)
    |> put_change(:decided_by_id, nil)
    |> put_change(:rejection_reason, nil)
  end

  # A Famille d'accueil request must come with the hosting basics, so the
  # admin deciding on it has something to look at.
  defp validate_host_family_details(changeset) do
    if get_field(changeset, :profile_type) == :host_family do
      changeset
      |> validate_required([:hosting_capacity, :hosting_address],
        message: "à renseigner pour demander ce parcours"
      )
      |> validate_number(:hosting_capacity, greater_than: 0)
    else
      changeset
    end
  end

  def decision_changeset(profile, status, decider_id, reason \\ nil) when status in [:active, :rejected] do
    change(profile,
      status: status,
      decided_at: DateTime.utc_now() |> DateTime.truncate(:second),
      decided_by_id: decider_id,
      rejection_reason: if(status == :rejected, do: reason)
    )
  end

  def requires_approval?(type), do: type in @approval_required
  def profile_types, do: @profile_types
  def equipment, do: @equipment
end
