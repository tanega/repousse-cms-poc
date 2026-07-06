defmodule RepousseWeb.DashboardController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Repo
  alias Repousse.Accounts.User
  alias Repousse.Distributions.{Event, Reservation}
  alias Repousse.Projects.Project
  alias Repousse.Taxa.Taxon
  alias RepousseWeb.OpenApiHelpers, as: API
  import Ecto.Query

  tags ["Dashboard"]
  security [%{"bearerAuth" => []}]

  operation :indicators,
    summary: "Get aggregate platform indicators",
    responses: [ok: API.object("Indicators")]

  def indicators(conn, _params) do
    stats = %{
      users: %{
        total: Repo.aggregate(User, :count),
        active: Repo.aggregate(from(u in User, where: u.status == :active), :count)
      },
      distributions: %{
        total: Repo.aggregate(Event, :count),
        published: Repo.aggregate(from(e in Event, where: e.status == :published), :count)
      },
      reservations: %{
        total: Repo.aggregate(Reservation, :count),
        confirmed: Repo.aggregate(from(r in Reservation, where: r.status == :confirmed), :count)
      },
      projects: %{
        total: Repo.aggregate(Project, :count),
        public: Repo.aggregate(from(p in Project, where: p.publication_status == :public), :count)
      },
      taxa: %{
        total: Repo.aggregate(Taxon, :count)
      }
    }

    json(conn, %{data: stats})
  end

  operation :co2,
    summary: "Get estimated CO2 impact",
    responses: [ok: API.object("CO2 estimate")]

  def co2(conn, _params) do
    json(conn, %{data: %{estimated_kg: 0, note: "not_implemented"}})
  end

  operation :map_distributions,
    summary: "List published distributions with a location, for the map",
    responses: [ok: API.list("Distributions with locations")]

  def map_distributions(conn, _params) do
    events =
      Repo.all(
        from e in Event,
          where: not is_nil(e.location) and e.status == :published,
          select: %{id: e.id, title: e.title, location: e.location}
      )

    json(conn, %{data: events})
  end

  operation :map_projects,
    summary: "List public projects with an address, for the map",
    responses: [ok: API.list("Projects with addresses")]

  def map_projects(conn, _params) do
    projects =
      Repo.all(
        from p in Project,
          where: p.publication_status == :public and not is_nil(p.address),
          select: %{id: p.id, title: p.title, address: p.address}
      )

    json(conn, %{data: projects})
  end

  operation :calendar,
    summary: "List published distributions for the calendar view",
    responses: [ok: API.list("Calendar events")]

  def calendar(conn, _params) do
    events =
      Repo.all(
        from e in Event,
          where: e.status == :published,
          select: %{id: e.id, title: e.title, published_at: e.published_at}
      )

    json(conn, %{data: events})
  end

  operation :export,
    summary: "Export dashboard data",
    parameters: [
      type: [in: :path, type: :string, description: "Export format", example: "csv"]
    ],
    responses: [
      ok: API.object("Export result"),
      bad_request: API.object("Unsupported export format")
    ]

  def export(conn, %{"type" => type}) when type in ["csv", "xlsx", "pdf"] do
    json(conn, %{data: %{format: type, url: nil, note: "not_implemented"}})
  end

  def export(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Unsupported export format"})
  end
end
