defmodule Repousse.Accounts.UserProfileTest do
  use ExUnit.Case, async: true

  alias Repousse.Accounts.UserProfile

  defp phone_change(raw) do
    %UserProfile{}
    |> UserProfile.changeset(%{
      profile_type: :host_family,
      user_id: Ecto.UUID.generate(),
      hosting_phone: raw
    })
  end

  describe "hosting_phone" do
    test "normalizes a French national number to E.164" do
      for raw <- ["06 12 34 56 78", "06.12.34.56.78", "06-12-34-56-78", "0612345678"] do
        changeset = phone_change(raw)
        assert changeset.valid?, raw
        assert Ecto.Changeset.get_change(changeset, :hosting_phone) == "+33612345678"
      end
    end

    test "keeps international numbers, accepting the 00 prefix" do
      assert Ecto.Changeset.get_change(phone_change("+32 470 12 34 56"), :hosting_phone) == "+32470123456"
      assert Ecto.Changeset.get_change(phone_change("0032 470 12 34 56"), :hosting_phone) == "+32470123456"
    end

    test "rejects malformed numbers" do
      for raw <- ["12345", "06 12 34", "+33 6 12 ab 56 78", "+0612345678"] do
        refute phone_change(raw).valid?, raw
      end
    end

    test "a blank value clears the number" do
      changeset = UserProfile.changeset(%UserProfile{hosting_phone: "+33612345678"}, %{hosting_phone: ""})
      assert Ecto.Changeset.fetch_change(changeset, :hosting_phone) == {:ok, nil}
    end
  end
end
