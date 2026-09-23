# Palier-1 import of the client's historical distribution data: taxon
# categories, taxa, ghost users (no hanko_id) and planting projects.
# Distributions/reservations are NOT imported here (they need slot dates and
# locations we don't have yet).
#
# Input: data/prepared/import_bundle.json, built by
# scripts/data-prep/export_import_bundle.py. It holds personal data — never
# commit it or bake it into an image.
#
# Safe by default: DRY-RUN unless APPLY=1. Everything runs in one
# transaction, so a failure leaves nothing behind. Idempotent: rows are
# matched on natural keys (category slug, taxon scientific name — or common
# name when there is none —, user email, project owner+name) and existing
# ones are left untouched, so re-running is harmless. No email is sent:
# rows go straight through the changesets, not the controllers.
#
# Local/dev:
#     IMPORT_FILE=../data/prepared/import_bundle.json mix run priv/repo/import_distribution_data.exs
#     APPLY=1 IMPORT_FILE=... mix run priv/repo/import_distribution_data.exs
#
# Release (file copied into the container beforehand):
#     IMPORT_FILE=/tmp/import_bundle.json bin/repousse eval 'Code.eval_file(Path.join(:code.priv_dir(:repousse), "repo/import_distribution_data.exs"))'
#     ... same with APPLY=1 once the dry-run counts look right.

import Ecto.Query

alias Repousse.Accounts.User
alias Repousse.Projects.Project
alias Repousse.Repo
alias Repousse.Taxa.{Taxon, TaxonCategory}

path = System.get_env("IMPORT_FILE") || raise "IMPORT_FILE is required"
apply? = System.get_env("APPLY") == "1"

bundle = path |> File.read!() |> Jason.decode!()

# Counters kept in the process dictionary: {entity, :inserted | :skipped}.
bump = fn key -> Process.put(key, (Process.get(key) || 0) + 1) end

insert! = fn changeset, label ->
  case Repo.insert(changeset) do
    {:ok, row} ->
      row

    {:error, cs} ->
      errors = Ecto.Changeset.traverse_errors(cs, fn {msg, _} -> msg end)
      Repo.rollback({:invalid, label, errors})
  end
end

run = fn ->
  # --- categories ---------------------------------------------------------
  categories =
    Map.new(bundle["categories"], fn %{"slug" => slug, "name" => name} ->
      case Repo.get_by(TaxonCategory, slug: slug) do
        nil ->
          bump.({:categories, :inserted})
          {slug, insert!.(TaxonCategory.changeset(%TaxonCategory{}, %{"name" => name}), "category #{slug}").id}

        existing ->
          bump.({:categories, :skipped})
          {slug, existing.id}
      end
    end)

  # --- taxa (parents before children) -------------------------------------
  find_taxon = fn t ->
    if t["scientific_name"] do
      Repo.get_by(Taxon, scientific_name: t["scientific_name"])
    else
      Repo.one(from x in Taxon, where: is_nil(x.scientific_name) and x.common_name == ^t["common_name"])
    end
  end

  insert_level = fn pending, taxon_ids ->
    {ready, blocked} =
      Enum.split_with(pending, fn t -> is_nil(t["parent_temp_id"]) or Map.has_key?(taxon_ids, t["parent_temp_id"]) end)

    if ready == [], do: Repo.rollback({:unresolvable_parents, Enum.map(blocked, & &1["temp_id"])})

    taxon_ids =
      Enum.reduce(ready, taxon_ids, fn t, acc ->
        case find_taxon.(t) do
          nil ->
            bump.({:taxa, :inserted})

            attrs = %{
              "common_name" => t["common_name"],
              "scientific_name" => t["scientific_name"],
              "taxonomic_level" => t["taxonomic_level"],
              "is_non_taxonomic" => t["is_non_taxonomic"],
              "notes" => t["notes"],
              "parent_id" => t["parent_temp_id"] && acc[t["parent_temp_id"]],
              "category_id" => t["category_slug"] && Map.fetch!(categories, t["category_slug"])
            }

            Map.put(acc, t["temp_id"], insert!.(Taxon.changeset(%Taxon{}, attrs), "taxon #{t["common_name"]}").id)

          existing ->
            bump.({:taxa, :skipped})
            Map.put(acc, t["temp_id"], existing.id)
        end
      end)

    {blocked, taxon_ids}
  end

  {_, _taxon_ids} =
    Stream.repeatedly(fn -> :next end)
    |> Enum.reduce_while({bundle["taxa"], %{}}, fn _, {pending, ids} ->
      if pending == [] do
        {:halt, {[], ids}}
      else
        {:cont, insert_level.(pending, ids)}
      end
    end)

  # --- users (ghosts: no hanko_id, no email sent) --------------------------
  user_ids =
    Map.new(bundle["users"], fn u ->
      case Repo.get_by(User, email: u["email"]) do
        nil ->
          bump.({:users, :inserted})

          attrs = %{
            "email" => u["email"],
            "first_name" => u["first_name"],
            "last_name" => u["last_name"]
          }

          {u["temp_id"], insert!.(User.changeset(%User{}, attrs), "user #{u["email"]}").id}

        existing ->
          bump.({:users, :skipped})
          {u["temp_id"], existing.id}
      end
    end)

  # --- projects -------------------------------------------------------------
  for p <- bundle["projects"] do
    owner_id = Map.fetch!(user_ids, p["owner_temp_id"])

    if Repo.get_by(Project, owner_id: owner_id, name: p["name"]) do
      bump.({:projects, :skipped})
    else
      bump.({:projects, :inserted})

      attrs = %{
        "name" => p["name"],
        "owner_id" => owner_id,
        "management_type" => p["management_type"],
        "address" => p["address"]
      }

      insert!.(Project.changeset(%Project{}, attrs), "project #{p["name"]}")
    end
  end

  unless apply?, do: Repo.rollback(:dry_run)
  :ok
end

report = fn ->
  for entity <- [:categories, :taxa, :users, :projects] do
    IO.puts(
      "  #{String.pad_trailing(to_string(entity), 11)} inserted=#{Process.get({entity, :inserted}) || 0} skipped(existing)=#{Process.get({entity, :skipped}) || 0}"
    )
  end
end

Ecto.Migrator.with_repo(Repo, fn _repo ->
  IO.puts("→ Import from #{path} (#{if apply?, do: "APPLY", else: "DRY-RUN"})")

  case Repo.transaction(run, timeout: :infinity) do
    {:ok, :ok} ->
      report.()
      IO.puts("✓ committed")

    {:error, :dry_run} ->
      report.()
      IO.puts("↺ dry-run: rolled back, nothing written. Re-run with APPLY=1 to commit.")

    {:error, reason} ->
      IO.puts("✗ rolled back: #{inspect(reason, limit: :infinity)}")
      System.halt(1)
  end
end)
