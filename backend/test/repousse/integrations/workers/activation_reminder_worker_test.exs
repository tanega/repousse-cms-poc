defmodule Repousse.Integrations.Workers.ActivationReminderWorkerTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory
  import Swoosh.TestAssertions

  alias Repousse.Accounts
  alias Repousse.Integrations.Workers.ActivationReminderWorker

  defp days_ago(n), do: DateTime.add(DateTime.utc_now(), -n, :day) |> DateTime.truncate(:second)

  describe "perform/1 — epic-02 US-AUTH-06" do
    test "sends a reminder and bumps activation_sent_count for an unactivated account older than 7 days" do
      user =
        insert(:user, last_seen_at: nil, activation_sent_count: 0)
        |> Ecto.Changeset.change(inserted_at: days_ago(8))
        |> Repousse.Repo.update!()

      assert :ok = perform_job(ActivationReminderWorker, %{})

      assert_email_sent(fn email ->
        Enum.any?(email.to, fn {_name, address} -> address == user.email end)
      end)

      assert Accounts.get_user!(user.id).activation_sent_count == 1
    end

    test "does not remind an account younger than 7 days" do
      user =
        insert(:user, last_seen_at: nil, activation_sent_count: 0)
        |> Ecto.Changeset.change(inserted_at: days_ago(2))
        |> Repousse.Repo.update!()

      assert :ok = perform_job(ActivationReminderWorker, %{})

      refute_email_sent()
      assert Accounts.get_user!(user.id).activation_sent_count == 0
    end

    test "does not remind an account that has already activated (last_seen_at set)" do
      user =
        insert(:user,
          last_seen_at: DateTime.utc_now() |> DateTime.truncate(:second),
          activation_sent_count: 0
        )
        |> Ecto.Changeset.change(inserted_at: days_ago(10))
        |> Repousse.Repo.update!()

      assert :ok = perform_job(ActivationReminderWorker, %{})

      refute_email_sent()
      assert Accounts.get_user!(user.id).activation_sent_count == 0
    end

    # "Arrêt des relances après 4 semaines"
    test "stops reminding once activation_sent_count has reached 4" do
      user =
        insert(:user, last_seen_at: nil, activation_sent_count: 4)
        |> Ecto.Changeset.change(inserted_at: days_ago(40))
        |> Repousse.Repo.update!()

      assert :ok = perform_job(ActivationReminderWorker, %{})

      refute_email_sent()
      assert Accounts.get_user!(user.id).activation_sent_count == 4
    end

    test "reminds again on a subsequent run below the cap" do
      user =
        insert(:user, last_seen_at: nil, activation_sent_count: 3)
        |> Ecto.Changeset.change(inserted_at: days_ago(30))
        |> Repousse.Repo.update!()

      assert :ok = perform_job(ActivationReminderWorker, %{})

      assert_email_sent(fn email ->
        Enum.any?(email.to, fn {_name, address} -> address == user.email end)
      end)

      assert Accounts.get_user!(user.id).activation_sent_count == 4
    end
  end

  defp perform_job(worker, args) do
    worker.perform(%Oban.Job{args: args})
  end
end
