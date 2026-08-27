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
  Sends a welcome email when a staff member (admin/superadmin) creates a
  user account from the admin panel — distinct from `send_activation_email/1`
  (guest self-signup confirmation) so its content can evolve independently
  with onboarding info without touching the guest flow.

  Deliberately minimal for now: just confirms the account and points to
  login. TODO: replace with a branded template once onboarding content
  (next steps, association info, etc.) is defined.
  """
  def send_welcome_email(%User{} = user) do
    login_url = "#{webapp_url()}/auth/v2/login"

    new()
    |> to({display_name(user), user.email})
    |> from({"Association Repousse", "no-reply@repousse.org"})
    |> subject("Bienvenue chez Repousse !")
    |> text_body("""
    Bonjour#{if user.first_name, do: " #{user.first_name}", else: ""},

    Un compte Repousse vient d'être créé pour vous par un·e membre de
    l'équipe.

    Pour vous connecter, rendez-vous sur #{login_url} et saisissez cette
    même adresse e-mail : vous recevrez un code de connexion, aucun mot de
    passe n'est nécessaire.

    À bientôt,
    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  defp display_name(%User{first_name: first, last_name: last}) when is_binary(first) or is_binary(last) do
    [first, last] |> Enum.filter(& &1) |> Enum.join(" ")
  end

  defp display_name(_user), do: ""

  defp webapp_url, do: Application.get_env(:repousse, :webapp_url, "http://www.localhost")
end
