defmodule Repousse.Integrations.Emails do
  @moduledoc false

  import Swoosh.Email

  alias Repousse.Accounts.User
  alias Repousse.Mailer

  def broadcast_event_published(_event) do
    # TODO: implement email broadcast via Swoosh
    :ok
  end

  @doc """
  Sends the "your account was created" email with the login procedure.
  Accounts here are passwordless (Hanko passcode/passkey) — there is no
  password to set, so the email just points the user at the login page.
  """
  def send_activation_email(%User{} = user) do
    login_url = "#{webapp_url()}/auth/v2/login"

    new()
    |> to({display_name(user), user.email})
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject("Votre compte Repousse a été créé")
    |> text_body("""
    Bonjour#{if user.first_name, do: " #{user.first_name}", else: ""},

    Un compte Repousse vient d'être créé avec cette adresse e-mail.

    Pour vous connecter, rendez-vous sur #{login_url} et saisissez cette
    même adresse e-mail : vous recevrez un code de connexion, aucun mot de
    passe n'est nécessaire.

    À bientôt,
    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  @doc """
  Notifies a waitlisted adoptant that stock just freed up for the taxon
  they're waiting on (epic-01 US-DIST-08), after a reservation cancellation
  restored stock to the event's pool. Expects a `WaitlistEntry` preloaded
  with `:user` and `:taxon`.
  """
  def notify_waitlist_stock_available(%Repousse.Distributions.WaitlistEntry{} = entry) do
    new()
    |> to({display_name(entry.user), entry.user.email})
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject(
      "Des plants se sont libérés — #{entry.taxon.common_name || entry.taxon.scientific_name}"
    )
    |> text_body("""
    Bonjour#{if entry.user.first_name, do: " #{entry.user.first_name}", else: ""},

    Bonne nouvelle : des plants de #{entry.taxon.common_name || entry.taxon.scientific_name} viennent
    de se libérer suite à une annulation, et vous êtes le prochain sur la
    liste d'attente.

    Rendez-vous sur votre espace Repousse pour confirmer votre réservation.

    À bientôt,
    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  defp display_name(%User{first_name: first, last_name: last})
       when is_binary(first) or is_binary(last) do
    [first, last] |> Enum.filter(& &1) |> Enum.join(" ")
  end

  defp display_name(_user), do: ""

  defp webapp_url, do: Application.get_env(:repousse, :webapp_url, "http://www.localhost")
end
