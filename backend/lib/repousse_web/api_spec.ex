defmodule RepousseWeb.ApiSpec do
  @moduledoc """
  OpenAPI spec root. Each controller adds its own `operation/2` specs
  (`use OpenApiSpex.ControllerSpecs` + `operation :action, ...`); this module
  just assembles them from the router at request time — nothing here needs
  to change as tracks add endpoints.
  """
  @behaviour OpenApiSpex.OpenApi

  alias OpenApiSpex.{Components, Info, OpenApi, Paths, SecurityScheme, Server}

  @impl OpenApiSpex.OpenApi
  def spec do
    %OpenApi{
      servers: [Server.from_endpoint(RepousseWeb.Endpoint)],
      info: %Info{title: "Repousse API", version: "1.0.0"},
      paths: Paths.from_router(RepousseWeb.Router),
      components: %Components{
        securitySchemes: %{
          "bearerAuth" => %SecurityScheme{
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT (Hanko)"
          }
        }
      }
    }
    |> OpenApiSpex.resolve_schema_modules()
  end
end
