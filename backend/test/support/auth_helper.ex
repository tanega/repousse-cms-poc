defmodule Repousse.AuthHelper do
  @moduledoc """
  Signs Hanko-shaped JWTs for controller tests that go through the real
  `:authenticated` pipeline (`AuthPlug` + `LoadCurrentUserPlug`). Callers must
  seed the `:hanko_jwks` ETS table with the public JWK returned here — see
  `RepousseWeb.Plugs.AuthPlugTest` for the reference `setup` block.
  """

  @kid "test-kid"

  def kid, do: @kid

  def generate_jwk do
    jwk = JOSE.JWK.generate_key({:rsa, 2048})
    {_, private_map} = JOSE.JWK.to_map(jwk)
    {_, public_map} = JOSE.JWK.to_public_map(jwk)
    {private_map, Map.put(public_map, "kid", @kid)}
  end

  def sign(user, private_map) do
    claims = %{
      "sub" => user.hanko_id,
      "email" => user.email,
      "exp" => System.system_time(:second) + 3600
    }

    signer = Joken.Signer.create("RS256", private_map, %{"kid" => @kid})
    {:ok, token} = Joken.Signer.sign(claims, signer)
    token
  end

  def auth_header(user, private_map) do
    {"authorization", "Bearer #{sign(user, private_map)}"}
  end
end
