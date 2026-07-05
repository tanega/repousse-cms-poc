defmodule Repousse.Integrations.Workers.ActivationReminderWorker do
  @moduledoc """
  Oban worker for epic-02 US-AUTH-06: weekly activation reminder for members
  who haven't activated their account yet.

  Mirrors `HelloassoSyncWorker`'s scheduling assumption ("Scheduled to run
  daily" there is a comment, not an actual Oban Cron entry in
  `config/config.exs` yet) — this worker is written to be triggered weekly,
  but wiring an `Oban.Plugins.Cron` crontab entry for it is out of this
  track's file scope (`config/config.exs` isn't in the authorized file list)
  and is left for whoever owns that shared config.

  Eligibility for a reminder:
  - `last_seen_at` is still `nil` — `LoadCurrentUserPlug` only ever sets it
    once a user completes their first passwordless login, so this is the
    account's "activated" signal (there is no separate boolean column).
  - The account is at least 7 days old (`inserted_at`).
  - Fewer than 4 reminders have been sent so far (`activation_sent_count` on
    `Repousse.Accounts.User`) — stops after 4 weekly reminders, or as soon as
    the account is activated (which excludes it from the query above).

  Each reminder reuses `Emails.send_activation_email/1` (the same "here's
  your login link" email sent at account creation): this is a passwordless
  flow where Hanko itself issues the actual one-time passcode/magic-link at
  login time, so there's no separate reminder-specific token to mint here —
  sending the email again is exactly "a new activation link".
  """
  use Oban.Worker, queue: :email, max_attempts: 3

  require Logger
  import Ecto.Query

  alias Repousse.Accounts
  alias Repousse.Accounts.User
  alias Repousse.Integrations.Emails
  alias Repousse.Repo

  @reminder_after_days 7
  @max_reminders 4

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    results = users_due_for_reminder() |> Enum.map(&send_reminder/1)

    sent = Enum.count(results, &(&1 == :ok))
    errors = Enum.count(results, &match?({:error, _}, &1))

    Logger.info("Activation reminders — sent: #{sent}, errors: #{errors}")
    :ok
  end

  defp users_due_for_reminder do
    cutoff = DateTime.add(DateTime.utc_now(), -@reminder_after_days, :day)

    from(u in User,
      where: is_nil(u.last_seen_at),
      where: u.inserted_at <= ^cutoff,
      where: u.activation_sent_count < @max_reminders
    )
    |> Repo.all()
  end

  defp send_reminder(%User{} = user) do
    case Emails.send_activation_email(user) do
      {:error, reason} ->
        Logger.warning("Activation reminder email failed for #{user.email}: #{inspect(reason)}")
        {:error, reason}

      _ok ->
        bump_reminder_count(user)
    end
  end

  defp bump_reminder_count(%User{} = user) do
    case Accounts.increment_activation_reminder_count(user) do
      {:ok, _updated} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end
