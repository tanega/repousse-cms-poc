defmodule Repousse.Factory do
  use ExMachina.Ecto, repo: Repousse.Repo

  alias Repousse.Accounts.{User, UserProfile}
  alias Repousse.Distributions.{Event, Slot, Stock, Reservation, ReservationItem, WaitlistEntry}
  alias Repousse.Projects.{Project, ProjectMember, ProjectInvitation, JournalEntry, ProjectMedia, PreferredSpecies}
  alias Repousse.Taxa.{TaxonCategory, Taxon, TaxonVersion, TaxonExternalLink}

  def user_factory do
    %User{
      email: sequence(:email, &"user#{&1}@example.com"),
      first_name: "Alice",
      last_name: "Dupont",
      hanko_id: Ecto.UUID.generate(),
      membership_year: Date.utc_today().year,
      status: :active
    }
  end

  def admin_user_factory do
    struct!(user_factory(), %{role: :admin})
  end

  def superadmin_user_factory do
    struct!(user_factory(), %{role: :superadmin})
  end

  def user_profile_factory do
    %UserProfile{
      user: build(:user),
      profile_type: :adoptant
    }
  end

  def taxon_category_factory do
    name = sequence(:category_name, &"Category #{&1}")

    %TaxonCategory{
      name: name,
      slug: name |> String.downcase() |> String.replace(" ", "-")
    }
  end

  def taxon_factory do
    %Taxon{
      scientific_name: sequence(:sci_name, &"Genus species#{&1}"),
      common_name: sequence(:common_name, &"Common Plant #{&1}"),
      taxonomic_level: :species,
      is_non_taxonomic: false,
      category: build(:taxon_category)
    }
  end

  def distribution_event_factory do
    %Event{
      title: sequence(:event_title, &"Distribution #{&1}"),
      slug: sequence(:event_slug, &"distribution-#{&1}"),
      status: :draft
    }
  end

  def project_factory do
    %Project{
      name: sequence(:project_title, &"Projet #{&1}"),
      description: "Un projet de plantation",
      publication_status: :private
    }
  end

  def project_member_factory do
    %ProjectMember{
      project: build(:project),
      user: build(:user),
      role: :reader
    }
  end

  def project_invitation_factory do
    %ProjectInvitation{
      email: sequence(:invitation_email, &"invitee#{&1}@example.com"),
      role: :reader,
      token: sequence(:invitation_token, &"token-#{&1}"),
      expires_at: DateTime.utc_now() |> DateTime.add(7, :day) |> DateTime.truncate(:second),
      project: build(:project),
      invited_by: build(:user)
    }
  end

  def journal_entry_factory do
    %JournalEntry{
      content: sequence(:journal_content, &"Entrée de journal #{&1}"),
      project: build(:project),
      author: build(:user)
    }
  end

  def project_media_factory do
    %ProjectMedia{
      file_type: "photo",
      mime_type: "image/jpeg",
      url: "https://example.com/photo.jpg",
      filename: "photo.jpg",
      size_bytes: 1024,
      project: build(:project),
      uploaded_by: build(:user)
    }
  end

  def preferred_species_factory do
    %PreferredSpecies{
      project: build(:project),
      taxon: build(:taxon)
    }
  end

  def slot_factory do
    %Slot{
      location_name: sequence(:slot_location, &"Parking #{&1}"),
      date: ~D[2026-03-14],
      start_time: ~T[09:00:00],
      end_time: ~T[12:00:00],
      event: build(:distribution_event)
    }
  end

  def stock_factory do
    %Stock{
      quantity: 50,
      quantity_unknown: false,
      reserved_quantity: 0,
      event: build(:distribution_event),
      taxon: build(:taxon)
    }
  end

  def reservation_factory do
    %Reservation{
      status: :confirmed,
      user: build(:user),
      slot: build(:slot),
      event: build(:distribution_event),
      project: build(:project)
    }
  end

  def reservation_item_factory do
    %ReservationItem{
      reserved_qty: 2,
      reservation: build(:reservation),
      stock: build(:stock),
      taxon: build(:taxon)
    }
  end

  def waitlist_entry_factory do
    %WaitlistEntry{
      position: 1,
      status: :waiting,
      user: build(:user),
      event: build(:distribution_event),
      taxon: build(:taxon)
    }
  end

  def taxon_version_factory do
    %TaxonVersion{
      changes: %{"common_name" => "New name"},
      snapshot: %{"common_name" => "Old name"},
      taxon: build(:taxon),
      changed_by: build(:user)
    }
  end

  def taxon_external_link_factory do
    %TaxonExternalLink{
      source_name: "Wikipedia",
      url: "https://fr.wikipedia.org/wiki/Prunus_avium",
      taxon: build(:taxon)
    }
  end
end
