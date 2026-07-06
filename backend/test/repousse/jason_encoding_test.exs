defmodule Repousse.JasonEncodingTest do
  @moduledoc """
  Every schema returned directly over JSON needs a Jason.Encoder — Ecto
  structs don't get one for free, and without it `json(conn, %{data: x})`
  crashes at request time (see e.g. the Project/Distributions/Taxa fixes).
  This locks in encodability for every schema built by a factory so a
  future field addition can't quietly regress it.
  """
  use Repousse.DataCase, async: true

  import Repousse.Factory

  test "User encodes" do
    assert %{"email" => _} = insert(:user) |> Repousse.Repo.preload(:profiles) |> encode()
  end

  test "UserProfile encodes" do
    assert %{"profile_type" => "adoptant"} = insert(:user_profile) |> encode()
  end

  test "Project encodes" do
    assert %{"name" => _} = insert(:project) |> encode()
  end

  test "ProjectMember encodes" do
    assert %{"role" => "reader"} = insert(:project_member) |> Repousse.Repo.preload(user: :profiles) |> encode()
  end

  test "ProjectInvitation encodes" do
    assert %{"role" => "reader"} = insert(:project_invitation) |> encode()
  end

  test "JournalEntry encodes" do
    assert %{"content" => _} = insert(:journal_entry) |> encode()
  end

  test "ProjectMedia encodes" do
    assert %{"filename" => "photo.jpg"} = insert(:project_media) |> encode()
  end

  test "PreferredSpecies encodes" do
    assert %{"id" => _} = insert(:preferred_species) |> encode()
  end

  test "Event encodes" do
    assert %{"status" => "draft"} = insert(:distribution_event) |> encode()
  end

  test "Slot encodes" do
    assert %{"location_name" => _} = insert(:slot) |> encode()
  end

  test "Stock encodes" do
    assert %{"quantity" => 50} = insert(:stock) |> encode()
  end

  test "Reservation encodes" do
    assert %{"status" => "confirmed"} = insert(:reservation) |> encode()
  end

  test "ReservationItem encodes" do
    assert %{"reserved_qty" => 2} = insert(:reservation_item) |> encode()
  end

  test "WaitlistEntry encodes" do
    assert %{"status" => "waiting"} = insert(:waitlist_entry) |> encode()
  end

  test "Taxon encodes" do
    assert %{"common_name" => _} = insert(:taxon) |> encode()
  end

  test "TaxonCategory encodes" do
    assert %{"slug" => _} = insert(:taxon_category) |> encode()
  end

  test "TaxonVersion encodes" do
    assert %{"changes" => %{}} = insert(:taxon_version) |> encode()
  end

  test "TaxonExternalLink encodes" do
    assert %{"source_name" => "Wikipedia"} = insert(:taxon_external_link) |> encode()
  end

  defp encode(struct) do
    struct |> Jason.encode!() |> Jason.decode!()
  end
end
