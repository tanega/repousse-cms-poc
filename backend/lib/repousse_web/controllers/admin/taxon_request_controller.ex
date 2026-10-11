defmodule RepousseWeb.Admin.TaxonRequestController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa.{Policy, Requests}
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.TaxonRequest

  tags ["Admin — Taxon requests"]
  security [%{"bearerAuth" => []}]

  @statuses ~w(pending approved rejected)

  # Reachable by admins and `taxon_editor`s, hence the policy check rather
  # than the router's :admin pipeline.
  defp authorize(conn), do: Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{})

  operation :index,
    summary: "List requests to add a plant",
    parameters: [status: [in: :query, type: :string, description: "pending (default), approved or rejected"]],
    responses: [ok: API.list(TaxonRequest, "Requests")]

  def index(conn, params) do
    with :ok <- authorize(conn) do
      status = if params["status"] in @statuses, do: String.to_existing_atom(params["status"]), else: :pending

      json(conn, %{
        data: Enum.map(Requests.list(status), &present/1),
        meta: %{pending_count: Requests.count_pending()}
      })
    end
  end

  operation :count,
    summary: "Number of pending requests",
    responses: [ok: API.object("Pending count")]

  def count(conn, _params) do
    with :ok <- authorize(conn) do
      json(conn, %{data: %{pending_count: Requests.count_pending()}})
    end
  end

  operation :approve,
    summary: "Approve a request",
    description:
      "Send `taxon` (attributes of the taxon to create) or `taxon_id` (an existing taxon). " <>
        "Pending nursery lines are attached to it and the askers are notified.",
    parameters: [id: [in: :path, type: :string, description: "Request ID"]],
    request_body: {"Taxon", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(TaxonRequest, "Approved request")]

  def approve(conn, %{"id" => id} = params) do
    opts =
      cond do
        is_binary(params["taxon_id"]) -> %{taxon_id: params["taxon_id"]}
        is_map(params["taxon"]) -> %{taxon: params["taxon"]}
        true -> %{}
      end

    with :ok <- authorize(conn),
         {:ok, request} <- fetch(id),
         {:ok, updated} <- Requests.approve(request, conn.assigns.current_user, opts) do
      json(conn, %{data: present(updated)})
    end
  end

  operation :reject,
    summary: "Reject a request",
    description: "The optional `reason` is sent to the askers; their pending nursery lines are removed.",
    parameters: [id: [in: :path, type: :string, description: "Request ID"]],
    request_body: {"Rejection", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(TaxonRequest, "Rejected request")]

  def reject(conn, %{"id" => id} = params) do
    with :ok <- authorize(conn),
         {:ok, request} <- fetch(id),
         {:ok, updated} <- Requests.reject(request, conn.assigns.current_user, params["reason"]) do
      json(conn, %{data: present(updated)})
    end
  end

  defp present(request) do
    user = request.requested_by

    %{
      id: request.id,
      common_name: request.common_name,
      scientific_name: request.scientific_name,
      category_id: request.category_id,
      category_name: request.category && request.category.name,
      comment: request.comment,
      status: request.status,
      taxon_id: request.taxon_id,
      decided_at: request.decided_at,
      rejection_reason: request.rejection_reason,
      inserted_at: request.inserted_at,
      requested_by: %{id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email}
    }
  end

  defp fetch(id) do
    with {:ok, _} <- Ecto.UUID.cast(id),
         %{} = request <- Requests.get(id) do
      {:ok, request}
    else
      _ -> {:error, :not_found}
    end
  end
end
