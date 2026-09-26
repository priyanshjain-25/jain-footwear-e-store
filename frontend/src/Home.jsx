import { useEffect, useState } from "react";
import ProductDetails from "./ProductDetails";
import Cart from "./Cart";
import Checkout from "./Checkout";

function Home({ onLoginClick }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [showAccount, setShowAccount] = useState(false);

  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [requestingOrderId, setRequestingOrderId] = useState(null);

  // LOAD PRODUCTS
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
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

    loadProducts();
  }, []);

  // FILTER PRODUCTS
  const filteredProducts = products.filter((product) => {
    const productName = product.name || "";
    const productCategory = product.category || "";

    const matchesSearch = productName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      productCategory === category;

    return matchesSearch && matchesCategory;
  });

  // ADD TO CART
  const handleAddToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          item._id === product._id &&
          item.selectedSize === product.selectedSize
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item._id === product._id &&
          item.selectedSize === product.selectedSize
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: product.quantity || 1,
        },
      ];
    });

    setSelectedProduct(null);

    alert("Product added to cart!");
  };

  // REMOVE FROM CART
  const handleRemove = (id, size) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item._id === id &&
            item.selectedSize === size
          )
      )
    );
  };

  // INCREASE QUANTITY
  const handleIncrease = (id, size) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id &&
        item.selectedSize === size
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // DECREASE QUANTITY
  const handleDecrease = (id, size) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === id &&
          item.selectedSize === size
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // LOAD MY ORDERS
  const handleShowOrders = async () => {
    setShowAccount(false);
    setShowOrders(true);
    setOrdersLoading(true);

    try {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!savedUser || !token) {
        alert("Please login first.");
        setShowOrders(false);
        return;
      }

      const currentUser = JSON.parse(savedUser);

      if (!currentUser.id) {
        alert(
          "User information is missing. Please login again."
        );
        setShowOrders(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/orders/my-orders/${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
      console.error("My Orders error:", error);

      if (
        error.message === "Authentication required" ||
        error.message === "Invalid or expired token" ||
        error.message ===
          "You can only access your own orders"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        alert("Your session has expired. Please login again.");
        setShowOrders(false);
        return;
      }

      alert("Unable to load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  // REFRESH MY ORDERS
  const refreshOrders = async () => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      if (!currentUser.id) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/orders/my-orders/${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to refresh orders"
        );
      }

      setOrders(data);
    } catch (error) {
      console.error("Refresh orders error:", error);
    }
  };

// AUTOMATIC ORDER STATUS REFRESH
/* eslint-disable react-hooks/set-state-in-effect */
useEffect(() => {
  if (!showOrders) {
    return;
  }

  refreshOrders();

  const interval = setInterval(() => {
    refreshOrders();
  }, 5000);

  return () => clearInterval(interval);
}, [showOrders]);
/* eslint-enable react-hooks/set-state-in-effect */

  // CANCEL ORDER
  const handleCancelOrder = async (orderId) => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      alert("Please login first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingOrderId(orderId);

      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to cancel order"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: "Cancelled",
                paymentStatus:
                  order.paymentStatus === "Paid"
                    ? "Refunded"
                    : order.paymentStatus,
              }
            : order
        )
      );

      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancel order error:", error);

      if (
        error.message === "Authentication required" ||
        error.message === "Invalid or expired token"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);

        alert("Your session has expired. Please login again.");
        return;
      }

      alert(
        error.message ||
          "Unable to cancel order."
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  // RETURN / REPLACE REQUEST
  const handleReturnReplace = async (
    orderId,
    requestType
  ) => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      alert("Please login first.");
      return;
    }

    const reason = window.prompt(
      `Please enter the reason for ${requestType.toLowerCase()}:`
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    const confirmed = window.confirm(
      `Submit ${requestType.toLowerCase()} request for this order?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRequestingOrderId(orderId);

      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/return-request`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requestType,
            reason: reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit request"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                returnRequest: requestType,
                returnReason: reason.trim(),
                returnStatus: "Requested",
              }
            : order
        )
      );

      alert(
        `${requestType} request submitted successfully.`
      );
    } catch (error) {
      console.error(
        "Return/Replace request error:",
        error
      );

      if (
        error.message === "Authentication required" ||
        error.message === "Invalid or expired token"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);

        alert("Your session has expired. Please login again.");
        return;
      }

      alert(
        error.message ||
          "Unable to submit request."
      );
    } finally {
      setRequestingOrderId(null);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setShowAccount(false);

    alert("Logged out successfully!");
  };

  // MY ORDERS PAGE
  if (showOrders) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-black text-white">
          <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Jain Footwear
            </h1>

            <button
              onClick={() => setShowOrders(false)}
              className="text-sm hover:text-gray-300"
            >
              ← Back to Home
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-8">
            <p className="text-sm text-gray-500">
              YOUR ACCOUNT
            </p>

            <h2 className="text-3xl font-bold mt-1">
              My Orders
            </h2>
          </div>

          {ordersLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <p className="text-gray-500">
                Loading your orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">
                🛍️
              </div>

              <h3 className="text-xl font-bold">
                No orders yet
              </h3>

              <p className="text-gray-500 mt-2">
                Your orders will appear here after you
                place an order.
              </p>

              <button
                onClick={() => setShowOrders(false)}
                className="mt-6 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* ORDER HEADER */}
                  <div className="p-6 border-b">
                    <div className="flex flex-col md:flex-row md:justify-between gap-5">
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
                          Order Date
                        </p>

                        <p className="font-semibold mt-1">
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Status
                        </p>

                        <span
                          className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status ===
                                "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ORDER ITEMS */}
                  <div className="p-6">
                    <div className="space-y-5">
                      {order.items &&
                        order.items.map(
                          (item, index) => (
                            <div
                              key={`${order._id}-${index}`}
                              className="flex gap-4"
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )}

                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {item.name}
                                </h4>

                                {item.size && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Size: {item.size}
                                  </p>
                                )}

                                <p className="text-sm text-gray-500">
                                  Quantity:{" "}
                                  {item.quantity}
                                </p>

                                <p className="font-semibold mt-1">
                                  ₹
                                  {item.price *
                                    item.quantity}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                    </div>

                    {/* PAYMENT */}
                    <div className="border-t mt-6 pt-5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          Total Amount
                        </span>

                        <span className="text-xl font-bold">
                          ₹{order.totalAmount}
                        </span>
                      </div>

                      {order.paymentMethod && (
                        <p className="text-sm text-gray-500 mt-2">
                          Payment:{" "}
                          {order.paymentMethod}
                        </p>
                      )}

                      {order.paymentStatus && (
                        <p className="text-sm text-gray-500 mt-1">
                          Payment Status:{" "}
                          {order.paymentStatus}
                        </p>
                      )}
                    </div>

                    {/* CANCEL BUTTON */}
                    {(order.status === "Pending" ||
                      order.status === "Confirmed") && (
                      <div className="border-t mt-5 pt-5">
                        <button
                          onClick={() =>
                            handleCancelOrder(
                              order._id
                            )
                          }
                          disabled={
                            cancellingOrderId ===
                            order._id
                          }
                          className="border border-red-500 text-red-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingOrderId ===
                          order._id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      </div>
                    )}

                    {/* RETURN / REPLACE */}
                    {order.status === "Delivered" && (
                      <div className="border-t mt-5 pt-5">
                        {order.returnRequest === "None" ||
                        order.returnStatus ===
                          "Rejected" ? (
                          <>
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                              Need help with this order?
                            </p>

                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() =>
                                  handleReturnReplace(
                                    order._id,
                                    "Return"
                                  )
                                }
                                disabled={
                                  requestingOrderId ===
                                  order._id
                                }
                                className="border border-black text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
                              >
                                {requestingOrderId ===
                                order._id
                                  ? "Submitting..."
                                  : "Return Order"}
                              </button>

                              <button
                                onClick={() =>
                                  handleReturnReplace(
                                    order._id,
                                    "Replace"
                                  )
                                }
                                disabled={
                                  requestingOrderId ===
                                  order._id
                                }
                                className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
                              >
                                {requestingOrderId ===
                                order._id
                                  ? "Submitting..."
                                  : "Replace Order"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-semibold text-gray-900">
                              {order.returnRequest} Request
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              Reason:{" "}
                              {order.returnReason ||
                                "Not provided"}
                            </p>

                            <p className="text-sm mt-2">
                              Status:{" "}
                              <span className="font-semibold">
                                {order.returnStatus}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // CHECKOUT PAGE
  if (showCheckout) {
    return (
      <Checkout
        cart={cart}
        onBack={() => setShowCheckout(false)}
        onOrderPlaced={() => {
          setCart([]);
          setShowCheckout(false);
        }}
      />
    );
  }

  // CART PAGE
  if (showCart) {
    return (
      <Cart
        cart={cart}
        onBack={() => setShowCart(false)}
        onRemove={handleRemove}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onCheckout={() => {
          setShowCart(false);
          setShowCheckout(true);
        }}
      />
    );
  }

  // PRODUCT DETAILS PAGE
  if (selectedProduct) {
    return (
      <ProductDetails
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    );
  }

  // HOME PAGE
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Jain Footwear
          </h1>

          <nav className="flex gap-6 text-sm items-center">
            <button
              onClick={() => {
                setCategory("All");
                setShowAccount(false);
              }}
              className="hover:text-gray-300"
            >
              Home
            </button>

            <button
              onClick={handleShowOrders}
              className="hover:text-gray-300"
            >
              My Orders
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() =>
                    setShowAccount(!showAccount)
                  }
                  className="flex items-center gap-2 hover:opacity-80"
                  title={user.name}
                >
                  <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "U"}
                  </div>

                  <span className="hidden sm:block text-sm">
                    {user.name?.split(" ")[0]}
                  </span>
                </button>

                {showAccount && (
                  <div className="absolute right-0 top-12 w-64 bg-white text-black rounded-xl shadow-xl p-5 z-50">
                    <p className="text-xs text-gray-500">
                      Welcome
                    </p>

                    <p className="font-bold text-lg mt-1">
                      {user.name}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 break-all">
                      {user.email}
                    </p>

                    {user.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        {user.phone}
                      </p>
                    )}

                    <div className="border-t border-gray-200 my-4"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full bg-black text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="hover:text-gray-300"
              >
                Login
              </button>
            )}

            <button
              onClick={() => setShowCart(true)}
              className="relative"
            >
              Cart

              {cart.length > 0 && (
                <span className="absolute -top-3 -right-4 bg-white text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* SEARCH */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search footwear..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="border border-gray-300 rounded-lg px-4 py-3 outline-none"
          >
            <option value="All">
              All Categories
            </option>
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
          </select>
        </div>
      </section>

      {/* HERO */}
      <section className="bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl md:text-6xl font-bold">
            Step Into Style
          </h2>

          <p className="text-gray-600 text-lg mt-4">
            Quality footwear for everyone
          </p>

          <button
            onClick={() =>
              document
                .getElementById("products")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className="mt-8 bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">
          Shop By Category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Men", "Women", "Kids", "Sports"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md"
              >
                {item}
              </button>
            )
          )}
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-6 py-12"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Our Products
          </h2>

          <span className="text-sm text-gray-500">
            {filteredProducts.length} Products
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No products found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-64 bg-gray-100">
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

                  {product.sizes &&
                    product.sizes.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Sizes:{" "}
                        {product.sizes.join(", ")}
                      </p>
                    )}

                  <button
                    onClick={() =>
                      setSelectedProduct(product)
                    }
                    className="w-full mt-4 bg-black text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800"
                  >
                    View Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p>
            © 2026 Jain Footwear e-Store
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;