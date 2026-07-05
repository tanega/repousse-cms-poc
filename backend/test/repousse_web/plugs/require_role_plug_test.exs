defmodule RepousseWeb.Plugs.RequireRolePlugTest do
  use Repousse.DataCase, async: true

  import Plug.Test
  import Repousse.Factory

  alias RepousseWeb.Plugs.RequireRolePlug

  defp call_with(user) do
    conn = conn(:get, "/api/v1/admin/users") |> Plug.Conn.assign(:current_user, user)
    RequireRolePlug.call(conn, role: :admin)
  end

  # Regression: RequireRolePlug used to gate on UserProfile.profile_type ==
  # :admin; it now reads the platform-wide User.role field instead.
  test "plain member is forbidden from the /admin scope" do
    member = build(:user, role: :member)
    conn = call_with(member)

    assert conn.halted
    assert conn.status == 403
  end

  test "admin passes the /admin scope gate" do
    admin = build(:user, role: :admin)
    conn = call_with(admin)

    refute conn.halted
  end

  test "superadmin passes the /admin scope gate" do
    superadmin = build(:user, role: :superadmin)
    conn = call_with(superadmin)

    refute conn.halted
  end
end
