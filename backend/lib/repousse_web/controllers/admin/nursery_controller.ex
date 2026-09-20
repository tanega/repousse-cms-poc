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
      "Includes nurseries of members whose profile is private. `taxon_id` narrows the " <>
        "listing to nurseries declaring stock for that taxon.",
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

      json(conn, %{data: Nurseries.list_all_nurseries(opts)})
    end
  end
end
