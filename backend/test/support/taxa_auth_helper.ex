defmodule Repousse.TaxaAuthHelper do
  @moduledoc """
  Signs a Hanko-shaped JWT for a given `Repousse.Accounts.User` and drops the
  matching public key into the same ETS table `RepousseWeb.Plugs.AuthPlug`
  reads from (`Repousse.Auth.JwksCache`'s `:hanko_jwks` table), so
  controller tests can dispatch through the *real* router pipeline
  (`AuthPlug` -> `LoadCurrentUserPlug` -> role/policy checks) instead of
  stubbing `conn.assigns.current_user` directly and skipping those plugs.

  Mirrors the key setup already used in
  `test/repousse_web/plugs/auth_plug_test.exs`.
  """

  @kid "taxa-test-kid"
  @table :hanko_jwks

  def put_jwt(conn, user) do
    private_map = ensure_keys!()
    Plug.Conn.put_req_header(conn, "authorization", "Bearer #{sign(user, private_map)}")
  end

  defp ensure_keys! do
    jwk = JOSE.JWK.generate_key({:rsa, 2048})
    {_, private_map} = JOSE.JWK.to_map(jwk)
    {_, public_map} = JOSE.JWK.to_public_map(jwk)
    public_map = Map.put(public_map, "kid", @kid)

    # The table itself is created at boot by `Repousse.Auth.JwksCache`; we
    # only ever insert/overwrite the `:keys` entry here.
    :ets.insert(@table, {:keys, [public_map]})
    private_map
  end

  defp sign(user, private_map) do
    claims = %{
      "sub" => user.hanko_id,
      "email" => user.email,
      "exp" => System.system_time(:second) + 3600
    }

    signer = Joken.Signer.create("RS256", private_map, %{"kid" => @kid})
    {:ok, token} = Joken.Signer.sign(claims, signer)
    token
  end
end
