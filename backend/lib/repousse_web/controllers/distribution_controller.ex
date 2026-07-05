defmodule RepousseWeb.DistributionController do
  @moduledoc """
  Member-facing read access to distribution events (US-DIST-06). Management
  actions (create/update/publish/close) live under
  `RepousseWeb.Admin.DistributionController`, gated by the `:admin` role.
  """
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions

  tags(["distributions"])
  security([%{"bearerAuth" => []}])

  operation(:index,
    summary: "List distribution events (US-DIST-06)",
    responses: [ok: {"Distribution events", "application/json", %Schema{type: :object}}]
  )

  def index(conn, _params) do
    events = Distributions.list_events()
    json(conn, %{data: events})
  end

  operation(:show,
    summary: "Consult a distribution event (US-DIST-06)",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [
      ok: {"Distribution event", "application/json", %Schema{type: :object}},
      not_found: {"Not found", "application/json", %Schema{type: :object}}
    ]
  )

  def show(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    json(conn, %{data: event})
  end
end
