import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Men",
    brand: "",
    mrp: "",
    price: "",
    sizes: "",
    description: "",
    stock: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ======================================================
  // PRODUCT DESIGNS
  // ======================================================
  const [designs, setDesigns] = useState([]);

  // ======================================================
  // ORDER MANAGEMENT
  // ======================================================
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("All");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 20;

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
        `${API_URL}/api/products`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      setProducts(data);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );
    }
  };

  // ======================================================
  // LOAD ORDERS
  // ======================================================
  const loadOrders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/orders`,
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
      console.error(
        "Failed to load orders:",
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

        const [
          productsResponse,
          ordersResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/products`),

          fetch(`${API_URL}/api/orders`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }),
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
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ======================================================
  // ADD DESIGN
  // ======================================================
  const addDesign = () => {
    setDesigns((previousDesigns) => [
      ...previousDesigns,
      {
        name: "",
        stock: "",
        images: [],
        existingImages: [],
      },
    ]);
  };

  // ======================================================
  // REMOVE DESIGN
  // ======================================================
  const removeDesign = (index) => {
    setDesigns((previousDesigns) =>
      previousDesigns.filter(
        (_, designIndex) =>
          designIndex !== index
      )
    );
  };

  // ======================================================
  // UPDATE DESIGN
  // ======================================================
  const updateDesign = (
    index,
    field,
    value
  ) => {
    setDesigns((previousDesigns) =>
      previousDesigns.map(
        (design, designIndex) =>
          designIndex === index
            ? {
                ...design,
                [field]: value,
              }
            : design
      )
    );
  };

  // ======================================================
  // UPDATE DESIGN IMAGES
  // ======================================================
  const updateDesignImages = (
    index,
    files
  ) => {
    setDesigns((previousDesigns) =>
      previousDesigns.map(
        (design, designIndex) =>
          designIndex === index
            ? {
                ...design,
                images: Array.from(files),
              }
            : design
      )
    );
  };

  // ======================================================
  // REMOVE EXISTING DESIGN IMAGE
  // ======================================================
  const removeExistingDesignImage = (
    designIndex,
    imageIndex
  ) => {
    setDesigns((previousDesigns) =>
      previousDesigns.map(
        (design, index) => {
          if (index !== designIndex) {
            return design;
          }

          return {
            ...design,
            existingImages:
              design.existingImages.filter(
                (_, imgIndex) =>
                  imgIndex !== imageIndex
              ),
          };
        }
      )
    );
  };

  // ======================================================
  // ADD / UPDATE PRODUCT
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const data = new FormData();

      // --------------------------------------------------
      // BASIC PRODUCT DATA
      // --------------------------------------------------
      data.append(
        "name",
        formData.name
      );

      data.append(
        "category",
        formData.category
      );

      data.append(
        "brand",
        formData.brand
      );

      data.append(
        "mrp",
        formData.mrp
      );

      data.append(
        "price",
        formData.price
      );

      const sizeArray =
        formData.sizes
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

      data.append(
        "stock",
        formData.stock
      );

      // --------------------------------------------------
      // MAIN PRODUCT IMAGE
      // --------------------------------------------------
      if (image) {
        data.append(
          "image",
          image
        );
      }

      // --------------------------------------------------
      // DESIGNS
      // --------------------------------------------------
      const designsForBackend =
        designs.map((design) => ({
          name: design.name,
          stock: Number(
            design.stock || 0
          ),
          existingImages:
            design.existingImages || [],
          imageCount:
            design.images?.length || 0,
        }));

      if (designs.length > 0) {
        data.append(
          "designs",
          JSON.stringify(
            designsForBackend
          )
        );
      }

      // --------------------------------------------------
      // DESIGN IMAGES
      // --------------------------------------------------
      designs.forEach((design) => {
        if (
          design.images &&
          design.images.length > 0
        ) {
          design.images.forEach(
            (file) => {
              data.append(
                "designImages",
                file
              );
            }
          );
        }
      });

      // --------------------------------------------------
      // DEBUG
      // --------------------------------------------------
      console.log(
        "========== FORM DATA =========="
      );

      for (const [
        key,
        value,
      ] of data.entries()) {
        console.log(
          key,
          ":",
          value
        );
      }

      console.log(
        "================================"
      );

      // --------------------------------------------------
      // URL + METHOD
      // --------------------------------------------------
      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;

      const method = editingId
        ? "PUT"
        : "POST";

      // --------------------------------------------------
      // REQUEST
      // --------------------------------------------------
      const response =
        await fetch(url, {
          method,
          headers: {
            ...getAdminHeaders(),
          },
          body: data,
        });

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Something went wrong"
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

      alert(
        error.message ||
          "Something went wrong"
      );
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
      mrp: "",
      price: "",
      sizes: "",
      description: "",
      stock: "",
    });

    setImage(null);
    setDesigns([]);
  };

  // ======================================================
  // EDIT PRODUCT
  // ======================================================
  const handleEdit = (product) => {
    setEditingId(product._id);

    setFormData({
      name: product.name || "",
      category:
        product.category || "Men",
      brand: product.brand || "",
      mrp:
        product.mrp ?? "",
      price:
        product.price ?? "",
      sizes:
        Array.isArray(product.sizes)
          ? product.sizes.join(", ")
          : "",
      description:
        product.description || "",
      stock:
        product.stock ?? "",
    });

    setImage(null);

    // Load existing designs
    if (
      Array.isArray(product.designs)
    ) {
      setDesigns(
        product.designs.map(
          (design) => ({
            name:
              design.name || "",
            stock:
              design.stock ?? "",
            images: [],
            existingImages:
              Array.isArray(
                design.images
              )
                ? design.images
                : [],
          })
        )
      );
    } else {
      setDesigns([]);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // DELETE PRODUCT
  // ======================================================
  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/products/${id}`,
          {
            method: "DELETE",
            headers: {
              ...getAdminHeaders(),
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product"
        );
      }

      alert(
        "Product deleted successfully!"
      );

      await loadProducts();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Failed to delete product"
      );
    }
  };

  // ======================================================
  // UPDATE ORDER STATUS
  // ======================================================
  const handleStatusChange = async (
    orderId,
    newStatus,
    showAlert = true
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
              ...getAdminHeaders(),
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update order status"
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order._id === orderId
                ? data.order
                : order
          )
      );

      if (showAlert) {
        alert(
          "Order status updated successfully!"
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      if (showAlert) {
        alert(
          error.message ||
            "Failed to update order status."
        );
      }

      return false;
    }
  };

  // ======================================================
  // BULK STATUS UPDATE
  // ======================================================
  const handleBulkStatus = async (
    newStatus
  ) => {
    if (
      selectedOrders.length === 0
    ) {
      alert(
        "Please select at least one order."
      );
      return;
    }

    const selectedCount =
      selectedOrders.length;

    const confirmed =
      window.confirm(
        `Change ${selectedCount} selected order(s) to ${newStatus}?`
      );

    if (!confirmed) {
      return;
    }

    for (const orderId of selectedOrders) {
      await handleStatusChange(
        orderId,
        newStatus,
        false
      );
    }

    setSelectedOrders([]);

    await loadOrders();

    alert(
      `${selectedCount} order(s) updated successfully.`
    );
  };

  // ======================================================
  // UPDATE RETURN / REPLACE STATUS
  // ======================================================
  const handleReturnRequestStatus =
    async (
      orderId,
      newStatus
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/orders/${orderId}/return-request-status`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
                ...getAdminHeaders(),
              },

              body: JSON.stringify({
                returnStatus:
                  newStatus,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update request status"
          );
        }

        setOrders(
          (currentOrders) =>
            currentOrders.map(
              (order) =>
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
    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "adminUser"
    );

    window.location.href =
      "/admin";
  };

  // ======================================================
  // RETURN / REPLACE REQUESTS
  // ======================================================
  const returnReplaceRequests =
    orders.filter(
      (order) =>
        order.returnRequest &&
        order.returnRequest !==
          "None"
    );

  const pendingReturnRequests =
    returnReplaceRequests.filter(
      (order) =>
        order.returnStatus ===
        "Requested"
    ).length;

  // ======================================================
  // ORDER COUNTS
  // ======================================================
  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "Pending"
    ).length;

  const confirmedOrders =
    orders.filter(
      (order) =>
        order.status === "Confirmed"
    ).length;

  const shippedOrders =
    orders.filter(
      (order) =>
        order.status === "Shipped"
    ).length;

  // ======================================================
  // ORDER SEARCH + FILTER
  // ======================================================
  const filteredOrders =
    orders.filter((order) => {
      const search =
        orderSearch
          .toLowerCase()
          .trim();

      const matchesSearch =
        !search ||
        order._id
          ?.toLowerCase()
          .includes(search) ||
        order.customer?.name
          ?.toLowerCase()
          .includes(search) ||
        order.customer?.mobile
          ?.toLowerCase()
          .includes(search);

      const matchesFilter =
        orderFilter === "All" ||
        order.status ===
          orderFilter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  // ======================================================
  // PAGINATION
  // ======================================================
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        ordersPerPage
    )
  );

  const startIndex =
    (currentPage - 1) *
    ordersPerPage;

  const visibleOrders =
    filteredOrders.slice(
      startIndex,
      startIndex +
        ordersPerPage
    );

  // ======================================================
  // SELECT ORDER
  // ======================================================
  const toggleOrderSelection =
    (orderId) => {
      setSelectedOrders(
        (current) =>
          current.includes(orderId)
            ? current.filter(
                (id) =>
                  id !== orderId
              )
            : [
                ...current,
                orderId,
              ]
      );
    };

  // ======================================================
  // SELECT ALL VISIBLE ORDERS
  // ======================================================
  const toggleSelectAll = () => {
    const visibleIds =
      visibleOrders.map(
        (order) => order._id
      );

    const allSelected =
      visibleIds.every(
        (id) =>
          selectedOrders.includes(
            id
          )
      );

    if (allSelected) {
      setSelectedOrders(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.includes(
                id
              )
          )
      );
    } else {
      setSelectedOrders(
        (current) => [
          ...new Set([
            ...current,
            ...visibleIds,
          ]),
        ]
      );
    }
  };

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-black text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">

            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Jain Footwear Admin
              </h1>

              <p className="text-xs md:text-sm text-gray-300 mt-1">
                Manage products and customer orders
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  (window.location.href =
                    "/")
                }
                className="border border-white text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-black"
              >
                Store
              </button>

              <button
                onClick={
                  handleLogout
                }
                className="bg-white text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Logout
              </button>

            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5">

        {/* ==================================================
            DASHBOARD
        ================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              Products
            </p>

            <p className="text-2xl font-bold mt-1">
              {products.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              Orders
            </p>

            <p className="text-2xl font-bold mt-1">
              {orders.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              New
            </p>

            <p className="text-2xl font-bold mt-1">
              {pendingOrders}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              Confirmed
            </p>

            <p className="text-2xl font-bold mt-1">
              {confirmedOrders}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              Shipped
            </p>

            <p className="text-2xl font-bold mt-1">
              {shippedOrders}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-500 text-xs">
              Returns
            </p>

            <p className="text-2xl font-bold mt-1">
              {pendingReturnRequests}
            </p>
          </div>

        </div>

        {/* ==================================================
            ADD / EDIT PRODUCT
        ================================================== */}
        <section className="bg-white rounded-xl shadow-sm p-5 mb-8">

          <div className="flex justify-between items-center mb-5">

            <h2 className="text-xl font-bold">
              {editingId
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            {editingId && (
              <button
                onClick={
                  resetForm
                }
                className="text-sm text-red-600 font-semibold"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >

            {/* PRODUCT NAME */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                required
                placeholder="Example: Sports Shoes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Category
              </label>

              <select
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none"
              >
                <option value="Men">
                  Men
                </option>

                <option value="Women">
                  Women
                </option>

                <option value="Kids">
                  Kids
                </option>

                <option value="Sports">
                  Sports
                </option>

                <option value="Formal">
                  Formal
                </option>

                <option value="Casual">
                  Casual
                </option>

                <option value="Sandals">
                  Sandals
                </option>

                <option value="Slippers">
                  Slippers
                </option>

                <option value="School Shoes">
                  School Shoes
                </option>

                <option value="Boots">
                  Boots
                </option>

                <option value="Loafers">
                  Loafers
                </option>

                <option value="Flip Flops">
                  Flip Flops
                </option>
              </select>
            </div>

            {/* BRAND */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Brand
              </label>

              <input
                type="text"
                name="brand"
                value={
                  formData.brand
                }
                onChange={
                  handleChange
                }
                placeholder="Brand name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* MRP */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                MRP (₹)
              </label>

              <input
                type="number"
                name="mrp"
                value={
                  formData.mrp
                }
                onChange={
                  handleChange
                }
                required
                min="0"
                placeholder="2000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1">
                Original Maximum Retail Price
              </p>
            </div>

            {/* SELLING PRICE */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Selling Price (₹)
              </label>

              <input
                type="number"
                name="price"
                value={
                  formData.price
                }
                onChange={
                  handleChange
                }
                required
                min="0"
                placeholder="1499"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1">
                Actual price customer will pay
              </p>
            </div>

            {/* SIZES */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Sizes
              </label>

              <input
                type="text"
                name="sizes"
                value={
                  formData.sizes
                }
                onChange={
                  handleChange
                }
                placeholder="6, 7, 8, 9, 10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1">
                Separate sizes with commas
              </p>
            </div>

            {/* STOCK */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={
                  formData.stock
                }
                onChange={
                  handleChange
                }
                min="0"
                placeholder="10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1">
                Main product stock
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">

              <label className="block text-sm font-semibold mb-1">
                Description
              </label>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                rows="3"
                placeholder="Product description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />

            </div>

            {/* MAIN IMAGE */}
            <div className="md:col-span-2">

              <label className="block text-sm font-semibold mb-1">
                Main Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImage(
                    e.target.files?.[0] ||
                      null
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
              />

              {editingId && (
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep the existing image.
                </p>
              )}

            </div>

            {/* ==================================================
                DESIGNS SECTION
            ================================================== */}
            <div className="md:col-span-2 border-t pt-5 mt-2">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

                <div>
                  <h3 className="text-lg font-bold">
                    Product Designs
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Add different designs/colors. Each design can have multiple real photos and its own stock.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addDesign
                  }
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800"
                >
                  + Add Design
                </button>

              </div>

              {designs.length ===
              0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center">

                  <p className="text-sm text-gray-500">
                    No designs added.
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Example: Black, White, Blue, Red Design
                  </p>

                </div>
              ) : (
                <div className="space-y-5">

                  {designs.map(
                    (
                      design,
                      designIndex
                    ) => (

                      <div
                        key={
                          designIndex
                        }
                        className="border border-gray-300 rounded-xl p-4 bg-gray-50"
                      >

                        {/* DESIGN HEADER */}
                        <div className="flex justify-between items-center mb-4">

                          <div>
                            <h4 className="font-bold">
                              Design{" "}
                              {designIndex +
                                1}
                            </h4>

                            <p className="text-xs text-gray-500">
                              Add design name, stock and photos
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeDesign(
                                designIndex
                              )
                            }
                            className="text-red-600 text-sm font-semibold hover:text-red-800"
                          >
                            Remove
                          </button>

                        </div>

                        {/* DESIGN NAME + STOCK */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          <div>

                            <label className="block text-sm font-semibold mb-1">
                              Design Name
                            </label>

                            <input
                              type="text"
                              value={
                                design.name
                              }
                              onChange={(
                                e
                              ) =>
                                updateDesign(
                                  designIndex,
                                  "name",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="Example: Black"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
                            />

                          </div>

                          <div>

                            <label className="block text-sm font-semibold mb-1">
                              Design Stock
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={
                                design.stock
                              }
                              onChange={(
                                e
                              ) =>
                                updateDesign(
                                  designIndex,
                                  "stock",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="20"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
                            />

                          </div>

                        </div>

                        {/* DESIGN IMAGES */}
                        <div className="mt-4">

                          <label className="block text-sm font-semibold mb-1">
                            Design Photos
                          </label>

                          <p className="text-xs text-gray-500 mb-2">
                            You can select multiple real product photos: front, side, back, sole, etc.
                          </p>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(
                              e
                            ) =>
                              updateDesignImages(
                                designIndex,
                                e.target
                                  .files
                              )
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                          />

                        </div>

                        {/* EXISTING IMAGES */}
                        {design
                          .existingImages
                          ?.length >
                          0 && (
                          <div className="mt-4">

                            <p className="text-sm font-semibold mb-2">
                              Existing Photos
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                              {design.existingImages.map(
                                (
                                  imageUrl,
                                  imageIndex
                                ) => (

                                  <div
                                    key={
                                      imageIndex
                                    }
                                    className="relative bg-white border rounded-lg overflow-hidden"
                                  >

                                    <img
                                      src={
                                        imageUrl
                                      }
                                      alt={`${design.name} ${imageIndex + 1}`}
                                      className="w-full h-28 object-cover"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeExistingDesignImage(
                                          designIndex,
                                          imageIndex
                                        )
                                      }
                                      className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold"
                                    >
                                      ×
                                    </button>

                                  </div>

                                )
                              )}

                            </div>

                          </div>
                        )}

                        {/* NEW IMAGE PREVIEWS */}
                        {design
                          .images
                          ?.length >
                          0 && (
                          <div className="mt-4">

                            <p className="text-sm font-semibold mb-2">
                              New Photos
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                              {design.images.map(
                                (
                                  file,
                                  imageIndex
                                ) => (

                                  <div
                                    key={
                                      imageIndex
                                    }
                                    className="bg-white border rounded-lg overflow-hidden"
                                  >

                                    <img
                                      src={URL.createObjectURL(
                                        file
                                      )}
                                      alt={`New design ${imageIndex + 1}`}
                                      className="w-full h-28 object-cover"
                                    />

                                  </div>

                                )
                              )}

                            </div>

                          </div>
                        )}

                        {/* DESIGN SUMMARY */}
                        <div className="mt-4 text-xs text-gray-500">

                          <p>
                            Photos selected:{" "}
                            <strong>
                              {design
                                .images
                                ?.length ||
                                0}
                            </strong>
                          </p>

                          {design
                            .existingImages
                            ?.length >
                            0 && (
                            <p>
                              Existing photos:{" "}
                              <strong>
                                {
                                  design
                                    .existingImages
                                    .length
                                }
                              </strong>
                            </p>
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  loading
                }
                className="bg-black text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
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

        {/* ==================================================
            PRODUCTS
        ================================================== */}
        <section className="mb-8">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-xl font-bold">
              Products
            </h2>

            <span className="text-sm text-gray-500">
              {products.length} Products
            </span>

          </div>

          {products.length ===
          0 ? (
            <div className="bg-white rounded-xl p-8 text-center">

              <p className="text-gray-500">
                No products added yet.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

              {products.map(
                (product) => (

                  <div
                    key={
                      product._id
                    }
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >

                    <div className="h-40 bg-gray-100">

                      {product.image ? (
                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}

                    </div>

                    <div className="p-3">

                      <p className="text-xs text-gray-500">
                        {
                          product.category
                        }
                      </p>

                      <h3 className="font-bold text-sm mt-1 line-clamp-2">
                        {
                          product.name
                        }
                      </h3>

                      {product.brand && (
                        <p className="text-xs text-gray-500 mt-1">
                          {
                            product.brand
                          }
                        </p>
                      )}

                      {Number(
                        product.mrp
                      ) >
                      Number(
                        product.price
                      ) ? (
                        <div className="mt-2">

                          <div className="flex items-center gap-2">

                            <span className="text-sm text-gray-500 line-through">
                              ₹
                              {
                                product.mrp
                              }
                            </span>

                            <span className="text-xs font-semibold text-green-600">
                              {Math.round(
                                ((Number(
                                  product.mrp
                                ) -
                                  Number(
                                    product.price
                                  )) /
                                  Number(
                                    product.mrp
                                  )) *
                                  100
                              )}
                              % OFF
                            </span>

                          </div>

                          <p className="text-lg font-bold">
                            ₹
                            {
                              product.price
                            }
                          </p>

                        </div>
                      ) : (
                        <p className="text-lg font-bold mt-2">
                          ₹
                          {
                            product.price
                          }
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Stock:{" "}
                        {
                          product.stock
                        }
                      </p>

                      {product.designs
                        ?.length >
                        0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {
                            product
                              .designs
                              .length
                          }{" "}
                          design(s)
                        </p>
                      )}

                      <div className="flex gap-2 mt-3">

                        <button
                          onClick={() =>
                            handleEdit(
                              product
                            )
                          }
                          className="flex-1 bg-gray-200 text-black py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-300"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              product._id
                            )
                          }
                          className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </section>

        {/* ==================================================
            RETURN / REPLACE REQUESTS
        ================================================== */}
        <section className="mb-8">

          <div className="flex justify-between items-center mb-4">

            <div>

              <h2 className="text-xl font-bold">
                Return & Replace Requests
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Manage customer return and replacement requests
              </p>

            </div>

            <button
              onClick={
                loadOrders
              }
              className="bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Refresh
            </button>

          </div>

          {returnReplaceRequests.length ===
          0 ? (
            <div className="bg-white rounded-xl p-8 text-center">

              <p className="text-gray-500">
                No return or replacement requests.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {returnReplaceRequests.map(
                (order) => (

                  <div
                    key={
                      order._id
                    }
                    className="bg-white rounded-lg shadow-sm p-4"
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                      <div>

                        <p className="text-xs text-gray-500">
                          {
                            order.returnRequest
                          }{" "}
                          • Order
                        </p>

                        <p className="font-semibold text-sm break-all">
                          {
                            order._id
                          }
                        </p>

                        <p className="text-xs text-gray-600 mt-1">
                          {
                            order.customer
                              ?.name
                          }{" "}
                          •{" "}
                          {
                            order.customer
                              ?.mobile
                          }
                        </p>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-xs text-gray-500">
                          Status
                        </span>

                        <select
                          value={
                            order.returnStatus ||
                            "Requested"
                          }
                          onChange={(
                            e
                          ) =>
                            handleReturnRequestStatus(
                              order._id,
                              e.target
                                .value
                            )
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none"
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

                    <div className="mt-3 border-t pt-3">

                      <p className="text-xs text-gray-500">
                        Reason
                      </p>

                      <p className="text-sm mt-1">
                        {
                          order.returnReason ||
                          "No reason provided"
                        }
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </section>

        {/* ==================================================
            CUSTOMER ORDERS
        ================================================== */}
        <section className="mb-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">

            <div>

              <h2 className="text-xl font-bold">
                Customer Orders
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Compact order management
              </p>

            </div>

            <button
              onClick={
                loadOrders
              }
              className="bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Refresh Orders
            </button>

          </div>

          {/* SEARCH */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">

            <div className="flex flex-col md:flex-row gap-2">

              <input
                type="text"
                value={
                  orderSearch
                }
                onChange={(e) =>
                  setOrderSearch(
                    e.target.value
                  )
                }
                placeholder="Search order ID, customer name or mobile..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />

              <select
                value={
                  orderFilter
                }
                onChange={(e) =>
                  setOrderFilter(
                    e.target.value
                  )
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
              >

                <option value="All">
                  All Orders
                </option>

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

          {/* BULK ACTION BAR */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    visibleOrders.length >
                      0 &&
                    visibleOrders.every(
                      (order) =>
                        selectedOrders.includes(
                          order._id
                        )
                    )
                  }
                  onChange={
                    toggleSelectAll
                  }
                  className="w-4 h-4"
                />

                Select All Visible

              </label>

              <div className="flex flex-wrap gap-2">

                <button
                  onClick={() =>
                    handleBulkStatus(
                      "Confirmed"
                    )
                  }
                  disabled={
                    selectedOrders.length ===
                    0
                  }
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
                >
                  Confirm
                </button>

                <button
                  onClick={() =>
                    handleBulkStatus(
                      "Shipped"
                    )
                  }
                  disabled={
                    selectedOrders.length ===
                    0
                  }
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
                >
                  Shipped
                </button>

                <button
                  onClick={() =>
                    handleBulkStatus(
                      "Delivered"
                    )
                  }
                  disabled={
                    selectedOrders.length ===
                    0
                  }
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
                >
                  Delivered
                </button>

                <button
                  onClick={() =>
                    handleBulkStatus(
                      "Cancelled"
                    )
                  }
                  disabled={
                    selectedOrders.length ===
                    0
                  }
                  className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40"
                >
                  Cancel
                </button>

              </div>

              <span className="text-xs text-gray-500">
                {
                  selectedOrders.length
                }{" "}
                selected
              </span>

            </div>

          </div>

          {orders.length ===
          0 ? (
            <div className="bg-white rounded-lg p-8 text-center">

              <p className="text-gray-500">
                No customer orders yet.
              </p>

            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="bg-white rounded-lg p-8 text-center">

              <p className="text-gray-500">
                No orders match your search.
              </p>

            </div>
          ) : (
            <>

              {/* COMPACT ORDER TABLE */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead className="bg-gray-50 border-b">

                      <tr className="text-left text-xs text-gray-500">

                        <th className="px-3 py-3">
                          Select
                        </th>

                        <th className="px-3 py-3">
                          Order
                        </th>

                        <th className="px-3 py-3">
                          Customer
                        </th>

                        <th className="px-3 py-3">
                          Amount
                        </th>

                        <th className="px-3 py-3">
                          Payment
                        </th>

                        <th className="px-3 py-3">
                          Status
                        </th>

                        <th className="px-3 py-3">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {visibleOrders.map(
                        (order) => (

                          <tr
                            key={
                              order._id
                            }
                            className="border-b last:border-b-0 hover:bg-gray-50"
                          >

                            {/* SELECT */}
                            <td className="px-3 py-3">

                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(
                                  order._id
                                )}
                                onChange={() =>
                                  toggleOrderSelection(
                                    order._id
                                  )
                                }
                                className="w-4 h-4"
                              />

                            </td>

                            {/* ORDER */}
                            <td className="px-3 py-3">

                              <p className="font-semibold text-xs">
                                #
                                {
                                  order._id.slice(
                                    -8
                                  )
                                }
                              </p>

                              <p className="text-[11px] text-gray-500 mt-1">
                                {order.createdAt
                                  ? new Date(
                                      order.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>

                            </td>

                            {/* CUSTOMER */}
                            <td className="px-3 py-3">

                              <p className="font-semibold text-xs">
                                {
                                  order
                                    .customer
                                    ?.name ||
                                  "N/A"
                                }
                              </p>

                              <p className="text-[11px] text-gray-500 mt-1">
                                {
                                  order
                                    .customer
                                    ?.mobile ||
                                  "N/A"
                                }
                              </p>

                            </td>

                            {/* AMOUNT */}
                            <td className="px-3 py-3">

                              <p className="font-bold text-sm">
                                ₹
                                {
                                  order.totalAmount
                                }
                              </p>

                              <p className="text-[11px] text-gray-500">
                                {
                                  order.items
                                    ?.length ||
                                  0
                                }{" "}
                                item(s)
                              </p>

                            </td>

                            {/* PAYMENT */}
                            <td className="px-3 py-3">

                              <span
                                className={`inline-block px-2 py-1 rounded-md text-[11px] font-semibold ${
                                  order.paymentStatus ===
                                  "Paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {
                                  order.paymentStatus ||
                                  "Pending"
                                }
                              </span>

                            </td>

                            {/* STATUS */}
                            <td className="px-3 py-3">

                              <select
                                value={
                                  order.status ||
                                  "Pending"
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleStatusChange(
                                    order._id,
                                    e.target
                                      .value
                                  )
                                }
                                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs font-semibold outline-none"
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

                            </td>

                            {/* ACTION */}
                            <td className="px-3 py-3">

                              <button
                                onClick={() =>
                                  setOpenOrderId(
                                    openOrderId ===
                                      order._id
                                      ? null
                                      : order._id
                                  )
                                }
                                className="border border-gray-300 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-100"
                              >
                                {openOrderId ===
                                order._id
                                  ? "Hide"
                                  : "View"}
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* EXPANDED ORDER DETAILS */}
                {visibleOrders.map(
                  (order) =>
                    openOrderId ===
                      order._id && (

                      <div
                        key={`${order._id}-details`}
                        className="border-t bg-gray-50 p-4"
                      >

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          {/* CUSTOMER */}
                          <div className="bg-white rounded-lg p-3">

                            <h3 className="font-bold text-sm mb-2">
                              Customer
                            </h3>

                            <p className="text-xs">
                              <strong>
                                Name:
                              </strong>{" "}
                              {
                                order
                                  .customer
                                  ?.name
                              }
                            </p>

                            <p className="text-xs mt-1">
                              <strong>
                                Mobile:
                              </strong>{" "}
                              {
                                order
                                  .customer
                                  ?.mobile
                              }
                            </p>

                            <h3 className="font-bold text-sm mt-4 mb-2">
                              Delivery Address
                            </h3>

                            <p className="text-xs">
                              {
                                order
                                  .customer
                                  ?.address
                              }
                            </p>

                            <p className="text-xs">
                              {
                                order
                                  .customer
                                  ?.city
                              }
                              ,{" "}
                              {
                                order
                                  .customer
                                  ?.state
                              }{" "}
                              -{" "}
                              {
                                order
                                  .customer
                                  ?.pincode
                              }
                            </p>

                          </div>

                          {/* PRODUCTS */}
                          <div className="bg-white rounded-lg p-3">

                            <h3 className="font-bold text-sm mb-2">
                              Ordered Products
                            </h3>

                            <div className="space-y-2">

                              {order.items?.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    key={`${order._id}-${index}`}
                                    className="flex gap-2 items-center"
                                  >

                                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">

                                      {item.image ? (
                                        <img
                                          src={
                                            item.image
                                          }
                                          alt={
                                            item.name
                                          }
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                                          No Image
                                        </div>
                                      )}

                                    </div>

                                    <div className="flex-1 min-w-0">

                                      <p className="font-semibold text-xs truncate">
                                        {
                                          item.name
                                        }
                                      </p>

                                      <p className="text-[11px] text-gray-500">
                                        {item.size &&
                                          `Size ${item.size} • `}

                                        {item.design &&
                                          `Design ${item.design} • `}

                                          Qty{" "}
                                        {item.quantity}
                                      </p>

                                    </div>

                                    <p className="font-semibold text-xs">
                                      ₹
                                      {item.price *
                                        item.quantity}
                                    </p>

                                  </div>

                                )
                              )}

                            </div>

                          </div>

                          {/* ORDER INFO */}
                          <div className="bg-white rounded-lg p-3">

                            <h3 className="font-bold text-sm mb-2">
                              Order Information
                            </h3>

                            <p className="text-xs">
                              <strong>
                                Order ID:
                              </strong>{" "}
                              {
                                order._id
                              }
                            </p>

                            <p className="text-xs mt-1">
                              <strong>
                                Date:
                              </strong>{" "}
                              {order.createdAt
                                ? new Date(
                                    order.createdAt
                                  ).toLocaleString()
                                : "N/A"}
                            </p>

                            <p className="text-xs mt-1">
                              <strong>
                                Payment:
                              </strong>{" "}
                              {
                                order
                                  .paymentMethod ||
                                "Razorpay"
                              }
                            </p>

                            <p className="text-xs mt-1">
                              <strong>
                                Payment Status:
                              </strong>{" "}
                              {
                                order
                                  .paymentStatus ||
                                "Pending"
                              }
                            </p>

                            <p className="text-lg font-bold mt-3">
                              Total: ₹
                              {
                                order.totalAmount
                              }
                            </p>

                            {order.returnRequest &&
                              order.returnRequest !==
                                "None" && (

                                <div className="bg-gray-100 rounded-md p-2 mt-3">

                                  <p className="font-bold text-xs">
                                    {
                                      order.returnRequest
                                    }{" "}
                                    Request
                                  </p>

                                  <p className="text-[11px] text-gray-600 mt-1">
                                    Status:{" "}
                                    {
                                      order.returnStatus
                                    }
                                  </p>

                                  <p className="text-[11px] text-gray-600 mt-1">
                                    Reason:{" "}
                                    {
                                      order.returnReason ||
                                      "Not provided"
                                    }
                                  </p>

                                </div>
                              )}

                          </div>

                        </div>

                      </div>
                    )
                )}

              </div>

              {/* PAGINATION */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">

                <p className="text-xs text-gray-500">
                  Showing{" "}
                  {filteredOrders.length ===
                  0
                    ? 0
                    : startIndex + 1}
                  –
                  {Math.min(
                    startIndex +
                      ordersPerPage,
                    filteredOrders.length
                  )}{" "}
                  of{" "}
                  {
                    filteredOrders.length
                  }{" "}
                  orders
                </p>

                <div className="flex items-center gap-1">

                  <button
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page - 1
                      )
                    }
                    className="border px-3 py-1.5 rounded-md text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1.5 text-xs font-semibold">
                    {
                      currentPage
                    }{" "}
                    /{" "}
                    {
                      totalPages
                    }
                  </span>

                  <button
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          page + 1
                      )
                    }
                    className="border px-3 py-1.5 rounded-md text-xs disabled:opacity-40"
                  >
                    Next
                  </button>

                </div>

              </div>

            </>
          )}

        </section>

      </main>

    </div>
  );
}

export default Admin;