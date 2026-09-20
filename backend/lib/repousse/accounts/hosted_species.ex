defmodule Repousse.Accounts.HostedSpecies do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder, only: [:id, :user_profile_id, :taxon_id, :inserted_at, :updated_at]}

  schema "user_profile_hosted_species" do
    belongs_to :user_profile, Repousse.Accounts.UserProfile
    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(hosted_species, attrs) do
    hosted_species
    |> cast(attrs, [:user_profile_id, :taxon_id])
    |> validate_required([:taxon_id])
    |> unique_constraint([:user_profile_id, :taxon_id])
  end
end
