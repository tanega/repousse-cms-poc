defmodule RepousseWeb.WebhookController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs

  alias Repousse.Integrations

  tags ["Webhooks"]

  operation :helloasso,
    summary: "HelloAsso payment webhook",
    description: "No auth: called by HelloAsso to notify of payment events.",
    responses: [ok: {"Acknowledged", nil, nil}]

  def helloasso(conn, _params) do
    Integrations.schedule_helloasso_sync()
    send_resp(conn, :ok, "")
  end
end
