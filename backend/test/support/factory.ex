defmodule Repousse.Factory do
  use ExMachina.Ecto, repo: Repousse.Repo

  alias Repousse.Accounts.{User, UserProfile}
  alias Repousse.Distributions.{Event, Slot, Stock, Reservation, ReservationItem, WaitlistEntry}
  alias Repousse.Projects.{Project, ProjectMember}
  alias Repousse.Taxa.{TaxonCategory, Taxon}

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

  def distribution_slot_factory do
    %Slot{
      event: build(:distribution_event),
      location_name: sequence(:slot_location, &"Lieu #{&1}"),
      date: Date.utc_today() |> Date.add(30),
      start_time: ~T[09:00:00],
      end_time: ~T[12:00:00]
    }
  end

  def distribution_stock_factory do
    %Stock{
      event: build(:distribution_event),
      taxon: build(:taxon),
      quantity: 10,
      reserved_quantity: 0
    }
  end

  def reservation_factory do
    %Reservation{
      user: build(:user),
      event: build(:distribution_event),
      slot: build(:distribution_slot),
      project: build(:project),
      status: :confirmed
    }
  end

  def reservation_item_factory do
    %ReservationItem{
      reservation: build(:reservation),
      stock: build(:distribution_stock),
      taxon: build(:taxon),
      reserved_qty: 2
    }
  end

  def waitlist_entry_factory do
    %WaitlistEntry{
      user: build(:user),
      event: build(:distribution_event),
      taxon: build(:taxon),
      position: 1,
      status: :waiting
    }
  end
end
