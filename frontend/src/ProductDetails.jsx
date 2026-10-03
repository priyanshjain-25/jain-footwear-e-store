import { useState } from "react";

function ProductDetails({ product, onBack, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDesignIndex, setSelectedDesignIndex] = useState(-1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  // Original product is always the first option
  const selectedDesign =
    selectedDesignIndex >= 0
      ? product.designs?.[selectedDesignIndex]
      : null;

  const currentImages =
    selectedDesign?.images?.length > 0
      ? selectedDesign.images
      : [product.image].filter(Boolean);

  const currentImage = currentImages[selectedImageIndex] || product.image;

  const currentPrice =
  selectedDesignIndex >= 0
    ? Number(
        selectedDesign?.price ??
          product.price
      )
    : Number(product.price);

  const currentStock =
    selectedDesignIndex >= 0
      ? Number(selectedDesign?.stock || 0)
      : Number(product.stock || 0);

  const handleDesignChange = (index) => {
    setSelectedDesignIndex(index);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size.");
      return;
    }

    onAddToCart({
      ...product,
      price: currentPrice,
      selectedDesign:
        selectedDesignIndex >= 0
          ? selectedDesign?.name || ""
          : "Original",
      selectedDesignId:
        selectedDesignIndex >= 0
          ? selectedDesign?._id || ""
          : "",
      selectedSize,
      selectedImage: currentImage || product.image || "",
      quantity: 1,
    });
  };

  const discount =
  Number(product.mrp) > currentPrice
    ? Math.round(
        ((Number(product.mrp) - currentPrice) /
          Number(product.mrp)) *
          100
      )
    : 0;

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
            {/* Images */}
            <div className="bg-gray-100 p-4">
              <div className="min-h-[450px]">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-[450px] object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-[450px] flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Image thumbnails */}
              {currentImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto">
                  {currentImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? "border-black"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-20 h-20 object-cover"
                      />
                    </button>
                  ))}
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

              {/* Price */}
              {discount > 0 ? (
                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-500 line-through">
                      ₹{product.mrp}
                    </span>

                    <span className="text-sm font-semibold text-green-600">
                      {discount}% OFF
                    </span>
                  </div>

                  <p className="text-3xl font-bold mt-1">
                    ₹{currentPrice}
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-bold mt-6">
                  ₹{currentPrice}
                </p>
              )}

              {/* Available Designs */}
              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-4">
                  Available Designs
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* ORIGINAL - ALWAYS FIRST */}
                  <button
                    onClick={() => handleDesignChange(-1)}
                    className={`text-left rounded-xl border-2 overflow-hidden ${
                      selectedDesignIndex === -1
                        ? "border-black"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt="Original"
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}

                      {selectedDesignIndex === -1 && (
                        <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="font-semibold">
                        Original
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Original Product
                      </p>
                    </div>
                  </button>

                  {/* ADDED DESIGNS */}
                  {product.designs?.map((design, index) => {
                    const firstImage =
                      design.images?.[0] || product.image;

                    const isSelected =
                      selectedDesignIndex === index;

                    return (
                      <button
                        key={design._id || index}
                        onClick={() => handleDesignChange(index)}
                        className={`text-left rounded-xl border-2 overflow-hidden ${
                          isSelected
                            ? "border-black"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="relative">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={design.name}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}

                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="font-semibold">
                            {design.name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {Number(design.stock || 0) > 0
                              ? `${design.stock} available`
                              : "Out of Stock"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-8">
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
                {currentStock > 0 ? (
                  <p className="text-green-600 font-medium">
                    In Stock ({currentStock} available)
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
                disabled={currentStock <= 0}
                className="w-full mt-8 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {currentStock > 0
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