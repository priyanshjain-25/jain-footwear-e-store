const express = require("express");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Upload one image to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "jain-footwear/products",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    stream.end(file.buffer);
  });
};

// Get all products
// Public: Customers can view products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

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
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "designImages",
      maxCount: 50,
    },
  ]),
  async (req, res) => {
    try {
      let imageUrl = "";

      // Main product image
      if (req.files?.image?.[0]) {
        imageUrl = await uploadToCloudinary(
          req.files.image[0]
        );
      }

      // Design data
      let designs = [];

      if (req.body.designs) {
        designs = JSON.parse(req.body.designs);
      }

      // Design images
      const designImages =
        req.files?.designImages || [];

      let imageIndex = 0;

      for (const design of designs) {
        const imageCount = Number(
          design.imageCount || 0
        );

        const imagesForThisDesign =
          designImages.slice(
            imageIndex,
            imageIndex + imageCount
          );

        design.images = [];

        for (const file of imagesForThisDesign) {
          const imageUrl =
            await uploadToCloudinary(file);

          design.images.push(imageUrl);
        }

        delete design.imageCount;
        delete design.existingImages;

        imageIndex += imageCount;
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

        stock: Number(
          req.body.stock || 0
        ),

        image: imageUrl,

        designs,
      });

      const savedProduct =
        await product.save();

      res.status(201).json(savedProduct);
    } catch (error) {
      console.error(
        "ADD PRODUCT ERROR:",
        error
      );

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
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "designImages",
      maxCount: 50,
    },
  ]),
  async (req, res) => {
    try {
      console.log(
        "========== UPDATE PRODUCT =========="
      );

      console.log(
        "PRODUCT ID:",
        req.params.id
      );

      console.log(
        "UPDATE BODY:",
        req.body
      );

      console.log(
        "===================================="
      );

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

        stock: Number(
          req.body.stock || 0
        ),
      };

      // Main product image
      if (req.files?.image?.[0]) {
        updateData.image =
          await uploadToCloudinary(
            req.files.image[0]
          );
      }

      // Update designs
      if (req.body.designs) {
        let designs = JSON.parse(
          req.body.designs
        );

        const designImages =
          req.files?.designImages || [];

        let imageIndex = 0;

        for (const design of designs) {
          const imageCount = Number(
            design.imageCount || 0
          );

          // Keep existing Cloudinary images
          const existingImages =
            Array.isArray(
              design.existingImages
            )
              ? design.existingImages
              : [];

          design.images = [
            ...existingImages,
          ];

          // Get newly uploaded files
          const imagesForThisDesign =
            designImages.slice(
              imageIndex,
              imageIndex + imageCount
            );

          // Upload new images
          for (const file of imagesForThisDesign) {
            const imageUrl =
              await uploadToCloudinary(file);

            design.images.push(imageUrl);
          }

          // Remove temporary frontend fields
          delete design.imageCount;
          delete design.existingImages;

          imageIndex += imageCount;
        }

        updateData.designs = designs;
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
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      res.status(400).json({
        message: "Failed to update product",
        error: error.message,
      });
    }
  }
);

// Delete a product
// Admin only
router.delete(
  "/:id",
  adminAuth,
  async (req, res) => {
    try {
      const deletedProduct =
        await Product.findByIdAndDelete(
          req.params.id
        );

      if (!deletedProduct) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message:
          "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to delete product",
        error: error.message,
      });
    }
  }
);

module.exports = router;