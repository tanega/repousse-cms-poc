defmodule Repousse.Test.FakeHankoAdmin do
  @moduledoc """
  Test double for `Repousse.Auth.HankoAdmin` — avoids real HTTP calls to the
  Hanko admin API from tests that exercise `Accounts.create_user_with_hanko/2`
  (e.g. the admin user-creation controller action). Wired in via the
  `:hanko_admin_module` application env seam in `Repousse.Accounts`:

      Application.put_env(:repousse, :hanko_admin_module, Repousse.Test.FakeHankoAdmin)
  """

  def create_or_find_user(_email, _opts \\ []), do: {:ok, Ecto.UUID.generate()}
end
