defmodule Repousse.Integrations do
  alias Repousse.Integrations.Workers.HelloassoSyncWorker

  def schedule_helloasso_sync do
    %{} |> HelloassoSyncWorker.new() |> Oban.insert()
  end
end
