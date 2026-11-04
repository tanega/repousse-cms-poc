defmodule RepousseWeb.FallbackController do
  use RepousseWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn |> put_status(:not_found) |> json(%{error: "Not found"})
  end

  def call(conn, {:error, :unauthorized}) do
    conn |> put_status(:unauthorized) |> json(%{error: "Unauthorized"})
  end

  def call(conn, {:error, :forbidden}) do
    conn |> put_status(:forbidden) |> json(%{error: "Forbidden"})
  end

  def call(conn, {:error, :last_superadmin}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Cannot change the role of the last remaining superadmin"})
  end

  def call(conn, {:error, :at_least_one_profile_required}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Au moins un profil d'engagement est requis"})
  end

  def call(conn, {:error, :invalid_profile_type}) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "Profil d'engagement inconnu"})
  end

  def call(conn, {:error, :profile_not_active}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Ce profil d'engagement n'est pas actif sur votre compte"})
  end

  def call(conn, {:error, :profile_requires_approval}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Ce profil doit être demandé puis validé par un administrateur"})
  end

  def call(conn, {:error, :profile_request_not_pending}) do
    conn |> put_status(:conflict) |> json(%{error: "Cette demande a déjà été traitée"})
  end

  def call(conn, {:error, :taxon_request_not_pending}) do
    conn |> put_status(:conflict) |> json(%{error: "Cette demande a déjà été traitée"})
  end

  def call(conn, {:error, :taxon_required}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Indiquez le taxon à créer (`taxon`) ou un taxon existant (`taxon_id`)"})
  end

  def call(conn, {:error, :taxon_not_found}) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "Taxon introuvable"})
  end

  def call(conn, {:error, :profile_already_requested}) do
    conn |> put_status(:conflict) |> json(%{error: "Une demande est déjà en attente ou ce profil est déjà actif"})
  end

  def call(conn, {:error, :membership_required}) do
    conn
    |> put_status(:forbidden)
    |> json(%{error: "Votre adhésion HelloAsso n'est pas à jour pour cette année."})
  end

  def call(conn, {:error, :plant_not_depositable}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Cet arbre ne peut pas être déposé : il faut une espèce validée et une quantité d'au moins 1."})
  end

  def call(conn, {:error, :reservation_not_confirmed}) do
    conn |> put_status(:conflict) |> json(%{error: "Cette réservation n'est plus modifiable."})
  end

  def call(conn, {:error, :deposit_already_allocated}) do
    conn |> put_status(:conflict) |> json(%{error: "Ce dépôt est déjà versé dans une distribution."})
  end

  def call(conn, {:error, :invalid_handover}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Indiquez au moins un arbre avec une quantité supérieure à zéro."})
  end

  def call(conn, {:error, :host_family_profile_required}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Le profil Famille d'accueil est requis pour gérer des nurseries"})
  end

  def call(conn, {:error, {:nurseries_remaining, count}}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{
      error:
        "Impossible de retirer le profil Famille d'accueil : #{count} nurserie(s) encore active(s). " <>
          "Archivez-les d'abord.",
      details: %{nurseries_remaining: count}
    })
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Enum.reduce(opts, msg, fn {k, v}, acc ->
          String.replace(acc, "%{#{k}}", stringify(v))
        end)
      end)

    conn |> put_status(:unprocessable_entity) |> json(%{error: "Validation failed", details: errors})
  end

  def call(conn, {:error, reason}) when is_binary(reason) do
    conn |> put_status(:bad_request) |> json(%{error: reason})
  end

  # A failed `Ecto.Enum` cast puts the parameterized type tuple in `opts`, and
  # tuples have no String.Chars — interpolating one blindly turns a 422 into a
  # 500.
  defp stringify(value) when is_tuple(value) or is_map(value), do: inspect(value)
  defp stringify(value), do: to_string(value)
end
