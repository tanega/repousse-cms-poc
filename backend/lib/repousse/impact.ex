defmodule Repousse.Impact do
  @moduledoc """
  Trees already given, hedges and their survival rate, and adoptants' news
  about the trees on their planting projects.
  """
  import Ecto.Query

  alias Repousse.Accounts
  alias Repousse.Accounts.User
  alias Repousse.Distributions.Reservation
  alias Repousse.Impact.{Hedge, ProjectPlanting, TreeReport}
  alias Repousse.Projects
  alias Repousse.Repo

  def summary do
    trees = Repo.aggregate(ProjectPlanting, :sum, :quantity) || 0
    hedge_count = Repo.aggregate(Hedge, :count, :id)

    survival =
      Repo.one(from h in Hedge, where: not is_nil(h.survival_rate), select: avg(h.survival_rate))

    %{
      trees_given: trees,
      hedge_count: hedge_count,
      mean_survival_rate: round_avg(survival),
      tree_reports: Repo.aggregate(TreeReport, :count, :id),
      estimated_kg: nil,
      note:
        "Les quantités d'arbres et le taux de reprise des haies viennent de la base. Le coefficient CO₂ Citizing n'est pas encore appliqué."
    }
  end

  def present_planting(%ProjectPlanting{} = planting) do
    %{
      id: planting.id,
      quantity: planting.quantity,
      source: planting.source,
      note: planting.note,
      planted_on: planting.planted_on,
      project_id: planting.project_id,
      taxon_id: planting.taxon_id,
      common_name: taxon_name(planting.taxon)
    }
  end

  def present_hedge(%Hedge{} = hedge) do
    %{
      id: hedge.id,
      name: hedge.name,
      length_m: hedge.length_m,
      survival_rate: hedge.survival_rate,
      planted_on: hedge.planted_on,
      notes: hedge.notes,
      taxon_id: hedge.taxon_id,
      common_name: taxon_name(hedge.taxon)
    }
  end

  def present_report(%TreeReport{} = report) do
    %{
      id: report.id,
      status: report.status,
      note: report.note,
      reason: report.reason,
      project_id: report.project_id,
      taxon_id: report.taxon_id,
      common_name: taxon_name(report.taxon),
      inserted_at: report.inserted_at
    }
  end

  def list_hedges do
    from(h in Hedge, order_by: [desc: h.inserted_at]) |> Repo.all() |> Repo.preload(:taxon)
  end

  def create_hedge(attrs) do
    %Hedge{} |> Hedge.changeset(attrs) |> Repo.insert() |> preload_taxon()
  end

  def list_plantings(project_id) do
    from(p in ProjectPlanting, where: p.project_id == ^project_id, order_by: [desc: p.inserted_at])
    |> Repo.all()
    |> Repo.preload(:taxon)
  end

  def list_gifts do
    from(p in ProjectPlanting, where: p.source == :historical, order_by: [desc: p.inserted_at])
    |> Repo.all()
    |> Repo.preload(:taxon)
  end

  def create_gift(attrs, %User{} = recorder) do
    attrs =
      attrs
      |> Map.new(fn {k, v} -> {to_string(k), v} end)
      |> Map.merge(%{"source" => "historical", "recorded_by_id" => recorder.id})

    %ProjectPlanting{} |> ProjectPlanting.changeset(attrs) |> Repo.insert() |> preload_taxon()
  end

  def record_distribution(%Reservation{} = reservation, items, %User{} = recorder) do
    today = Date.utc_today()

    Enum.reduce_while(items, {:ok, []}, fn %{taxon_id: taxon_id, quantity: qty}, {:ok, acc} ->
      attrs = %{
        project_id: reservation.project_id,
        taxon_id: taxon_id,
        quantity: qty,
        source: :distribution,
        planted_on: today,
        reservation_id: reservation.id,
        recorded_by_id: recorder.id
      }

      case %ProjectPlanting{} |> ProjectPlanting.changeset(attrs) |> Repo.insert() do
        {:ok, row} -> {:cont, {:ok, [row | acc]}}
        error -> {:halt, error}
      end
    end)
  end

  def list_reports(project_id) do
    from(r in TreeReport, where: r.project_id == ^project_id, order_by: [desc: r.inserted_at])
    |> Repo.all()
    |> Repo.preload(:taxon)
  end

  def create_report(%User{} = user, project_id, attrs) do
    if Accounts.admin?(user) or Projects.get_member_role(project_id, user.id) do
      attrs =
        attrs
        |> Map.new(fn {k, v} -> {to_string(k), v} end)
        |> Map.merge(%{"project_id" => project_id, "author_id" => user.id})

      %TreeReport{} |> TreeReport.changeset(attrs) |> Repo.insert() |> preload_taxon()
    else
      {:error, :unauthorized}
    end
  end

  defp taxon_name(%{common_name: name}), do: name
  defp taxon_name(_), do: nil

  defp preload_taxon({:ok, row}), do: {:ok, Repo.preload(row, :taxon)}
  defp preload_taxon(error), do: error

  defp round_avg(nil), do: nil
  defp round_avg(%Decimal{} = value), do: value |> Decimal.round(1) |> Decimal.to_float()
  defp round_avg(value) when is_float(value), do: Float.round(value, 1)
  defp round_avg(value) when is_integer(value), do: value * 1.0
end
