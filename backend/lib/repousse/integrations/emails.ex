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

  @doc """
  US-PROJET-14: notifies a project admin that the project was unpublished by
  platform moderation, with the reason given by the moderator.
  """
  def notify_project_unpublished(%User{} = admin, project, reason) do
    new()
    |> to({display_name(admin), admin.email})
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject("Votre projet \"#{project.name}\" a été dépublié")
    |> text_body("""
    Bonjour#{if admin.first_name, do: " #{admin.first_name}", else: ""},

    Votre projet de plantation "#{project.name}" a été dépublié par un
    administrateur de la plateforme.

    Motif : #{reason}

    Le projet n'est plus visible par les autres membres connectés. Si vous
    souhaitez contester cette décision, contactez rgpd@repousse.org.

    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  @doc """
  US-PROJET-15: notifies a project admin that the project was permanently
  deleted by platform moderation, with the reason given by the moderator.
  """
  def notify_project_deleted(%User{} = admin, project, reason) do
    new()
    |> to({display_name(admin), admin.email})
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject("Votre projet \"#{project.name}\" a été supprimé")
    |> text_body("""
    Bonjour#{if admin.first_name, do: " #{admin.first_name}", else: ""},

    Votre projet de plantation "#{project.name}" a été définitivement
    supprimé par un administrateur de la plateforme.

    Motif : #{reason}

    Les données descriptives et les médias ont été supprimés. Les données
    d'impact associées sont conservées de façon anonymisée. Si vous
    souhaitez contester cette décision, contactez rgpd@repousse.org.

    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  @doc """
  US-PROJET-08: notifies a remaining project member that the project was
  automatically archived because it no longer has any administrator.
  """
  def notify_project_archived(%User{} = member, project) do
    new()
    |> to({display_name(member), member.email})
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject("Votre projet \"#{project.name}\" a été archivé")
    |> text_body("""
    Bonjour#{if member.first_name, do: " #{member.first_name}", else: ""},

    Le projet de plantation "#{project.name}" n'a plus d'administrateur et a
    donc été automatiquement archivé. Il n'est plus modifiable mais reste
    consultable, et ses données sont conservées pour les indicateurs
    d'impact.

    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  @doc """
  US-PROJET-06: invites someone to join a project as Lecteur or Éditeur,
  with a link to accept.
  """
  def send_project_invitation(invitation, project) do
    accept_url = "#{webapp_url()}/projects/invitations/#{invitation.token}"

    new()
    |> to(invitation.email)
    |> from({"Repousse", "no-reply@repousse.org"})
    |> subject("Invitation à rejoindre le projet \"#{project.name}\"")
    |> text_body("""
    Bonjour,

    Vous avez été invité·e à rejoindre le projet de plantation
    "#{project.name}" en tant que #{invitation_role_label(invitation.role)}.

    Pour accepter cette invitation, rendez-vous sur #{accept_url}.

    Cette invitation expire le #{invitation.expires_at}.

    L'équipe Repousse
    """)
    |> Mailer.deliver()
  end

  defp invitation_role_label(:editor), do: "Éditeur"
  defp invitation_role_label(:reader), do: "Lecteur"
  defp invitation_role_label(role), do: to_string(role)

  defp display_name(%User{first_name: first, last_name: last})
       when is_binary(first) or is_binary(last) do
    [first, last] |> Enum.filter(& &1) |> Enum.join(" ")
  end

  defp display_name(_user), do: ""

  defp webapp_url, do: Application.get_env(:repousse, :webapp_url, "http://www.localhost")
end
