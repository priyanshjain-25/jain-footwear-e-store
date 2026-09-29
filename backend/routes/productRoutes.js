const express = require("express");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Get all products
// Public: Customers can view products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get products",
      error: error.message,
    });
  }
});

// Add a product
// Admin only
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      let imageUrl = "";

      if (req.file) {
        const uploadResult = await new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder: "jain-footwear/products",
                },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            stream.end(req.file.buffer);
          }
        );

        imageUrl = uploadResult.secure_url;
      }

      const product = new Product({
        name: req.body.name,
        category: req.body.category,
        brand: req.body.brand,
        mrp: Number(req.body.mrp),
        price: Number(req.body.price),
        sizes: req.body.sizes
          ? JSON.parse(req.body.sizes)
          : [],
        description: req.body.description,
        stock: Number(req.body.stock || 0),
        image: imageUrl,
      });

      const savedProduct = await product.save();

      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(400).json({
        message: "Failed to add product",
        error: error.message,
      });
    }
  }
);

// Update a product
// Admin only
router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
  try {
    console.log("========== UPDATE PRODUCT ==========");
    console.log("PRODUCT ID:", req.params.id);
    console.log("UPDATE BODY:", req.body);
    console.log("====================================");

    const updateData = {
        name: req.body.name,
        category: req.body.category,
        brand: req.body.brand,
        mrp: Number(req.body.mrp),
        price: Number(req.body.price),
        sizes: req.body.sizes
          ? JSON.parse(req.body.sizes)
          : [],
        description: req.body.description,
        stock: Number(req.body.stock || 0),
      };

      if (req.file) {
        const uploadResult = await new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder: "jain-footwear/products",
                },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            stream.end(req.file.buffer);
          }
        );

        updateData.image = uploadResult.secure_url;
      }

      const updatedProduct =
        await Product.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedProduct) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({
        message: "Failed to update product",
        error: error.message,
      });
    }
  }
);

// Delete a product
// Admin only
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const deletedProduct =
      await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

module.exports = router;