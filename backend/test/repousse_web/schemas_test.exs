defmodule RepousseWeb.SchemasTest do
  @moduledoc """
  Sanity-checks the typed OpenApiSpex schema modules: each must build a
  valid %OpenApiSpex.Schema{}, and the full spec (which resolves every
  module reference used in a controller's operation/2) must still compile
  without OpenApiSpex raising on a broken $ref or duplicate title.
  """
  use ExUnit.Case, async: true

  alias RepousseWeb.Schemas.{
    User,
    UserProfile,
    Project,
    ProjectMember,
    ProjectInvitation,
    JournalEntry,
    ProjectMedia,
    PreferredSpecies,
    Event,
    Slot,
    Stock,
    Reservation,
    ReservationItem,
    WaitlistEntry,
    Taxon,
    TaxonCategory,
    TaxonVersion,
    TaxonExternalLink
  }

  @schema_modules [
    User,
    UserProfile,
    Project,
    ProjectMember,
    ProjectInvitation,
    JournalEntry,
    ProjectMedia,
    PreferredSpecies,
    Event,
    Slot,
    Stock,
    Reservation,
    ReservationItem,
    WaitlistEntry,
    Taxon,
    TaxonCategory,
    TaxonVersion,
    TaxonExternalLink
  ]

  test "each schema module builds a valid OpenApiSpex.Schema with a title and example" do
    for mod <- @schema_modules do
      schema = mod.schema()
      assert %OpenApiSpex.Schema{} = schema
      assert is_binary(schema.title), "#{inspect(mod)} is missing a title"
      assert schema.type == :object
      assert map_size(schema.properties) > 0
      assert schema.example, "#{inspect(mod)} is missing an example"
    end
  end

  test "the full API spec resolves every schema module reference without error" do
    spec = RepousseWeb.ApiSpec.spec()
    assert %OpenApiSpex.OpenApi{} = spec
    assert map_size(spec.components.schemas) > 0

    for mod <- @schema_modules do
      title = mod.schema().title
      assert Map.has_key?(spec.components.schemas, title), "#{title} missing from components.schemas"
    end
  end
end
