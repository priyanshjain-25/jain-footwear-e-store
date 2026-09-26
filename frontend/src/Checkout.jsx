import { useState } from "react";

function Checkout({ cart, onBack, onOrderPlaced }) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (
      !form.name ||
      !form.mobile ||
      !form.address ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      alert("Please fill all delivery details.");
      return;
    }

    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      alert("Please login first.");
      return;
    }

    const user = JSON.parse(savedUser);

    if (!user.id) {
      alert("User information is missing. Please login again.");
      return;
    }

    try {
      setLoading(true);

      // CREATE RAZORPAY ORDER
      const orderResponse = await fetch(
        "${import.meta.env.vite_api_url}/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalAmount,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Failed to create payment order"
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout failed to load. Please refresh the page."
        );
      }

      // RAZORPAY CHECKOUT OPTIONS
      const options = {
        key: orderData.keyId,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "Jain Footwear",

        description: "Footwear Purchase",

        order_id: orderData.orderId,

        prefill: {
          name: form.name,
          contact: form.mobile,
        },

        notes: {
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },

        theme: {
          color: "#000000",
        },

        // PAYMENT SUCCESS
        handler: async function (response) {
          try {
            // VERIFY PAYMENT + CREATE ORDER
            const verifyResponse = await fetch(
              "${import.meta.env.vite_api_url}/api/payment/verify-and-create-order",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  userId: user.id,

                  customer: form,

                  items: cart.map((item) => ({
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.selectedSize || "",
                    image: item.image || "",
                  })),

                  totalAmount,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed"
              );
            }

            alert(
              "Payment successful! Order placed successfully."
            );

            onOrderPlaced();
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(
              error.message ||
                "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        // PAYMENT WINDOW CLOSED
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      // PAYMENT FAILED
      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response.error
          );

          alert(
            response.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.message ||
          "Unable to start payment."
      );

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Jain Footwear
          </h1>

          <button
            onClick={onBack}
            className="text-sm hover:text-gray-300"
          >
            ← Back to Cart
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">
          Checkout
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* DELIVERY DETAILS */}
          <form
            onSubmit={handlePayment}
            className="md:col-span-2 bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold mb-6">
              Delivery Details
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <input
                name="mobile"
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <textarea
                name="address"
                placeholder="Full Address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                className="md:col-span-2 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <input
                name="state"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <input
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "Processing Payment..."
                : `Pay ₹${totalAmount}`}
            </button>
          </form>

          {/* ORDER SUMMARY */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <h3 className="text-xl font-bold mb-6">
              Order Summary
            </h3>

            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={`${item._id}-${index}`}
                  className="flex justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">
                      {item.name}
                    </p>

                    {item.selectedSize && (
                      <p className="text-sm text-gray-500">
                        Size: {item.selectedSize}
                      </p>
                    )}

                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t mt-6 pt-5 flex justify-between">
              <span className="font-bold">
                Total
              </span>

              <span className="text-xl font-bold">
                ₹{totalAmount}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;