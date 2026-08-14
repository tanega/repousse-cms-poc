defmodule Repousse.Storage do
  @moduledoc """
  Uploads to the MinIO (S3-compatible) object store — avatars and project
  cover images share the same public bucket, under different key prefixes.
  Bucket is created and made publicly readable by the `minio-init` job in
  docker-compose, so URLs returned here need no signing to be fetched by
  the browser.
  """

  @max_bytes 5_000_000
  @allowed_content_types %{
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp",
    "image/gif" => "gif"
  }

  def upload_avatar(%Plug.Upload{} = upload, user_id),
    do: do_upload(upload, "#{user_id}/#{Ecto.UUID.generate()}")

  def upload_project_cover(%Plug.Upload{} = upload, project_id),
    do: do_upload(upload, "projects/#{project_id}/cover/#{Ecto.UUID.generate()}")

  defp do_upload(%Plug.Upload{} = upload, key_prefix) do
    with {:ok, ext} <- validate_content_type(upload.content_type),
         {:ok, size} <- file_size(upload.path),
         :ok <- validate_size(size),
         {:ok, binary} <- File.read(upload.path) do
      key = "#{key_prefix}.#{ext}"

      case do_put_object(key, binary, upload.content_type) do
        {:ok, _} -> {:ok, public_url(key)}
        {:error, reason} -> {:error, "Échec de l'upload : #{inspect(reason)}"}
      end
    end
  end

  defp do_put_object(key, binary, content_type) do
    bucket()
    |> ExAws.S3.put_object(key, binary, content_type: content_type)
    |> ExAws.request()
  end

  defp validate_content_type(content_type) do
    case Map.fetch(@allowed_content_types, content_type) do
      {:ok, ext} -> {:ok, ext}
      :error -> {:error, "Format d'image non supporté (jpeg, png, webp, gif uniquement)"}
    end
  end

  defp file_size(path) do
    case File.stat(path) do
      {:ok, %{size: size}} -> {:ok, size}
      {:error, reason} -> {:error, "Fichier illisible : #{inspect(reason)}"}
    end
  end

  defp validate_size(size) when size <= @max_bytes, do: :ok
  defp validate_size(_size), do: {:error, "Image trop volumineuse (5 Mo maximum)"}

  defp public_url(key), do: "#{public_base_url()}/#{bucket()}/#{key}"

  defp bucket, do: Application.fetch_env!(:repousse, :minio)[:avatars_bucket]
  defp public_base_url, do: Application.fetch_env!(:repousse, :minio)[:public_url]
end
