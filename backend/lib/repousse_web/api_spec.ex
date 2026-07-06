defmodule RepousseWeb.ApiSpec do
  @moduledoc """
  OpenAPI spec root. Each controller adds its own `operation/2` specs
  (`use OpenApiSpex.ControllerSpecs` + `operation :action, ...`); this module
  just assembles them from the router at request time — nothing here needs
  to change as tracks add endpoints.
  """
  @behaviour OpenApiSpex.OpenApi

  alias OpenApiSpex.{Components, Info, OpenApi, Paths, SecurityScheme, Server}

  alias RepousseWeb.Schemas.{
    User,
    UserProfile,
    Project,
    ProjectMember,
    ProjectInvitation,
    JournalEntry,
    ProjectMedia,
    PreferredSpecies,
    Event,
    Slot,
    Stock,
    Reservation,
    ReservationItem,
    WaitlistEntry,
    Taxon,
    TaxonCategory,
    TaxonVersion,
    TaxonExternalLink
  }

  # Every typed response schema, listed explicitly so it shows up in
  # Swagger UI's Schemas section even before (or without) any controller
  # operation referencing it — resolve_schema_modules/1 alone only
  # registers schemas actually reached from an operation.
  @schemas [
    User,
    UserProfile,
    Project,
    ProjectMember,
    ProjectInvitation,
    JournalEntry,
    ProjectMedia,
    PreferredSpecies,
    Event,
    Slot,
    Stock,
    Reservation,
    ReservationItem,
    WaitlistEntry,
    Taxon,
    TaxonCategory,
    TaxonVersion,
    TaxonExternalLink
  ]

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
        },
        schemas: Map.new(@schemas, &{&1.schema().title, &1.schema()})
      }
    }
    |> OpenApiSpex.resolve_schema_modules()
  end
end
