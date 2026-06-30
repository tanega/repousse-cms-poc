defmodule Repousse.Application do
  # See https://elixir.hexdocs.pm/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      RepousseWeb.Telemetry,
      Repousse.Repo,
      {DNSCluster, query: Application.get_env(:repousse, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Repousse.PubSub},
      {Finch, name: Repousse.Finch},
      Repousse.Auth.JwksCache,
      {Oban, Application.fetch_env!(:repousse, Oban)},
      RepousseWeb.Endpoint
    ]

    # See https://elixir.hexdocs.pm/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Repousse.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    RepousseWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
