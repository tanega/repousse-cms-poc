defmodule RepousseWeb.WebhookController do
  use RepousseWeb, :controller

  alias Repousse.Integrations

  def helloasso(conn, _params) do
    Integrations.schedule_helloasso_sync()
    send_resp(conn, :ok, "")
  end
end
