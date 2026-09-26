import { useState } from "react";

function ProductDetails({ product, onBack, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState("");

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size.");
      return;
    }

    onAddToCart({
      ...product,
      selectedSize,
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Jain Footwear
          </h1>

          <button
            onClick={onBack}
            className="text-sm hover:text-gray-300"
          >
            ← Back to Shop
          </button>
        </div>
      </header>

      {/* Product Details */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="bg-gray-100 min-h-[450px]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full min-h-[450px] object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[450px] flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Information */}
            <div className="p-8 md:p-10">
              <p className="text-sm text-gray-500">
                {product.category}
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {product.name}
              </h2>

              {product.brand && (
                <p className="text-gray-500 mt-2">
                  Brand: {product.brand}
                </p>
              )}

              <p className="text-3xl font-bold mt-6">
                ₹{product.price}
              </p>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg">
                    Description
                  </h3>

                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">
                    Select Size
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 rounded-lg border font-medium ${
                          selectedSize === size
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-gray-300 hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div className="mt-6">
                {product.stock > 0 ? (
                  <p className="text-green-600 font-medium">
                    In Stock ({product.stock} available)
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">
                    Out of Stock
                  </p>
                )}
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full mt-8 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {product.stock > 0
                  ? "Add to Cart"
                  : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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

export default ProductDetails;