defmodule Repousse.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :email,
             :first_name,
             :last_name,
             :membership_year,
             :adhesion_active,
             :status,
             :last_seen_at,
             :profiles,
             :inserted_at,
             :updated_at
           ]}

  schema "users" do
    field :email, :string
    field :first_name, :string
    field :last_name, :string
    field :hanko_id, :string
    field :membership_year, :integer
    field :adhesion_active, :boolean, default: false
    field :status, Ecto.Enum, values: [:active, :suspended], default: :active
    field :activation_sent_count, :integer, default: 0
    field :last_seen_at, :utc_datetime

    has_many :profiles, Repousse.Accounts.UserProfile
    has_many :projects, Repousse.Projects.Project, foreign_key: :owner_id
    has_many :reservations, Repousse.Distributions.Reservation
    has_many :project_members, Repousse.Projects.ProjectMember

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :first_name, :last_name, :hanko_id, :membership_year, :adhesion_active, :status])
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/)
    |> unique_constraint(:email)
    |> unique_constraint(:hanko_id)
  end

  # `status` (account moderation: active/suspended) and `adhesion_active`
  # (paid membership for the current year) are independent — a suspended
  # account isn't necessarily a lapsed member and vice versa. This sync
  # changeset only ever touches `adhesion_active`, never `status`.
  def sync_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :first_name, :last_name, :membership_year])
    |> validate_required([:email, :membership_year])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/)
    |> unique_constraint(:email)
    |> put_change(:adhesion_active, true)
  end

  def adhesion_changeset(user, adhesion_active?) when is_boolean(adhesion_active?) do
    change(user, adhesion_active: adhesion_active?)
  end

  def suspension_changeset(user, suspended?) do
    status = if suspended?, do: :suspended, else: :active
    change(user, status: status)
  end
end
