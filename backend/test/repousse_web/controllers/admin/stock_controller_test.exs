defmodule RepousseWeb.Admin.StockControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias RepousseWeb.Admin.StockController

  describe "authorization — Distributions.Policy :manage_event" do
    test "a plain member cannot manage stock", %{conn: conn} do
      event = insert(:distribution_event)
      taxon = insert(:taxon)
      stock = insert(:distribution_stock, event: event, taxon: taxon)
      member = insert(:user, role: :member)
      conn = assign(conn, :current_user, member)

      assert {:error, :unauthorized} =
               StockController.index(conn, %{"distribution_id" => event.id})

      assert {:error, :unauthorized} =
               StockController.create(conn, %{
                 "distribution_id" => event.id,
                 "stock" => %{"taxon_id" => taxon.id, "quantity" => 10}
               })

      assert {:error, :unauthorized} =
               StockController.update(conn, %{"id" => stock.id, "stock" => %{"quantity" => 20}})

      assert {:error, :unauthorized} = StockController.delete(conn, %{"id" => stock.id})
    end

    test "an admin can associate a taxon and its quantity to an event (US-DIST-03)", %{conn: conn} do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)

      event = insert(:distribution_event)
      taxon = insert(:taxon)

      result =
        StockController.create(conn, %{
          "distribution_id" => event.id,
          "stock" => %{"taxon_id" => taxon.id, "quantity" => 10}
        })

      assert %Plug.Conn{status: 201} = result
      assert json_response(result, 201)["data"]["quantity"] == 10
    end
  end
end
