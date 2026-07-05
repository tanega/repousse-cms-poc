defmodule RepousseWeb.DashboardControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Repo
  alias Repousse.Distributions.{Slot, Stock, Reservation, ReservationItem}
  alias RepousseWeb.DashboardController

  # Controller actions are invoked directly via `Controller.call/2` (the
  # function Phoenix generates from `use Phoenix.Controller`), bypassing the
  # router's :authenticated/:admin plug pipelines (which require a real signed
  # Hanko JWT — see `RepousseWeb.Plugs.AuthPlugTest` for that machinery). This
  # still exercises `action_fallback` and the controller's own authorization
  # check exactly as the router would invoke them; only the outer plug
  # pipeline is skipped.
  defp call(conn, action, user, params \\ %{}) do
    conn
    |> Map.put(:params, params)
    |> Plug.Conn.assign(:current_user, user)
    |> DashboardController.call(action)
  end

  # ── Fixtures ──────────────────────────────────────────────────────────────

  defp insert_slot!(event, attrs) do
    %Slot{
      location_name: "Local association",
      address: "1 rue des Tilleuls, 75001 Paris",
      date: ~D[2026-06-01],
      start_time: ~T[09:00:00],
      end_time: ~T[12:00:00],
      event_id: event.id
    }
    |> struct!(attrs)
    |> Repo.insert!()
  end

  defp insert_stock!(event, taxon, attrs \\ %{}) do
    %Stock{quantity: 100, event_id: event.id, taxon_id: taxon.id}
    |> struct!(attrs)
    |> Repo.insert!()
  end

  defp insert_reservation!(user, slot, event, project, attrs \\ %{}) do
    %Reservation{
      status: :validated,
      user_id: user.id,
      slot_id: slot.id,
      event_id: event.id,
      project_id: project.id
    }
    |> struct!(attrs)
    |> Repo.insert!()
  end

  defp insert_reservation_item!(reservation, stock, taxon, attrs) do
    %ReservationItem{
      reserved_qty: 5,
      distributed_qty: 5,
      reservation_id: reservation.id,
      stock_id: stock.id,
      taxon_id: taxon.id
    }
    |> struct!(attrs)
    |> Repo.insert!()
  end

  # Builds one full distribution: a published event with one slot, a stock of
  # the given taxon, a validated reservation tied to `project`, and a
  # reservation item recording `distributed_qty` plants actually handed out.
  defp seed_distribution!(taxon, project, opts) do
    published_at = Keyword.get(opts, :published_at, ~U[2026-06-01 10:00:00Z])
    distributed_qty = Keyword.get(opts, :distributed_qty, 5)

    event =
      insert(:distribution_event, status: :published, published_at: published_at)

    slot = insert_slot!(event, %{date: DateTime.to_date(published_at)})
    stock = insert_stock!(event, taxon)
    beneficiary = insert(:user)
    reservation = insert_reservation!(beneficiary, slot, event, project)

    insert_reservation_item!(reservation, stock, taxon, %{distributed_qty: distributed_qty})

    %{event: event, slot: slot, stock: stock, reservation: reservation}
  end

  setup do
    admin = insert(:admin_user)
    member = insert(:user, role: :member)
    %{admin: admin, member: member}
  end

  # ── Authorization gate (every action) ───────────────────────────────────

  describe "authorization" do
    test "every dashboard action is forbidden to a non-admin", %{member: member} do
      for action <- [:indicators, :co2, :map_distributions, :map_projects, :calendar] do
        conn = call(build_conn(), action, member)
        assert conn.status == 403, "expected #{action} to 403 a non-admin"
      end

      conn =
        call(build_conn(), :export, member, %{"type" => "csv", "resource" => "plants_distributed"})

      assert conn.status == 403
    end
  end

  # ── indicators (US-DB-03) ────────────────────────────────────────────────

  describe "indicators" do
    test "admin gets 200 with plant/project/volunteer indicators", %{admin: admin} do
      category = insert(:taxon_category, name: "Arbres")
      taxon = insert(:taxon, category: category)
      project = insert(:project, publication_status: :public)
      seed_distribution!(taxon, project, distributed_qty: 7)

      insert(:user_profile, profile_type: :volunteer, user: build(:user, status: :active))

      conn = call(build_conn(), :indicators, admin)
      assert conn.status == 200

      %{"data" => data} = json_response(conn, 200)
      assert data["total_plants_distributed"] == 7
      assert data["plants_distributed_by_category"]["Arbres"] == 7
      assert data["active_planting_projects_count"] >= 1
      assert data["active_volunteers_count"] >= 1
      assert data["filters"]["department"] == nil
      assert Map.has_key?(data, "generated_at")
      # Explicitly left nil / not guessed — see code comments for why.
      assert data["bare_root_plants_distributed"] == nil
      assert data["communes_served_count"] == nil
      assert data["previous_period_comparison"] == nil
    end

    test "filters by date range", %{admin: admin} do
      category = insert(:taxon_category)
      taxon = insert(:taxon, category: category)
      project = insert(:project)

      seed_distribution!(taxon, project,
        published_at: ~U[2025-01-01 10:00:00Z],
        distributed_qty: 3
      )

      seed_distribution!(taxon, project,
        published_at: ~U[2026-06-01 10:00:00Z],
        distributed_qty: 9
      )

      conn =
        call(build_conn(), :indicators, admin, %{
          "date_from" => "2026-01-01",
          "date_to" => "2026-12-31"
        })

      %{"data" => data} = json_response(conn, 200)
      assert data["total_plants_distributed"] == 9
    end

    test "rejects an unsupported department filter with a clear 400", %{admin: admin} do
      conn = call(build_conn(), :indicators, admin, %{"department" => "75"})
      assert conn.status == 400
      assert json_response(conn, 400)["error"] =~ "Department filtering is not supported"
    end

    test "rejects an invalid date filter with a clear 400", %{admin: admin} do
      conn = call(build_conn(), :indicators, admin, %{"date_from" => "not-a-date"})
      assert conn.status == 400
      assert json_response(conn, 400)["error"] =~ "date_from"
    end
  end

  # ── co2 (US-DB-04, deliberately stubbed) ────────────────────────────────

  describe "co2" do
    test "admin gets 200 with an explicit not_implemented stub", %{admin: admin} do
      conn = call(build_conn(), :co2, admin)
      assert conn.status == 200

      %{"data" => data} = json_response(conn, 200)
      assert data["co2_avoided_tons_per_year_by_category"] == nil
      assert data["note"] =~ "not_implemented"
    end
  end

  # ── map_distributions (US-DB-06) ────────────────────────────────────────

  describe "map_distributions" do
    test "admin gets 200 with plants distributed grouped by project address", %{admin: admin} do
      category = insert(:taxon_category)
      taxon = insert(:taxon, category: category)
      project = insert(:project, address: "12 rue de la Mairie, 69001 Lyon")
      seed_distribution!(taxon, project, distributed_qty: 4)

      conn = call(build_conn(), :map_distributions, admin)
      assert conn.status == 200

      %{"data" => [zone]} = json_response(conn, 200)
      assert zone["address"] == "12 rue de la Mairie, 69001 Lyon"
      assert zone["plants_distributed"] == 4
    end

    test "rejects an unsupported department filter", %{admin: admin} do
      conn = call(build_conn(), :map_distributions, admin, %{"department" => "69"})
      assert conn.status == 400
    end
  end

  # ── map_projects (US-DB-07) ──────────────────────────────────────────────

  describe "map_projects" do
    test "admin sees both public and private projects with plant counts and surface", %{
      admin: admin
    } do
      category = insert(:taxon_category)
      taxon = insert(:taxon, category: category)

      public_project =
        insert(:project, publication_status: :public, surface_m2: 120.0, address: "1 rue A")

      private_project =
        insert(:project, publication_status: :private, surface_m2: 40.0, address: "2 rue B")

      seed_distribution!(taxon, public_project, distributed_qty: 6)

      conn = call(build_conn(), :map_projects, admin)
      assert conn.status == 200

      %{"data" => projects} = json_response(conn, 200)
      ids = Enum.map(projects, & &1["id"])
      assert public_project.id in ids
      assert private_project.id in ids

      public_entry = Enum.find(projects, &(&1["id"] == public_project.id))
      assert public_entry["plants_distributed"] == 6
      assert public_entry["surface_m2"] == 120.0
      assert public_entry["status"] == "active"
    end

    test "filters by status=archived", %{admin: admin} do
      archived =
        insert(:project,
          address: "3 rue C",
          archived_at: DateTime.utc_now() |> DateTime.truncate(:second)
        )

      active = insert(:project, address: "4 rue D")

      conn = call(build_conn(), :map_projects, admin, %{"status" => "archived"})
      %{"data" => projects} = json_response(conn, 200)
      ids = Enum.map(projects, & &1["id"])

      assert archived.id in ids
      refute active.id in ids
    end

    test "rejects an invalid status filter", %{admin: admin} do
      conn = call(build_conn(), :map_projects, admin, %{"status" => "bogus"})
      assert conn.status == 400
    end
  end

  # ── calendar (US-DB-08) ──────────────────────────────────────────────────

  describe "calendar" do
    test "admin gets 200 with published distribution slots", %{admin: admin} do
      event =
        insert(:distribution_event, status: :published, published_at: ~U[2026-06-01 10:00:00Z])

      slot = insert_slot!(event, %{date: ~D[2026-06-10]})

      draft_event = insert(:distribution_event, status: :draft)
      insert_slot!(draft_event, %{date: ~D[2026-06-11]})

      conn = call(build_conn(), :calendar, admin)
      assert conn.status == 200

      %{"data" => entries} = json_response(conn, 200)
      assert [entry] = entries
      assert entry["slot_id"] == slot.id
      assert entry["event_id"] == event.id
      assert entry["date"] == "2026-06-10"
    end
  end

  # ── export (US-DB-09) ────────────────────────────────────────────────────

  describe "export" do
    test "csv export of plants_distributed returns a real CSV body", %{admin: admin} do
      category = insert(:taxon_category, name: "Fruitiers")
      taxon = insert(:taxon, category: category, common_name: "Pommier")
      project = insert(:project, address: "5 impasse des Fleurs")
      seed_distribution!(taxon, project, distributed_qty: 3)

      conn =
        call(build_conn(), :export, admin, %{"type" => "csv", "resource" => "plants_distributed"})

      assert conn.status == 200
      assert get_resp_header(conn, "content-type") |> hd() =~ "text/csv"

      body = conn.resp_body
      assert body =~ "# Export généré le"
      assert body =~ "taxon,categorie,quantite,date,commune"
      assert body =~ "Pommier,Fruitiers,3,"
      assert body =~ "5 impasse des Fleurs"
    end

    test "csv export of planting_projects anonymizes private project names", %{admin: admin} do
      private_project = insert(:project, publication_status: :private, address: "9 rue du Bois")

      conn =
        call(build_conn(), :export, admin, %{"type" => "csv", "resource" => "planting_projects"})

      assert conn.status == 200
      refute conn.resp_body =~ private_project.name
      assert conn.resp_body =~ "Projet privé "
    end

    test "csv export of active_volunteers returns a single aggregated row", %{admin: admin} do
      insert(:user_profile, profile_type: :volunteer, user: build(:user, status: :active))

      conn =
        call(build_conn(), :export, admin, %{"type" => "csv", "resource" => "active_volunteers"})

      assert conn.status == 200
      assert conn.resp_body =~ "benevoles_actifs_total"
      # Only one data row after the two comment lines + header — no
      # per-volunteer or per-address breakdown.
      data_lines =
        conn.resp_body
        |> String.split("\r\n", trim: true)
        |> Enum.reject(&String.starts_with?(&1, "#"))

      assert length(data_lines) == 2
    end

    test "xlsx/pdf are explicitly stubbed as not_implemented", %{admin: admin} do
      for format <- ["xlsx", "pdf"] do
        conn =
          call(build_conn(), :export, admin, %{
            "type" => format,
            "resource" => "plants_distributed"
          })

        assert conn.status == 200
        %{"data" => data} = json_response(conn, 200)
        assert data["format"] == format
        assert data["note"] =~ "not_implemented"
      end
    end

    test "rejects an unsupported format", %{admin: admin} do
      conn = call(build_conn(), :export, admin, %{"type" => "yaml"})
      assert conn.status == 400
    end

    test "rejects a missing resource", %{admin: admin} do
      conn = call(build_conn(), :export, admin, %{"type" => "csv"})
      assert conn.status == 400
      assert json_response(conn, 400)["error"] =~ "resource"
    end

    test "rejects an unsupported department filter", %{admin: admin} do
      conn =
        call(build_conn(), :export, admin, %{
          "type" => "csv",
          "resource" => "plants_distributed",
          "department" => "75"
        })

      assert conn.status == 400
    end
  end
end
