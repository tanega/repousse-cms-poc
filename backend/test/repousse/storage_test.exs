defmodule Repousse.StorageTest do
  use ExUnit.Case, async: true

  alias Repousse.Storage

  test "rejects unsupported content types" do
    upload = %Plug.Upload{path: "/dev/null", content_type: "application/pdf", filename: "x.pdf"}

    assert {:error, msg} = Storage.upload_avatar(upload, Ecto.UUID.generate())
    assert msg =~ "non supporté"
  end

  test "rejects files over the 5 MB limit" do
    path = Path.join(System.tmp_dir!(), "storage-test-big-avatar.jpg")
    File.write!(path, :binary.copy(<<0>>, 5_000_001))
    on_exit(fn -> File.rm(path) end)

    upload = %Plug.Upload{path: path, content_type: "image/jpeg", filename: "big.jpg"}

    assert {:error, msg} = Storage.upload_avatar(upload, Ecto.UUID.generate())
    assert msg =~ "5 Mo"
  end

  test "rejects unsupported content types for distribution event images" do
    upload = %Plug.Upload{path: "/dev/null", content_type: "application/pdf", filename: "x.pdf"}

    assert {:error, msg} = Storage.upload_distribution_event_image(upload, Ecto.UUID.generate())
    assert msg =~ "non supporté"
  end
end
