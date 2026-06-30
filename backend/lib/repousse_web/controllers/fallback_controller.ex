defmodule RepousseWeb.FallbackController do
  use RepousseWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn |> put_status(:not_found) |> json(%{error: "Not found"})
  end

  def call(conn, {:error, :unauthorized}) do
    conn |> put_status(:unauthorized) |> json(%{error: "Unauthorized"})
  end

  def call(conn, {:error, :forbidden}) do
    conn |> put_status(:forbidden) |> json(%{error: "Forbidden"})
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Enum.reduce(opts, msg, fn {k, v}, acc ->
          String.replace(acc, "%{#{k}}", to_string(v))
        end)
      end)

    conn |> put_status(:unprocessable_entity) |> json(%{error: "Validation failed", details: errors})
  end

  def call(conn, {:error, reason}) when is_binary(reason) do
    conn |> put_status(:bad_request) |> json(%{error: reason})
  end
end
