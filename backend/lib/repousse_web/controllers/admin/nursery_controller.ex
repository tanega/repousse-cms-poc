defmodule RepousseWeb.Admin.NurseryController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Nurseries
  alias Repousse.Nurseries.Policy
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Nursery

  tags ["Admin", "Nurseries"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List every member's nurseries (coordinator view)",
    description:
      "Includes nurseries of members whose profile is private, each with its `owner` " <>
        "contact (name, email, Famille d'accueil phone). `taxon_id` narrows the listing " <>
        "to nurseries declaring stock for that taxon.",
    parameters: [
      taxon_id: [in: :query, type: :string, description: "Filter by taxon", required: false]
    ],
    responses: [ok: API.list(Nursery, "All nurseries")]

  def index(conn, params) do
    with :ok <- Bodyguard.permit(Policy, :list_all, conn.assigns.current_user, %{}) do
      opts =
        case Map.get(params, "taxon_id") do
          nil -> []
          taxon_id -> [taxon_id: taxon_id]
        end

      nurseries = Nurseries.list_all_nurseries(opts)
      owners = Nurseries.owner_contacts(Enum.map(nurseries, & &1.user_id))

      json(conn, %{data: Enum.map(nurseries, &with_owner(&1, owners))})
    end
  end

  @fields [:id, :name, :notes, :address, :lat, :lng, :archived_at, :user_id, :plants, :inserted_at, :updated_at]

  defp with_owner(nursery, owners) do
    nursery |> Map.take(@fields) |> Map.put(:owner, owners[nursery.user_id])
  end
end
