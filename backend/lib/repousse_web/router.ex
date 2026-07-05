defmodule RepousseWeb.Router do
  use RepousseWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug
    plug OpenApiSpex.Plug.PutApiSpec, module: RepousseWeb.ApiSpec
  end

  pipeline :authenticated do
    plug RepousseWeb.Plugs.AuthPlug
    plug RepousseWeb.Plugs.LoadCurrentUserPlug
  end

  pipeline :admin do
    plug RepousseWeb.Plugs.RequireRolePlug, role: :admin
  end

  scope "/api/v1", RepousseWeb do
    pipe_through [:api, :authenticated]

    # Current user
    get "/me", AccountsController, :me
    put "/me", AccountsController, :update_me
    get "/me/profiles", AccountsController, :profiles
    put "/me/profiles", AccountsController, :update_profiles

    # Distributions (read + reserve)
    get "/distributions", DistributionController, :index
    get "/distributions/:id", DistributionController, :show
    post "/distributions/:id/reservations", ReservationController, :create
    get "/distributions/:id/reservations/mine", ReservationController, :mine
    delete "/distributions/:distribution_id/reservations/:id", ReservationController, :cancel
    post "/distributions/:id/waitlist", WaitlistController, :join
    delete "/distributions/:id/waitlist", WaitlistController, :leave

    # Admin — distribution management
    scope "/admin", Admin, as: :admin do
      pipe_through :admin

      resources "/distributions", DistributionController, except: [:new, :edit]
      post "/distributions/:id/publish", DistributionController, :publish
      post "/distributions/:id/close", DistributionController, :close
      resources "/distributions/:distribution_id/slots", SlotController, except: [:new, :edit]

      resources "/distributions/:distribution_id/stocks", StockController,
        except: [:new, :edit, :show]

      get "/distributions/:distribution_id/attendees", DistributionController, :attendees

      put "/distributions/:distribution_id/validate/:reservation_id",
          ReservationController,
          :validate
    end

    # Planting projects
    get "/projects", ProjectController, :index
    get "/projects/:id", ProjectController, :show
    post "/projects", ProjectController, :create
    put "/projects/:id", ProjectController, :update
    delete "/projects/:id", ProjectController, :delete
    get "/projects/:id/members", ProjectController, :members
    post "/projects/:id/invitations", ProjectController, :invite
    put "/projects/:id/members/:user_id", ProjectController, :update_member
    delete "/projects/:id/members/:user_id", ProjectController, :remove_member
    post "/projects/:id/media", ProjectController, :upload_media
    delete "/projects/:id/media/:media_id", ProjectController, :delete_media
    get "/projects/:id/journal", ProjectController, :journal
    post "/projects/:id/journal", ProjectController, :add_journal_entry
    put "/projects/:project_id/journal/:entry_id", ProjectController, :update_journal_entry
    delete "/projects/:project_id/journal/:entry_id", ProjectController, :delete_journal_entry

    # Taxa
    get "/taxa", TaxonController, :index
    get "/taxa/:id", TaxonController, :show
    get "/taxa/categories", TaxonCategoryController, :index

    # Not gated by the `:admin` pipeline: mutation actions here are
    # authorized per-action by `Repousse.Taxa.Policy` (platform admin OR
    # the narrower `taxon_editor` grant, epic-05 US-TAX-08/09 "Administrateur
    # ou Éditeur taxons") — the blanket admin-role plug would otherwise
    # reject a taxon_editor who isn't also a platform admin before the
    # controller's own check ever runs.
    scope "/admin", Admin, as: :admin do
      resources "/taxa", TaxonController, except: [:new, :edit]
      resources "/taxa/categories", TaxonCategoryController, except: [:new, :edit, :show]
      get "/taxa/:id/versions", TaxonController, :versions
      post "/taxa/:id/restore/:version_id", TaxonController, :restore
    end

    # Dashboard
    get "/dashboard/indicators", DashboardController, :indicators
    get "/dashboard/co2", DashboardController, :co2
    get "/dashboard/map/distributions", DashboardController, :map_distributions
    get "/dashboard/map/projects", DashboardController, :map_projects
    get "/dashboard/calendar", DashboardController, :calendar
    get "/dashboard/exports/:type", DashboardController, :export

    # Users admin
    scope "/admin", Admin, as: :admin do
      pipe_through :admin

      resources "/users", UserController, only: [:index, :show, :create, :update, :delete]
      post "/users/:id/suspend", UserController, :suspend
      post "/users/:id/activate", UserController, :activate
    end
  end

  # Public — guest account creation from the distribution form, no auth
  scope "/api/v1/public", RepousseWeb do
    pipe_through :api

    post "/accounts", PublicAccountController, :create_or_check
  end

  # OpenAPI spec (generated from controller `operation/2` specs)
  scope "/api/v1" do
    pipe_through :api

    get "/openapi", OpenApiSpex.Plug.RenderSpec, []
  end

  # Public webhooks — no auth
  scope "/webhooks", RepousseWeb do
    pipe_through :api

    post "/helloasso", WebhookController, :helloasso
  end

  # Options preflight for CORS
  scope "/" do
    options "/*path", RepousseWeb.CorsController, :preflight
  end

  if Application.compile_env(:repousse, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: RepousseWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
