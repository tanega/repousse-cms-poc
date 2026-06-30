defmodule RepousseWeb.CorsController do
  use RepousseWeb, :controller

  def preflight(conn, _params) do
    CORSPlug.call(conn, CORSPlug.init([]))
  end
end
