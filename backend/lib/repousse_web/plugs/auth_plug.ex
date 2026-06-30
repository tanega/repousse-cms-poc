defmodule RepousseWeb.Plugs.AuthPlug do
  @moduledoc """
  Validates Hanko JWT from Authorization header.
  On success, assigns :hanko_claims to conn.
  Returns 401 on missing or invalid token.
  """
  import Plug.Conn
  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    with {:ok, token} <- extract_token(conn),
         {:ok, claims} <- verify_token(token) do
      assign(conn, :hanko_claims, claims)
    else
      {:error, reason} ->
        Logger.debug("Auth rejected: #{inspect(reason)}")

        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "unauthorized"})
        |> halt()
    end
  end

  defp extract_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> {:ok, String.trim(token)}
      _ -> {:error, :missing_bearer}
    end
  end

  defp verify_token(token) do
    with {:ok, keys} <- Repousse.Auth.JwksCache.get_keys(),
         {:ok, header} <- peek_header(token),
         {:ok, jwk} <- find_key(keys, header["kid"]),
         signer <- Joken.Signer.create(header["alg"] || "RS256", jwk),
         {:ok, claims} <- Joken.verify(token, signer, []) do
      validate_claims(claims)
    end
  end

  defp peek_header(token) do
    case String.split(token, ".") do
      [header_b64 | _] ->
        case Base.url_decode64(header_b64, padding: false) do
          {:ok, json} -> Jason.decode(json)
          :error -> {:error, :invalid_header}
        end

      _ ->
        {:error, :malformed_token}
    end
  end

  defp find_key(keys, kid) when is_binary(kid) do
    case Enum.find(keys, &(&1["kid"] == kid)) do
      nil -> {:error, {:key_not_found, kid}}
      key -> {:ok, key}
    end
  end

  defp find_key([key | _], _), do: {:ok, key}
  defp find_key([], _), do: {:error, :no_keys}

  defp validate_claims(%{"sub" => sub, "exp" => exp} = claims) when is_binary(sub) do
    if DateTime.compare(DateTime.from_unix!(exp), DateTime.utc_now()) == :gt do
      {:ok, claims}
    else
      {:error, :token_expired}
    end
  end

  defp validate_claims(_), do: {:error, :invalid_claims}
end
