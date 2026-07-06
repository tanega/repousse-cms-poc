defmodule Repousse.Projects.ProjectMedia do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @max_files_per_project 10
  @allowed_types ["image/jpeg", "image/png", "video/mp4", "video/webm", "application/pdf"]

  @derive {Jason.Encoder,
           only: [
             :id,
             :file_type,
             :mime_type,
             :url,
             :filename,
             :title,
             :caption,
             :size_bytes,
             :project_id,
             :uploaded_by_id,
             :inserted_at,
             :updated_at
           ]}

  schema "project_media" do
    field :file_type, :string
    field :mime_type, :string
    field :url, :string
    field :filename, :string
    field :title, :string
    field :caption, :string
    field :size_bytes, :integer

    belongs_to :project, Repousse.Projects.Project
    belongs_to :uploaded_by, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(media, attrs) do
    media
    |> cast(attrs, [:file_type, :mime_type, :url, :filename, :title, :caption, :size_bytes, :project_id, :uploaded_by_id])
    |> validate_required([:file_type, :mime_type, :url, :filename, :project_id, :uploaded_by_id])
    |> validate_inclusion(:mime_type, @allowed_types)
    |> validate_number(:size_bytes, greater_than: 0)
  end

  def max_files, do: @max_files_per_project
  def allowed_types, do: @allowed_types
end
