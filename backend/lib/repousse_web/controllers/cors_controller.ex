defmodule RepousseWeb.CorsController do
  use RepousseWeb, :controller

  def preflight(conn, _params) do
    send_resp(conn, :no_content, "")
  end
end
