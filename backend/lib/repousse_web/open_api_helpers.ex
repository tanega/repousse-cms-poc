defmodule RepousseWeb.OpenApiHelpers do
  @moduledoc """
  Response shapes shared across controllers' `operation/2` specs.

  `object/2` and `list/2` wrap a typed `RepousseWeb.Schemas.*` module so
  Swagger UI shows the actual resource shape. `object/1` and `list/1` fall
  back to a generic object/array — use those only for ad-hoc, non-resource
  payloads (dashboard aggregates, custom status responses) that don't map
  to one of the typed schemas.
  """

  alias OpenApiSpex.Schema

  def object(description) when is_binary(description) do
    {description, "application/json",
     %Schema{type: :object, properties: %{data: %Schema{type: :object}}}}
  end

  def object(schema, description) do
    {description, "application/json", %Schema{type: :object, properties: %{data: schema}}}
  end

  def list(description) when is_binary(description) do
    {description, "application/json",
     %Schema{type: :object, properties: %{data: %Schema{type: :array, items: %Schema{type: :object}}}}}
  end

  def list(schema, description) do
    {description, "application/json",
     %Schema{type: :object, properties: %{data: %Schema{type: :array, items: schema}}}}
  end

  def no_content(description \\ "Deleted") do
    {description, nil, nil}
  end
end
