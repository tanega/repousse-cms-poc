defmodule RepousseWeb.OpenApiHelpers do
  @moduledoc """
  Generic response shapes shared across controllers' `operation/2` specs.
  Kept schema-free (plain objects) since none of the contexts expose typed
  OpenApiSpex schema modules yet — good enough to make paths/operations show
  up in Swagger UI without hand-writing a schema per resource.
  """

  alias OpenApiSpex.Schema

  def object(description) do
    {description, "application/json",
     %Schema{type: :object, properties: %{data: %Schema{type: :object}}}}
  end

  def list(description) do
    {description, "application/json",
     %Schema{type: :object, properties: %{data: %Schema{type: :array, items: %Schema{type: :object}}}}}
  end

  def no_content(description \\ "Deleted") do
    {description, nil, nil}
  end
end
