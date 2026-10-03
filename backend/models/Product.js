const mongoose = require("mongoose");

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    // Original MRP
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    // Actual selling price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    sizes: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Existing main image
    image: {
      type: String,
      default: "",
    },

    // Multiple designs / variants
    designs: {
      type: [designSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);