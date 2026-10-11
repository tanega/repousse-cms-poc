defmodule Repousse.Notifications do
  @moduledoc """
  In-app notification centre. A notification is addressed to one user and
  carries its own rendered `title`/`body`/`link`, so the webapp needs no
  per-type knowledge. `type` (e.g. `"profile_request.approved"`) and `payload`
  stay available for filtering and future per-type UI.

  Every notification is also emailed unless `email: false` is passed — a failed
  delivery is logged and never fails the caller.
  """
  import Ecto.Query

  require Logger

  alias Repousse.Accounts.User
  alias Repousse.Integrations.Emails
  alias Repousse.Notifications.Notification
  alias Repousse.Repo

  @default_limit 50

  @doc """
  Notifies one user. `attrs` takes `:type`, `:title`, optional `:body`, `:link`,
  `:payload`.
  """
  def notify(%User{id: user_id} = user, attrs, opts \\ []) do
    attrs = attrs |> Map.new() |> Map.put(:user_id, user_id)

    with {:ok, notification} <- %Notification{} |> Notification.changeset(attrs) |> Repo.insert() do
      if Keyword.get(opts, :email, true), do: deliver_email(user, notification)
      {:ok, notification}
    end
  end

  @doc "Notifies every admin/superadmin (except `:except` user ids)."
  def notify_admins(attrs, opts \\ []) do
    except = Keyword.get(opts, :except, [])

    from(u in User, where: u.role in [:admin, :superadmin] and u.id not in ^except)
    |> Repo.all()
    |> Enum.map(fn admin -> {admin.id, notify(admin, attrs, opts)} end)
  end

  @doc "Notifies everyone allowed to manage taxa: admins, superadmins and `taxon_editor`s."
  def notify_taxon_managers(attrs, opts \\ []) do
    except = Keyword.get(opts, :except, [])

    from(u in User,
      where: (u.role in [:admin, :superadmin] or u.taxon_editor == true) and u.id not in ^except
    )
    |> Repo.all()
    |> Enum.map(fn manager -> {manager.id, notify(manager, attrs, opts)} end)
  end

  def list_for_user(%User{id: user_id}, opts \\ []) do
    limit = Keyword.get(opts, :limit, @default_limit)

    query =
      from n in Notification,
        where: n.user_id == ^user_id,
        order_by: [desc: n.inserted_at, desc: n.id],
        limit: ^limit

    query = if Keyword.get(opts, :unread_only, false), do: where(query, [n], is_nil(n.read_at)), else: query

    Repo.all(query)
  end

  def unread_count(%User{id: user_id}) do
    Repo.aggregate(from(n in Notification, where: n.user_id == ^user_id and is_nil(n.read_at)), :count)
  end

  def mark_read(%User{id: user_id}, id) do
    case Repo.get_by(Notification, id: id, user_id: user_id) do
      nil -> {:error, :not_found}
      %Notification{read_at: nil} = n -> n |> Ecto.Changeset.change(read_at: now()) |> Repo.update()
      n -> {:ok, n}
    end
  end

  def mark_all_read(%User{id: user_id}) do
    {count, _} =
      from(n in Notification, where: n.user_id == ^user_id and is_nil(n.read_at))
      |> Repo.update_all(set: [read_at: now()])

    {:ok, count}
  end

  defp deliver_email(%User{} = user, %Notification{} = notification) do
    Emails.send_notification_email(user, notification)
  rescue
    e -> Logger.error("Notification email failed for #{user.id}: #{Exception.message(e)}")
  end

  defp now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end
