defmodule Repousse.Taxa.Policy do
  @moduledoc """
  Bodyguard authorization for taxa management (epic-05). Platform admins can
  always manage taxa; `taxon_editor` is a narrower grant an Admin attributes
  explicitly to a member for community pedagogical resources (external
  links, photos, guides) without giving them full platform admin rights.
  """
  @behaviour Bodyguard.Policy

  alias Repousse.Accounts

  def authorize(:manage_taxa, user, _params) do
    allow(Accounts.admin?(user) or user.taxon_editor)
  end

  def authorize(_action, _user, _params), do: {:error, :unauthorized}

  defp allow(true), do: :ok
  defp allow(false), do: {:error, :unauthorized}
end
