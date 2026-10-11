defmodule Repousse.NotificationsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory
  import Swoosh.TestAssertions

  alias Repousse.Notifications

  @attrs %{type: "test.event", title: "Hello", body: "Body", link: "/somewhere"}

  test "notify stores the notification and emails the user" do
    user = insert(:user)
    assert {:ok, n} = Notifications.notify(user, @attrs)
    assert n.user_id == user.id
    assert is_nil(n.read_at)
    assert_email_sent(subject: "Hello", to: {"Alice Dupont", user.email})
  end

  test "notify with email: false sends no email" do
    user = insert(:user)
    assert {:ok, _} = Notifications.notify(user, @attrs, email: false)
    assert_no_email_sent()
  end

  test "notify_admins reaches admins and superadmins only, honouring :except" do
    admin = insert(:admin_user)
    superadmin = insert(:superadmin_user)
    other_admin = insert(:admin_user)
    member = insert(:user)

    Notifications.notify_admins(@attrs, except: [other_admin.id], email: false)

    assert [_] = Notifications.list_for_user(admin)
    assert [_] = Notifications.list_for_user(superadmin)
    assert [] = Notifications.list_for_user(other_admin)
    assert [] = Notifications.list_for_user(member)
  end

  test "unread count, mark_read and mark_all_read are scoped to the owner" do
    user = insert(:user)
    other = insert(:user)
    {:ok, a} = Notifications.notify(user, @attrs, email: false)
    {:ok, _} = Notifications.notify(user, @attrs, email: false)
    {:ok, _} = Notifications.notify(other, @attrs, email: false)

    assert Notifications.unread_count(user) == 2
    assert {:error, :not_found} = Notifications.mark_read(other, a.id)

    assert {:ok, %{read_at: %DateTime{}}} = Notifications.mark_read(user, a.id)
    assert Notifications.unread_count(user) == 1
    assert Notifications.list_for_user(user, unread_only: true) |> length() == 1

    assert {:ok, 1} = Notifications.mark_all_read(user)
    assert Notifications.unread_count(user) == 0
    assert Notifications.unread_count(other) == 1
  end
end
