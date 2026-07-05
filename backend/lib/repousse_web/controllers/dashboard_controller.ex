defmodule RepousseWeb.DashboardController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Repo
  alias Repousse.Accounts
  alias Repousse.Accounts.{User, UserProfile}
  alias Repousse.Distributions.{Slot, ReservationItem}
  alias Repousse.Projects.{Project, PreferredSpecies}
  import Ecto.Query

  tags(["dashboard"])

  # ── EP-06 platform-admin gate ────────────────────────────────────────────
  #
  # There is no dedicated Dashboard policy module: per epic-06's dependency
  # note ("EP-02 (Auth) — contrôle d'accès au tableau de bord") and the
  # current scope of this backend, the whole dashboard is platform-admin
  # only. A single inline check per action is enough; a full Bodyguard
  # policy module would be overengineering for one permission.
  defp authorize(conn) do
    if Accounts.admin?(conn.assigns[:current_user]) do
      :ok
    else
      {:error, :forbidden}
    end
  end

  operation(:indicators,
    summary: "Distribution & impact indicators (US-DB-03)",
    description:
      "Synthetic KPIs for the dashboard home: plants distributed (total and " <>
        "by taxon category), active planting projects, and active volunteers " <>
        "(aggregated headcount only). Filterable by period.",
    parameters: [
      date_from: [in: :query, type: :string, description: "ISO8601 date, inclusive lower bound"],
      date_to: [in: :query, type: :string, description: "ISO8601 date, inclusive upper bound"],
      department: [
        in: :query,
        type: :string,
        description: "Not implemented yet (no structured commune/department data model)"
      ]
    ],
    responses: [
      ok: "Indicators",
      forbidden: "Not a platform admin",
      bad_request: "Invalid filters"
    ]
  )

  def indicators(conn, params) do
    with :ok <- authorize(conn),
         :ok <- reject_unsupported_department_filter(params),
         {:ok, period} <- parse_period(params) do
      {from_dt, to_dt} = to_datetime_bounds(period)

      plants_by_category =
        from(ri in ReservationItem,
          join: t in assoc(ri, :taxon),
          left_join: c in assoc(t, :category),
          join: r in assoc(ri, :reservation),
          join: e in assoc(r, :event),
          as: :event,
          where: not is_nil(ri.distributed_qty),
          group_by: c.name,
          select: {c.name, sum(ri.distributed_qty)}
        )
        |> filter_event_period(from_dt, to_dt)
        |> Repo.all()
        |> Map.new(fn {name, qty} -> {name || "Inconnu", qty} end)

      total_plants_distributed = plants_by_category |> Map.values() |> Enum.sum()

      active_volunteers_count =
        Repo.one(
          from u in User,
            join: p in UserProfile,
            on: p.user_id == u.id,
            where: u.status == :active and p.profile_type == :volunteer,
            select: count(u.id, :distinct)
        )

      active_projects_count =
        Repo.aggregate(from(p in Project, where: is_nil(p.archived_at)), :count)

      stats = %{
        total_plants_distributed: total_plants_distributed,
        plants_distributed_by_category: plants_by_category,
        # US-DB-03 also asks for "nombre de racines nues distribuées" and
        # "nombre de communes ayant bénéficié de distributions". Neither is
        # computable today: there's no field distinguishing bare-root stock,
        # and no structured commune/department column on projects or
        # reservations (only a free-text `address`). Left nil rather than
        # guessed — same class of gap as the CO2 coefficients.
        bare_root_plants_distributed: nil,
        communes_served_count: nil,
        active_planting_projects_count: active_projects_count,
        active_volunteers_count: active_volunteers_count,
        # "Comparaison avec la période précédente" is explicitly "à
        # confirmer en atelier" in the epic's open points — not implemented.
        previous_period_comparison: nil,
        filters: %{date_from: period.from, date_to: period.to, department: nil},
        generated_at: DateTime.utc_now()
      }

      json(conn, %{data: stats})
    end
  end

  operation(:co2,
    summary: "CO2 impact indicators (US-DB-04) — blocked on open decision",
    description:
      "Not implemented: CO2 coefficients per taxon category are an explicit " <>
        "open point in epic-06 (base: modèle Citizing, à définir en atelier). " <>
        "Returns a stub rather than guessed coefficients.",
    responses: [
      ok: "Stub response",
      forbidden: "Not a platform admin"
    ]
  )

  def co2(conn, _params) do
    with :ok <- authorize(conn) do
      # Do NOT invent coefficients here. See docs/roadmap/epic-06-tableau-de-bord.md
      # ("Coefficients CO2 par catégorie de taxon — base : modèle Citizing, à
      # définir") and ROADMAP.md's "Points ouverts transversaux". Once the
      # coefficients are decided, this should reuse the same
      # plants_distributed_by_category aggregation as `indicators/2` and
      # multiply by the agreed tCO2eq/unit/year (and lifetime) figures, with
      # the calculation assumptions (e.g. survival rate) surfaced alongside.
      json(conn, %{
        data: %{
          co2_avoided_tons_per_year_by_category: nil,
          co2_avoided_tons_lifetime_by_category: nil,
          assumptions: nil,
          note:
            "not_implemented: CO2 coefficients per taxon category are pending a workshop " <>
              "decision (epic-06 open point, Citizing model as base) — do not guess"
        }
      })
    end
  end

  operation(:map_distributions,
    summary: "Distribution geography (US-DB-06)",
    description:
      "Plants distributed grouped by the address of the planting project " <>
        "the distribution was reserved for (per US-DB-06, geographic data " <>
        "comes from planting project addresses, not distribution event " <>
        "venues). Filterable by period.",
    parameters: [
      date_from: [in: :query, type: :string, description: "ISO8601 date, inclusive lower bound"],
      date_to: [in: :query, type: :string, description: "ISO8601 date, inclusive upper bound"],
      department: [
        in: :query,
        type: :string,
        description: "Not implemented yet (no structured commune/department data model)"
      ]
    ],
    responses: [
      ok: "Distribution map points",
      forbidden: "Not a platform admin",
      bad_request: "Invalid filters"
    ]
  )

  def map_distributions(conn, params) do
    with :ok <- authorize(conn),
         :ok <- reject_unsupported_department_filter(params),
         {:ok, period} <- parse_period(params) do
      {from_dt, to_dt} = to_datetime_bounds(period)

      # Previously queried a non-existent `Event.location` field (distribution
      # events don't carry a single location — see `Slot`). Per US-DB-06 the
      # map is about impact geography, which the epic says comes from the
      # *planting project* addresses linked to each distribution reservation,
      # not the distribution venue. Choropleth bucketing by commune/
      # département (legend tranches, zoom department → commune) needs
      # structured geo boundaries this schema doesn't have yet — left to the
      # frontend/a later pass once that data model lands; this returns the
      # raw per-project points and totals it can bucket from.
      zones =
        from(ri in ReservationItem,
          join: r in assoc(ri, :reservation),
          join: e in assoc(r, :event),
          as: :event,
          join: p in assoc(r, :project),
          where: not is_nil(ri.distributed_qty) and not is_nil(p.address),
          group_by: [p.id, p.address, p.lat, p.lng],
          select: %{
            project_id: p.id,
            address: p.address,
            lat: p.lat,
            lng: p.lng,
            plants_distributed: sum(ri.distributed_qty)
          }
        )
        |> filter_event_period(from_dt, to_dt)
        |> Repo.all()

      json(conn, %{
        data: zones,
        filters: %{date_from: period.from, date_to: period.to, department: nil},
        generated_at: DateTime.utc_now()
      })
    end
  end

  operation(:map_projects,
    summary: "Planting projects geography (US-DB-07)",
    description:
      "Planting projects (public and private — this whole dashboard is " <>
        "platform-admin only) as map points, with plants distributed and " <>
        "surface. Filterable by status (active/archived) and taxon category.",
    parameters: [
      status: [in: :query, type: :string, description: "\"active\" or \"archived\""],
      category: [in: :query, type: :string, description: "Taxon category slug"]
    ],
    responses: [
      ok: "Project map points",
      forbidden: "Not a platform admin",
      bad_request: "Invalid filters"
    ]
  )

  def map_projects(conn, params) do
    with :ok <- authorize(conn),
         {:ok, status_filter} <- parse_status_filter(params["status"]) do
      category_slug = normalize_blank(params["category"])
      matching_project_ids = matching_project_ids_for_category(category_slug)
      plants_by_project = plants_distributed_by_project()

      data =
        Project
        |> where([p], not is_nil(p.address))
        |> apply_status_filter(status_filter)
        |> Repo.all()
        |> Enum.filter(fn p ->
          is_nil(matching_project_ids) or MapSet.member?(matching_project_ids, p.id)
        end)
        |> Enum.map(fn p ->
          %{
            id: p.id,
            name: p.name,
            address: p.address,
            lat: p.lat,
            lng: p.lng,
            surface_m2: p.surface_m2,
            status: if(p.archived_at, do: "archived", else: "active"),
            publication_status: p.publication_status,
            plants_distributed: Map.get(plants_by_project, p.id, 0)
          }
        end)

      json(conn, %{data: data, generated_at: DateTime.utc_now()})
    end
  end

  operation(:calendar,
    summary: "Activity calendar (US-DB-08)",
    description:
      "Published distribution slots (date, time, location) as calendar " <>
        "entries. Filterable by period.",
    parameters: [
      date_from: [in: :query, type: :string, description: "ISO8601 date, inclusive lower bound"],
      date_to: [in: :query, type: :string, description: "ISO8601 date, inclusive upper bound"]
    ],
    responses: [
      ok: "Calendar entries",
      forbidden: "Not a platform admin",
      bad_request: "Invalid filters"
    ]
  )

  def calendar(conn, params) do
    with :ok <- authorize(conn),
         {:ok, period} <- parse_period(params) do
      # US-DB-08 also calls for "ateliers" and partner-organized events on
      # this calendar. The only schema-backed activity today is distribution
      # slots — the epic's own open points list "types d'ateliers et
      # événements partenaires dans le calendrier — gérés depuis la
      # plateforme ou saisie manuelle ?" as undecided. Once that's settled
      # this action should union in whatever store backs those.
      events =
        from(s in Slot,
          as: :slot,
          join: e in assoc(s, :event),
          where: e.status == :published,
          order_by: [asc: s.date, asc: s.start_time],
          select: %{
            event_id: e.id,
            event_title: e.title,
            slot_id: s.id,
            date: s.date,
            start_time: s.start_time,
            end_time: s.end_time,
            location_name: s.location_name,
            address: s.address
          }
        )
        |> filter_slot_period(period.from, period.to)
        |> Repo.all()

      json(conn, %{
        data: events,
        filters: %{date_from: period.from, date_to: period.to},
        generated_at: DateTime.utc_now()
      })
    end
  end

  operation(:export,
    summary: "Raw data export (US-DB-09)",
    description:
      "Exports filtered raw data. `type` (path) selects the file format; " <>
        "`resource` (query) selects which dataset. Only CSV is implemented " <>
        "for now — xlsx/pdf are stubbed pending a writer library decision.",
    parameters: [
      type: [in: :path, type: :string, description: "\"csv\", \"xlsx\", or \"pdf\""],
      resource: [
        in: :query,
        type: :string,
        description: "\"plants_distributed\", \"planting_projects\", or \"active_volunteers\""
      ],
      date_from: [in: :query, type: :string, description: "ISO8601 date, inclusive lower bound"],
      date_to: [in: :query, type: :string, description: "ISO8601 date, inclusive upper bound"],
      category: [in: :query, type: :string, description: "Taxon category slug"],
      department: [
        in: :query,
        type: :string,
        description: "Not implemented yet (no structured commune/department data model)"
      ]
    ],
    responses: [
      ok: "CSV file or not_implemented stub",
      forbidden: "Not a platform admin",
      bad_request: "Invalid filters/format/resource"
    ]
  )

  def export(conn, %{"type" => format} = params) when format in ["csv", "xlsx", "pdf"] do
    with :ok <- authorize(conn),
         {:ok, resource} <- validate_resource(params["resource"]),
         :ok <- reject_unsupported_department_filter(params),
         {:ok, period} <- parse_period(params) do
      category_slug = normalize_blank(params["category"])
      do_export(conn, format, resource, period, category_slug)
    end
  end

  def export(conn, _params) do
    with :ok <- authorize(conn) do
      conn |> put_status(:bad_request) |> json(%{error: "Unsupported export format"})
    end
  end

  defp do_export(conn, "csv", resource, period, category_slug) do
    {headers, rows} = build_export_rows(resource, period, category_slug)

    meta = [
      "# Export généré le #{DateTime.to_iso8601(DateTime.utc_now())}",
      "# Filtres appliqués : resource=#{resource}; date_from=#{period.from || "-"}; " <>
        "date_to=#{period.to || "-"}; categorie=#{category_slug || "-"}; departement=non supporté"
    ]

    csv = to_csv(meta, headers, rows)

    conn
    |> put_resp_content_type("text/csv")
    |> put_resp_header("content-disposition", ~s(attachment; filename="#{resource}.csv"))
    |> send_resp(200, csv)
  end

  # xlsx/pdf are explicitly in scope per US-DB-09 ("Formats : CSV, Excel
  # (.xlsx), PDF") but need a dedicated writer this app doesn't have wired up
  # yet (e.g. `elixlsx` for xlsx; some HTML→PDF or report-builder approach for
  # pdf). Deferred rather than half-built — stubbed like `co2/2`.
  defp do_export(conn, format, resource, _period, _category_slug)
       when format in ["xlsx", "pdf"] do
    json(conn, %{
      data: %{
        format: format,
        resource: resource,
        url: nil,
        note:
          "not_implemented: #{format} export needs a writer library decision (epic-06 US-DB-09)"
      }
    })
  end

  defp validate_resource(resource)
       when resource in ["plants_distributed", "planting_projects", "active_volunteers"] do
    {:ok, resource}
  end

  defp validate_resource(nil) do
    {:error,
     "Missing required 'resource' query param. Expected one of: plants_distributed, " <>
       "planting_projects, active_volunteers"}
  end

  defp validate_resource(other) do
    {:error,
     "Unsupported resource #{inspect(other)}. Expected one of: plants_distributed, " <>
       "planting_projects, active_volunteers"}
  end

  defp build_export_rows("plants_distributed", period, category_slug) do
    {from_dt, to_dt} = to_datetime_bounds(period)

    rows =
      from(ri in ReservationItem,
        join: t in assoc(ri, :taxon),
        left_join: c in assoc(t, :category),
        as: :category,
        join: r in assoc(ri, :reservation),
        join: e in assoc(r, :event),
        as: :event,
        left_join: p in assoc(r, :project),
        where: not is_nil(ri.distributed_qty),
        order_by: [desc: e.published_at],
        # No structured "commune" field exists yet on projects or
        # reservations (see epic-06 open point on geographic granularity)
        # — using the planting project's free-text address as a
        # best-effort stand-in, documented here rather than silently
        # mislabeled.
        select: {t.common_name, c.name, ri.distributed_qty, e.published_at, p.address}
      )
      |> filter_event_period(from_dt, to_dt)
      |> filter_category(category_slug)
      |> Repo.all()

    headers = ["taxon", "categorie", "quantite", "date", "commune"]

    data =
      Enum.map(rows, fn {taxon, category, qty, date, address} ->
        [taxon, category || "Inconnu", qty, date, address]
      end)

    {headers, data}
  end

  defp build_export_rows("planting_projects", _period, category_slug) do
    taxa_by_project =
      Repo.all(
        from ps in PreferredSpecies,
          join: t in assoc(ps, :taxon),
          left_join: c in assoc(t, :category),
          select: {ps.project_id, t.common_name, c.slug}
      )
      |> Enum.group_by(fn {project_id, _name, _slug} -> project_id end, fn {_id, name, slug} ->
        {name, slug}
      end)

    matching_ids =
      if category_slug do
        taxa_by_project
        |> Enum.filter(fn {_id, taxa} ->
          Enum.any?(taxa, fn {_name, slug} -> slug == category_slug end)
        end)
        |> Enum.map(fn {id, _taxa} -> id end)
        |> MapSet.new()
      end

    rows =
      Project
      |> where([p], not is_nil(p.address))
      |> Repo.all()
      |> Enum.filter(fn p -> is_nil(matching_ids) or MapSet.member?(matching_ids, p.id) end)
      |> Enum.map(fn p ->
        taxa_names =
          taxa_by_project
          |> Map.get(p.id, [])
          |> Enum.map(&elem(&1, 0))
          |> Enum.uniq()
          |> Enum.join("; ")

        [anonymized_project_name(p), p.address, p.surface_m2, taxa_names]
      end)

    {["nom", "commune", "surface_m2", "taxons"], rows}
  end

  defp build_export_rows("active_volunteers", _period, _category_slug) do
    count =
      Repo.one(
        from u in User,
          join: p in UserProfile,
          on: p.user_id == u.id,
          where: u.status == :active and p.profile_type == :volunteer,
          select: count(u.id, :distinct)
      )

    # Deliberately a single aggregated row with no geographic breakdown: the
    # only "zone" data available today is each volunteer's free-text profile
    # address, and grouping by it would create groups small enough to
    # re-identify individuals — exactly what US-DB-09's "agrégée sans données
    # individuelles" rule forbids. A real geographic breakdown needs
    # structured department/commune data (same open point as the CO2
    # coefficients and the choropleth maps).
    {["benevoles_actifs_total"], [[count]]}
  end

  defp anonymized_project_name(%Project{publication_status: :private} = project) do
    "Projet privé " <> String.slice(project.id, 0, 8)
  end

  defp anonymized_project_name(%Project{name: name}), do: name

  defp matching_project_ids_for_category(nil), do: nil

  defp matching_project_ids_for_category(category_slug) do
    from(ps in PreferredSpecies,
      join: t in assoc(ps, :taxon),
      join: c in assoc(t, :category),
      where: c.slug == ^category_slug,
      select: ps.project_id,
      distinct: true
    )
    |> Repo.all()
    |> MapSet.new()
  end

  defp plants_distributed_by_project do
    from(ri in ReservationItem,
      join: r in assoc(ri, :reservation),
      where: not is_nil(ri.distributed_qty),
      group_by: r.project_id,
      select: {r.project_id, sum(ri.distributed_qty)}
    )
    |> Repo.all()
    |> Map.new()
  end

  defp parse_status_filter(nil), do: {:ok, nil}
  defp parse_status_filter("active"), do: {:ok, :active}
  defp parse_status_filter("archived"), do: {:ok, :archived}

  defp parse_status_filter(other),
    do: {:error, "Invalid 'status' filter #{inspect(other)}, expected 'active' or 'archived'"}

  defp apply_status_filter(query, nil), do: query
  defp apply_status_filter(query, :active), do: where(query, [p], is_nil(p.archived_at))
  defp apply_status_filter(query, :archived), do: where(query, [p], not is_nil(p.archived_at))

  # Ecto forbids comparing a field directly to a pinned value that might be
  # `nil` at runtime (`field >= ^val` raises `ArgumentError` if `val` is nil,
  # and guarding it inline with `is_nil(^val) or ...` both hits that same
  # guard *and* leaves Postgres unable to infer the parameter's type). The
  # safe pattern is to only add the `where` when the bound is actually
  # present, via named bindings (`as: :event` / `as: :slot` / `as: :category`
  # declared on the queries above).
  defp filter_event_period(query, nil, nil), do: query

  defp filter_event_period(query, from_dt, to_dt) do
    query
    |> filter_event_from(from_dt)
    |> filter_event_to(to_dt)
  end

  defp filter_event_from(query, nil), do: query
  defp filter_event_from(query, from_dt), do: where(query, [event: e], e.published_at >= ^from_dt)

  defp filter_event_to(query, nil), do: query
  defp filter_event_to(query, to_dt), do: where(query, [event: e], e.published_at <= ^to_dt)

  defp filter_slot_period(query, nil, nil), do: query

  defp filter_slot_period(query, from, to) do
    query
    |> filter_slot_from(from)
    |> filter_slot_to(to)
  end

  defp filter_slot_from(query, nil), do: query
  defp filter_slot_from(query, from), do: where(query, [slot: s], s.date >= ^from)

  defp filter_slot_to(query, nil), do: query
  defp filter_slot_to(query, to), do: where(query, [slot: s], s.date <= ^to)

  defp filter_category(query, nil), do: query

  defp filter_category(query, category_slug),
    do: where(query, [category: c], c.slug == ^category_slug)

  # Département filtering (US-DB-03, US-DB-06, US-DB-09) is an epic
  # requirement this schema can't honor yet: projects/reservations only carry
  # a free-text `address`, no structured commune/department column. Rather
  # than silently ignore the filter (and risk an admin believing they're
  # viewing department-scoped data when they aren't), reject explicitly.
  defp reject_unsupported_department_filter(params) do
    case normalize_blank(params["department"]) do
      nil ->
        :ok

      _ ->
        {:error,
         "Department filtering is not supported yet: distributions/projects have no " <>
           "structured commune/department field (see epic-06 open point on geographic " <>
           "granularity)."}
    end
  end

  defp parse_period(params) do
    with {:ok, from} <- parse_optional_date(params["date_from"], "date_from"),
         {:ok, to} <- parse_optional_date(params["date_to"], "date_to") do
      {:ok, %{from: from, to: to}}
    end
  end

  defp parse_optional_date(value, _field) when value in [nil, ""], do: {:ok, nil}

  defp parse_optional_date(value, field) do
    case Date.from_iso8601(value) do
      {:ok, date} -> {:ok, date}
      {:error, _} -> {:error, "Invalid '#{field}', expected an ISO8601 date (YYYY-MM-DD)"}
    end
  end

  defp to_datetime_bounds(%{from: from, to: to}) do
    {from && DateTime.new!(from, ~T[00:00:00], "Etc/UTC"),
     to && DateTime.new!(to, ~T[23:59:59], "Etc/UTC")}
  end

  defp normalize_blank(nil), do: nil
  defp normalize_blank(""), do: nil
  defp normalize_blank(value), do: value

  defp to_csv(meta_lines, headers, rows) do
    lines = meta_lines ++ [csv_line(headers) | Enum.map(rows, &csv_line/1)]
    Enum.join(lines, "\r\n") <> "\r\n"
  end

  defp csv_line(fields), do: fields |> Enum.map(&csv_escape/1) |> Enum.join(",")

  defp csv_escape(nil), do: ""

  defp csv_escape(value) when is_binary(value) do
    if String.contains?(value, [",", "\"", "\n", "\r"]) do
      ~s(") <> String.replace(value, "\"", "\"\"") <> ~s(")
    else
      value
    end
  end

  defp csv_escape(%Date{} = date), do: Date.to_iso8601(date)
  defp csv_escape(%Time{} = time), do: Time.to_iso8601(time)
  defp csv_escape(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp csv_escape(value), do: to_string(value)
end
