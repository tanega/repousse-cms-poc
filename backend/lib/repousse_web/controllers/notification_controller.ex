defmodule RepousseWeb.NotificationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Notifications
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Notification

  tags ["Notifications"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List the current user's notifications (newest first)",
    parameters: [
      unread: [in: :query, type: :boolean, description: "Only unread notifications"]
    ],
    responses: [ok: API.list(Notification, "Notifications")]

  def index(conn, params) do
    user = conn.assigns.current_user
    notifications = Notifications.list_for_user(user, unread_only: params["unread"] in ["true", "1"])
    json(conn, %{data: notifications, meta: %{unread_count: Notifications.unread_count(user)}})
  end

  operation :unread_count,
    summary: "Number of unread notifications",
    responses: [ok: API.object("Unread count")]

  def unread_count(conn, _params) do
    json(conn, %{data: %{unread_count: Notifications.unread_count(conn.assigns.current_user)}})
  end

  operation :read,
    summary: "Mark one notification as read",
    parameters: [id: [in: :path, type: :string, description: "Notification ID"]],
    responses: [ok: API.object(Notification, "Updated notification")]

  def read(conn, %{"id" => id}) do
    with {:ok, notification} <- Notifications.mark_read(conn.assigns.current_user, id) do
      json(conn, %{data: notification})
    end
  end

  operation :read_all,
    summary: "Mark all notifications as read",
    responses: [ok: API.object("Number of notifications marked read")]

  def read_all(conn, _params) do
    {:ok, count} = Notifications.mark_all_read(conn.assigns.current_user)
    json(conn, %{data: %{updated: count}})
  end
end
