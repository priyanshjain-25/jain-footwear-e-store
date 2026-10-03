import { useState } from "react";

function ProductDetails({ product, onBack, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDesignIndex, setSelectedDesignIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const designs = Array.isArray(product.designs)
    ? product.designs
    : [];

  const selectedDesign =
    designs.length > 0
      ? designs[selectedDesignIndex]
      : null;

  let productImages = [];

  if (
    selectedDesign &&
    Array.isArray(selectedDesign.images) &&
    selectedDesign.images.length > 0
  ) {
    productImages = selectedDesign.images;
  } else if (product.image) {
    productImages = [product.image];
  }

  const selectedImage =
    productImages[selectedImageIndex] ||
    productImages[0] ||
    product.image ||
    "";

  const currentStock =
    selectedDesign &&
    selectedDesign.stock !== undefined
      ? Number(selectedDesign.stock)
      : Number(product.stock || 0);

  const mrp = Number(product.mrp || 0);
  const price = Number(product.price || 0);

  const discount =
    mrp > price && mrp > 0
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const handleDesignChange = (index) => {
    setSelectedDesignIndex(index);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    if (
      product.sizes &&
      product.sizes.length > 0 &&
      !selectedSize
    ) {
      alert("Please select a size.");
      return;
    }

    if (currentStock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    onAddToCart({
      ...product,
      selectedDesign: selectedDesign?.name || "",
      selectedDesignId: selectedDesign?._id || "",
      selectedSize,
      selectedImage: selectedImage || product.image || "",
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">
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

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* IMAGE SECTION */}
            <div className="bg-gray-100 p-4 md:p-6">
              <div className="bg-white rounded-xl overflow-hidden">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-[350px] md:h-[500px] object-contain"
                  />
                ) : (
                  <div className="w-full h-[350px] md:h-[500px] flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* IMAGE THUMBNAILS */}
              {productImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImageIndex(index)
                      }
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? "border-black"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT INFORMATION */}
            <div className="p-6 md:p-10">
              <p className="text-sm text-gray-500">
                {product.category}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mt-2">
                {product.name}
              </h2>

              {product.brand && (
                <p className="text-gray-500 mt-2">
                  Brand: {product.brand}
                </p>
              )}

              {/* PRICE */}
              <div className="mt-6">
                {discount > 0 ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-gray-500 line-through">
                        ₹{mrp}
                      </span>

                      <span className="text-sm font-bold text-green-600">
                        {discount}% OFF
                      </span>
                    </div>

                    <p className="text-3xl font-bold mt-1">
                      ₹{price}
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">
                    ₹{price}
                  </p>
                )}
              </div>

              {/* DESIGNS */}
              {designs.length > 0 && (
                <div className="mt-7">
                  <h3 className="font-semibold mb-3">
                    Select Design
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {designs.map((design, index) => (
                      <button
                        key={
                          design._id ||
                          `${design.name}-${index}`
                        }
                        type="button"
                        onClick={() =>
                          handleDesignChange(index)
                        }
                        className={`px-4 py-2.5 rounded-lg border font-medium ${
                          selectedDesignIndex === index
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-gray-300 hover:border-black"
                        }`}
                      >
                        {design.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZES */}
              {product.sizes &&
                product.sizes.length > 0 && (
                  <div className="mt-7">
                    <h3 className="font-semibold mb-3">
                      Select Size
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSize(size)
                          }
                          className={`min-w-[52px] px-4 py-2.5 rounded-lg border font-medium ${
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

              {/* STOCK */}
              <div className="mt-7">
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

              {/* DESCRIPTION */}
              {product.description && (
                <div className="mt-7">
                  <h3 className="font-semibold text-lg">
                    Description
                  </h3>

                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* ADD TO CART */}
              <button
                type="button"
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

      {/* FOOTER */}
      <footer className="bg-black text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-center">
          <p>© 2026 Jain Footwear e-Store</p>
        </div>
      </footer>
    </div>
  );
}

export default ProductDetails;