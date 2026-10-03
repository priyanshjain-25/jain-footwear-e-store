function Cart({
  cart,
  onBack,
  onRemove,
  onIncrease,
  onDecrease,
  onCheckout,
}) {
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Jain Footwear
          </h1>

          <button
            onClick={onBack}
            className="text-sm hover:underline"
          >
            Continue Shopping
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">
          Your Cart
        </h2>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500 mb-6">
              Your cart is empty.
            </p>

            <button
              onClick={onBack}
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item._id}-${item.selectedDesignId || item.selectedDesign}-${item.selectedSize}`}
                  className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row gap-5"
                >
                  <img
                    src={
                      item.selectedImage ||
                      item.image
                    }
                    alt={item.name}
                    className="w-full sm:w-32 h-32 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {item.name}
                    </h3>

                    {item.brand && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.brand}
                      </p>
                    )}

                    {item.selectedDesign && (
                      <p className="text-sm text-gray-500 mt-2">
                        Design: {item.selectedDesign}
                      </p>
                    )}

                    {item.selectedSize && (
                      <p className="text-sm text-gray-500 mt-1">
                        Size: {item.selectedSize}
                      </p>
                    )}

                    <p className="text-lg font-bold mt-3">
                      ₹{item.price}
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() =>
                          onDecrease(
                            item._id,
                            item.selectedSize,
                            item.selectedDesignId
                          )
                        }
                        className="w-9 h-9 border rounded-lg font-bold"
                      >
                        −
                      </button>

                      <span className="font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          onIncrease(
                            item._id,
                            item.selectedSize,
                            item.selectedDesignId
                          )
                        }
                        className="w-9 h-9 border rounded-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-between items-end">
                    <p className="font-bold text-lg">
                      ₹{item.price * item.quantity}
                    </p>

                    <button
                      onClick={() =>
                        onRemove(
                          item._id,
                          item.selectedSize,
                          item.selectedDesignId
                        )
                      }
                      className="text-red-600 text-sm font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
              <h3 className="text-xl font-bold mb-6">
                Order Summary
              </h3>

              <div className="flex justify-between text-gray-600">
                <span>Items</span>
                <span>{cart.length}</span>
              </div>

              <div className="flex justify-between text-gray-600 mt-3">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>

              <div className="border-t mt-5 pt-5 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;