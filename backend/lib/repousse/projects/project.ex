defmodule Repousse.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :name,
             :description,
             :management_type,
             :address,
             :lat,
             :lng,
             :surface_m2,
             :soil_type,
             :publication_status,
             :published_at,
             :archived_at,
             :owner_id,
             :cover_image_url,
             :preferred_species,
             :inserted_at,
             :updated_at
           ]}

  schema "planting_projects" do
    field :name, :string
    field :description, :string
    field :management_type, Ecto.Enum, values: [:individual, :collective], default: :individual
    field :address, :string
    field :lat, :float
    field :lng, :float
    field :surface_m2, :float
    field :soil_type, :string
    field :publication_status, Ecto.Enum, values: [:private, :public, :unpublished], default: :private
    field :published_at, :utc_datetime
    field :archived_at, :utc_datetime
    field :cover_image_url, :string

    belongs_to :owner, Repousse.Accounts.User
    has_many :members, Repousse.Projects.ProjectMember
    has_many :invitations, Repousse.Projects.ProjectInvitation
    has_many :media, Repousse.Projects.ProjectMedia
    has_many :journal_entries, Repousse.Projects.JournalEntry
    has_many :preferred_species, Repousse.Projects.PreferredSpecies, on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name, :description, :management_type, :address, :lat, :lng,
      :surface_m2, :soil_type, :publication_status, :owner_id, :cover_image_url
    ])
    |> validate_required([:name, :owner_id])
    |> validate_length(:name, min: 2, max: 200)
    |> cast_assoc(:preferred_species, with: &Repousse.Projects.PreferredSpecies.changeset/2)
  end

  def publish_changeset(project) do
    change(project,
      publication_status: :public,
      published_at: DateTime.utc_now() |> DateTime.truncate(:second)
    )
  end

  def unpublish_changeset(project) do
    change(project, publication_status: :unpublished)
  end

  def archive_changeset(project) do
    change(project, archived_at: DateTime.utc_now() |> DateTime.truncate(:second))
  end
end
