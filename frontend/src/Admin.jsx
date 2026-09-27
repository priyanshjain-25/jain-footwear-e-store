import { useEffect, useState } from "react";

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Men",
    brand: "",
    price: "",
    sizes: "",
    description: "",
    stock: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ======================================================
  // ADMIN AUTH HEADERS
  // ======================================================
  const getAdminHeaders = () => {
    const adminToken = localStorage.getItem("adminToken");

    return {
      Authorization: `Bearer ${adminToken}`,
    };
  };

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================
  const loadProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  // ======================================================
  // LOAD ORDERS
  // ======================================================
  const loadOrders = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          headers: {
            ...getAdminHeaders(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load orders"
        );
      }

      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);

      if (
        error.message === "Admin authentication required" ||
        error.message === "Invalid or expired admin token"
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin";
      }
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminToken =
          localStorage.getItem("adminToken");

        if (!adminToken) {
          window.location.href = "/admin";
          return;
        }

        const [productsResponse, ordersResponse] =
          await Promise.all([
            fetch(
              `${import.meta.env.VITE_API_URL}/api/products`
            ),

            fetch(
              `${import.meta.env.VITE_API_URL}/api/orders`,
              {
                headers: {
                  Authorization: `Bearer ${adminToken}`,
                },
              }
            ),
          ]);

        const productsData =
          await productsResponse.json();

        const ordersData =
          await ordersResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.message ||
              "Failed to load products"
          );
        }

        if (!ordersResponse.ok) {
          throw new Error(
            ordersData.message ||
              "Failed to load orders"
          );
        }

        setProducts(productsData);
        setOrders(ordersData);
      } catch (error) {
        console.error(
          "Failed to load admin data:",
          error
        );

        if (
          error.message ===
            "Admin authentication required" ||
          error.message ===
            "Invalid or expired admin token"
        ) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");

          window.location.href = "/admin";
        }
      }
    };

    fetchData();
  }, []);

  // ======================================================
  // FORM CHANGE
  // ======================================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ======================================================
  // ADD / UPDATE PRODUCT
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("brand", formData.brand);
      data.append("price", formData.price);

      const sizeArray = formData.sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean);

      data.append(
        "sizes",
        JSON.stringify(sizeArray)
      );

      data.append(
        "description",
        formData.description
      );

      data.append("stock", formData.stock);

      if (image) {
        data.append("image", image);
      }

      const url = editingId
        ? `${import.meta.env.VITE_API_URL}/api/products/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          ...getAdminHeaders(),
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Something went wrong"
        );
      }

      alert(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // RESET PRODUCT FORM
  // ======================================================
  const resetForm = () => {
    setEditingId(null);

    setFormData({
      name: "",
      category: "Men",
      brand: "",
      price: "",
      sizes: "",
      description: "",
      stock: "",
    });

    setImage(null);
  };

  // ======================================================
  // EDIT PRODUCT
  // ======================================================
  const handleEdit = (product) => {
    setEditingId(product._id);

    setFormData({
      name: product.name || "",
      category: product.category || "Men",
      brand: product.brand || "",
      price: product.price || "",
      sizes: product.sizes
        ? product.sizes.join(", ")
        : "",
      description: product.description || "",
      stock: product.stock || "",
    });

    setImage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // DELETE PRODUCT
  // ======================================================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
        {
          method: "DELETE",
          headers: {
            ...getAdminHeaders(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product"
        );
      }

      alert("Product deleted successfully!");

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // ======================================================
  // UPDATE ORDER STATUS
  // ======================================================
  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            ...getAdminHeaders(),
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update order status"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? data.order
            : order
        )
      );

      alert(
        "Order status updated successfully!"
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error.message ||
          "Failed to update order status."
      );
    }
  };

  // ======================================================
  // UPDATE RETURN / REPLACE STATUS
  // ======================================================
  const handleReturnRequestStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/return-request-status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            ...getAdminHeaders(),
          },

          body: JSON.stringify({
            returnStatus: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update request status"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? data.order
            : order
        )
      );

      alert(
        "Return/Replace request updated successfully!"
      );
    } catch (error) {
      console.error(
        "Return/Replace status error:",
        error
      );

      alert(
        error.message ||
          "Failed to update request."
      );
    }
  };

  // ======================================================
  // ADMIN LOGOUT
  // ======================================================
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    window.location.href = "/admin";
  };

  // ======================================================
  // RETURN / REPLACE REQUESTS
  // ======================================================
  const returnReplaceRequests =
    orders.filter(
      (order) =>
        order.returnRequest &&
        order.returnRequest !== "None"
    );

  const pendingReturnRequests =
    returnReplaceRequests.filter(
      (order) =>
        order.returnStatus === "Requested"
    ).length;

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-5">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

            <div>
              <h1 className="text-2xl font-bold">
                Jain Footwear Admin
              </h1>

              <p className="text-sm text-gray-300 mt-1">
                Manage products and customer orders
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  (window.location.href = "/")
                }
                className="border border-white text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-black"
              >
                Store
              </button>

              <button
                onClick={handleLogout}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Logout
              </button>

            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm">
              Total Products
            </p>

            <p className="text-3xl font-bold mt-2">
              {products.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm">
              Total Orders
            </p>

            <p className="text-3xl font-bold mt-2">
              {orders.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm">
              Pending Orders
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                orders.filter(
                  (order) =>
                    order.status === "Pending"
                ).length
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-sm">
              Pending Return/Replace
            </p>

            <p className="text-3xl font-bold mt-2">
              {pendingReturnRequests}
            </p>
          </div>

        </div>

        {/* ADD / EDIT PRODUCT */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              {editingId
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            {editingId && (
              <button
                onClick={resetForm}
                className="text-sm text-red-600 font-semibold"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            <div>
              <label className="block text-sm font-semibold mb-2">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Example: Sports Shoes"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Sports">Sports</option>
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Sandals">Sandals</option>
                <option value="Slippers">Slippers</option>
                <option value="School Shoes">
                  School Shoes
                </option>
                <option value="Boots">Boots</option>
                <option value="Loafers">Loafers</option>
                <option value="Flip Flops">
                  Flip Flops
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Brand
              </label>

              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Brand name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Price (₹)
              </label>

              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                placeholder="999"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Sizes
              </label>

              <input
                type="text"
                name="sizes"
                value={formData.sizes}
                onChange={handleChange}
                placeholder="6, 7, 8, 9, 10"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1">
                Separate sizes with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="10"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Product description"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImage(e.target.files[0])
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />

              {editingId && (
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to keep the existing
                  image.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </div>

          </form>
        </section>

        {/* PRODUCTS */}
        <section className="mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              Products
            </h2>

            <span className="text-sm text-gray-500">
              {products.length} Products
            </span>

          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">

              <p className="text-gray-500">
                No products added yet.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {products.map((product) => (

                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >

                  <div className="h-56 bg-gray-100">

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}

                  </div>

                  <div className="p-5">

                    <p className="text-sm text-gray-500">
                      {product.category}
                    </p>

                    <h3 className="font-bold text-lg mt-1">
                      {product.name}
                    </h3>

                    {product.brand && (
                      <p className="text-sm text-gray-500 mt-1">
                        {product.brand}
                      </p>
                    )}

                    <p className="text-xl font-bold mt-3">
                      ₹{product.price}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      Stock: {product.stock}
                    </p>

                    <div className="flex gap-2 mt-4">

                      <button
                        onClick={() =>
                          handleEdit(product)
                        }
                        className="flex-1 bg-gray-200 text-black py-2 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(product._id)
                        }
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

        {/* RETURN / REPLACE REQUESTS */}
        <section className="mb-10">

          <div className="flex justify-between items-center mb-6">

            <div>

              <h2 className="text-2xl font-bold">
                Return & Replace Requests
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage customer return and replacement
                requests
              </p>

            </div>

            <button
              onClick={loadOrders}
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Refresh
            </button>

          </div>

          {returnReplaceRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">

              <p className="text-gray-500">
                No return or replacement requests.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {returnReplaceRequests.map(
                (order) => (

                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-sm p-6"
                  >

                    <div className="flex flex-col md:flex-row md:justify-between gap-5 border-b pb-5">

                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Request Type
                        </p>

                        <p className="font-bold text-lg mt-1">
                          {order.returnRequest}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Order ID
                        </p>

                        <p className="font-semibold mt-1 break-all">
                          {order._id}
                        </p>
                      </div>

                      <div>

                        <p className="text-xs text-gray-500 uppercase">
                          Request Status
                        </p>

                        <select
                          value={
                            order.returnStatus ||
                            "Requested"
                          }
                          onChange={(e) =>
                            handleReturnRequestStatus(
                              order._id,
                              e.target.value
                            )
                          }
                          className="mt-1 border border-gray-300 rounded-lg px-3 py-2 font-semibold outline-none"
                        >

                          <option value="Requested">
                            Requested
                          </option>

                          <option value="Approved">
                            Approved
                          </option>

                          <option value="Rejected">
                            Rejected
                          </option>

                          <option value="Completed">
                            Completed
                          </option>

                        </select>

                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b">

                      <div>

                        <h3 className="font-bold mb-2">
                          Customer
                        </h3>

                        <p>
                          <strong>Name:</strong>{" "}
                          {order.customer?.name}
                        </p>

                        <p className="mt-1">
                          <strong>Mobile:</strong>{" "}
                          {order.customer?.mobile}
                        </p>

                        <p className="mt-1">
                          <strong>Email:</strong>{" "}
                          {order.customer?.email ||
                            "Not available"}
                        </p>

                      </div>

                      <div>

                        <h3 className="font-bold mb-2">
                          Reason
                        </h3>

                        <p className="text-gray-700">
                          {order.returnReason ||
                            "No reason provided"}
                        </p>

                      </div>

                    </div>

                    <div className="pt-5">

                      <h3 className="font-bold mb-3">
                        Product
                      </h3>

                      {order.items?.map(
                        (item, index) => (

                          <div
                            key={`${order._id}-request-${index}`}
                            className="flex gap-4 items-center"
                          >

                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">

                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )}

                            </div>

                            <div>

                              <p className="font-semibold">
                                {item.name}
                              </p>

                              {item.size && (
                                <p className="text-sm text-gray-500">
                                  Size: {item.size}
                                </p>
                              )}

                              <p className="text-sm text-gray-500">
                                Quantity:{" "}
                                {item.quantity}
                              </p>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </section>

        {/* CUSTOMER ORDERS */}
        <section className="mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              Customer Orders
            </h2>

            <button
              onClick={loadOrders}
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Refresh Orders
            </button>

          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">

              <p className="text-gray-500">
                No customer orders yet.
              </p>

            </div>
          ) : (
            <div className="space-y-6">

              {orders.map((order) => (

                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-sm p-6"
                >

                  <div className="flex flex-col md:flex-row md:justify-between gap-4 border-b pb-5">

                    <div>

                      <p className="text-sm text-gray-500">
                        Order ID
                      </p>

                      <p className="font-semibold break-all">
                        {order._id}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Order Date
                      </p>

                      <p className="font-semibold">
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Status
                      </p>

                      <select
                        value={
                          order.status ||
                          "Pending"
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            order._id,
                            e.target.value
                          )
                        }
                        className="mt-2 border border-gray-300 rounded-lg px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-black"
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Confirmed">
                          Confirmed
                        </option>

                        <option value="Shipped">
                          Shipped
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* CUSTOMER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b">

                    <div>

                      <h3 className="font-bold mb-3">
                        Customer
                      </h3>

                      <p>
                        <strong>Name:</strong>{" "}
                        {order.customer?.name}
                      </p>

                      <p className="mt-1">
                        <strong>Mobile:</strong>{" "}
                        {order.customer?.mobile}
                      </p>

                    </div>

                    <div>

                      <h3 className="font-bold mb-3">
                        Delivery Address
                      </h3>

                      <p>
                        {order.customer?.address}
                      </p>

                      <p>
                        {order.customer?.city},{" "}
                        {order.customer?.state} -{" "}
                        {order.customer?.pincode}
                      </p>

                    </div>

                  </div>

                  {/* PAYMENT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b">

                    <div>

                      <p className="text-sm text-gray-500">
                        Payment Method
                      </p>

                      <p className="font-semibold mt-1">
                        {order.paymentMethod ||
                          "Razorpay"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Payment Status
                      </p>

                      <p className="font-semibold mt-1">
                        {order.paymentStatus ||
                          "Pending"}
                      </p>

                    </div>

                  </div>

                  {/* ITEMS */}
                  <div className="py-6">

                    <h3 className="font-bold mb-4">
                      Ordered Products
                    </h3>

                    <div className="space-y-4">

                      {order.items?.map(
                        (item, index) => (

                          <div
                            key={`${order._id}-${index}`}
                            className="flex gap-4 items-center border-b pb-4 last:border-b-0"
                          >

                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">

                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}

                            </div>

                            <div className="flex-1">

                              <p className="font-semibold">
                                {item.name}
                              </p>

                              {item.size && (
                                <p className="text-sm text-gray-500">
                                  Size: {item.size}
                                </p>
                              )}

                              <p className="text-sm text-gray-500">
                                Quantity:{" "}
                                {item.quantity}
                              </p>

                            </div>

                            <p className="font-bold">
                              ₹
                              {item.price *
                                item.quantity}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                  {/* RETURN / REPLACE SUMMARY */}
                  {order.returnRequest &&
                    order.returnRequest !==
                      "None" && (

                      <div className="bg-gray-50 rounded-lg p-4 mb-5">

                        <p className="font-bold">
                          {order.returnRequest} Request
                        </p>

                        <p className="text-sm text-gray-600 mt-1">
                          Status:{" "}
                          {order.returnStatus}
                        </p>

                        <p className="text-sm text-gray-600 mt-1">
                          Reason:{" "}
                          {order.returnReason ||
                            "Not provided"}
                        </p>

                      </div>
                    )}

                  {/* TOTAL */}
                  <div className="border-t pt-5 flex justify-between items-center">

                    <span className="text-lg font-bold">
                      Total Amount
                    </span>

                    <span className="text-2xl font-bold">
                      ₹{order.totalAmount}
                    </span>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Admin;