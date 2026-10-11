defmodule Repousse.Notifications.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :type, :title, :body, :link, :payload, :read_at, :user_id, :inserted_at]}

  schema "notifications" do
    field :type, :string
    field :title, :string
    field :body, :string
    # Webapp-relative path the notification points to (e.g. "/admin/demandes").
    field :link, :string
    field :payload, :map, default: %{}
    field :read_at, :utc_datetime

    belongs_to :user, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:user_id, :type, :title, :body, :link, :payload])
    |> validate_required([:user_id, :type, :title])
    |> validate_length(:title, max: 255)
    |> foreign_key_constraint(:user_id)
  end
end
