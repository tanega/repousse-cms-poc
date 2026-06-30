defmodule Repousse.Integrations.Emails do
  @moduledoc false

  def broadcast_event_published(_event) do
    # TODO: implement email broadcast via Swoosh
    :ok
  end

  def send_activation_email(_user) do
    # TODO: implement passwordless activation email
    :ok
  end
end
