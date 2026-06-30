defmodule RepousseWeb.Plugs.AuthPlugTest do
  use ExUnit.Case, async: false

  import Plug.Test
  import Plug.Conn

  alias RepousseWeb.Plugs.AuthPlug

  @kid "test-kid"
  @table :hanko_jwks

  setup do
    jwk = JOSE.JWK.generate_key({:rsa, 2048})
    {_, private_map} = JOSE.JWK.to_map(jwk)
    {_, public_map} = JOSE.JWK.to_public_map(jwk)
    public_map = Map.put(public_map, "kid", @kid)

    :ets.insert(@table, {:keys, [public_map]})
    on_exit(fn -> :ets.delete_all_objects(@table) end)

    %{private_map: private_map}
  end

  defp sign(claims, private_map, headers \\ %{"kid" => @kid}) do
    signer = Joken.Signer.create("RS256", private_map, headers)
    {:ok, token} = Joken.Signer.sign(claims, signer)
    token
  end

  defp request(token) do
    conn = conn(:get, "/api/v1/me")
    conn = if token, do: put_req_header(conn, "authorization", "Bearer #{token}"), else: conn
    AuthPlug.call(conn, AuthPlug.init([]))
  end

  test "valid token assigns hanko_claims and does not halt", %{private_map: private_map} do
    claims = %{"sub" => "user-123", "exp" => System.system_time(:second) + 3600}
    conn = request(sign(claims, private_map))

    refute conn.halted
    assert conn.assigns.hanko_claims["sub"] == "user-123"
  end

  test "missing authorization header returns 401" do
    conn = request(nil)

    assert conn.halted
    assert conn.status == 401
  end

  test "malformed token returns 401" do
    conn = request("not-a-jwt")

    assert conn.halted
    assert conn.status == 401
  end

  test "expired token returns 401", %{private_map: private_map} do
    claims = %{"sub" => "user-123", "exp" => System.system_time(:second) - 10}
    conn = request(sign(claims, private_map))

    assert conn.halted
    assert conn.status == 401
  end

  test "unknown kid returns 401", %{private_map: private_map} do
    claims = %{"sub" => "user-123", "exp" => System.system_time(:second) + 3600}
    conn = request(sign(claims, private_map, %{"kid" => "other-kid"}))

    assert conn.halted
    assert conn.status == 401
  end

  test "signature mismatch (kid matches but key doesn't) returns 401" do
    impostor_jwk = JOSE.JWK.generate_key({:rsa, 2048})
    {_, impostor_private_map} = JOSE.JWK.to_map(impostor_jwk)
    claims = %{"sub" => "user-123", "exp" => System.system_time(:second) + 3600}

    conn = request(sign(claims, impostor_private_map, %{"kid" => @kid}))

    assert conn.halted
    assert conn.status == 401
  end

  test "missing required claims returns 401", %{private_map: private_map} do
    conn = request(sign(%{"sub" => "user-123"}, private_map))

    assert conn.halted
    assert conn.status == 401
  end
end
