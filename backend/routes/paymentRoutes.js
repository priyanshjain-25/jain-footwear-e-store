const express = require("express");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// ======================================================
// CREATE RAZORPAY ORDER
// ======================================================

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Valid amount is required",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      message: "Razorpay order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
});

// ======================================================
// VERIFY PAYMENT AND CREATE MONGODB ORDER
// ======================================================

router.post("/verify-and-create-order", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      customer,
      items,
      totalAmount,
    } = req.body;

    // --------------------------------------------------
    // CHECK PAYMENT DETAILS
    // --------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment details are required",
      });
    }

    // --------------------------------------------------
    // CHECK CUSTOMER AND CART
    // --------------------------------------------------

    if (
      !customer ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalAmount ||
      Number(totalAmount) <= 0
    ) {
      return res.status(400).json({
        message: "Customer details and cart items are required",
      });
    }

    // --------------------------------------------------
    // CREATE SIGNATURE
    // --------------------------------------------------

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    // --------------------------------------------------
    // VERIFY SIGNATURE
    // --------------------------------------------------

    const isValid =
      expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    // --------------------------------------------------
    // PREVENT DUPLICATE ORDER
    // --------------------------------------------------

    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        message: "Payment already processed",
        success: true,
        order: existingOrder,
      });
    }

    // ==================================================
    // CHECK STOCK BEFORE CREATING ORDER
    // ==================================================

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          message:
            `Product "${item.name}" is no longer available.`,
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          message:
            `Invalid quantity for "${product.name}".`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message:
            `Only ${product.stock} item(s) of "${product.name}" are available.`,
        });
      }
    }

    // ==================================================
    // REDUCE STOCK
    // ==================================================

    for (const item of items) {
      const quantity = Number(item.quantity);

      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: quantity },
          },
          {
            $inc: {
              stock: -quantity,
            },
          },
          {
            new: true,
          }
        );

      if (!updatedProduct) {
        return res.status(400).json({
          message:
            `Stock changed while processing "${item.name}". Please try again.`,
        });
      }
    }

    // ==================================================
    // PAYMENT VERIFIED → CREATE ORDER
    // ==================================================

    const order = new Order({
      userId: userId || null,

      customer,

      items,

      totalAmount: Number(totalAmount),

      paymentMethod: "Razorpay",

      paymentStatus: "Paid",

      razorpayOrderId: razorpay_order_id,

      razorpayPaymentId: razorpay_payment_id,

      razorpaySignature: razorpay_signature,

      returnRequest: "None",

      returnReason: "",

      returnStatus: "None",

      status: "Pending",
    });

    const savedOrder = await order.save();

    // ==================================================
    // SUCCESS
    // ==================================================

    res.status(201).json({
      message:
        "Payment verified, stock updated and order created successfully",

      success: true,

      order: savedOrder,
    });
  } catch (error) {
    console.error(
      "Payment verification/order creation error:",
      error
    );

    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE RAZORPAY REFUND
// ======================================================
// Admin only.
// MongoDB is changed to "Refunded" ONLY after Razorpay
// successfully accepts the refund request.
// ======================================================

router.post("/refund", adminAuth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({
        message:
          "Refund can only be created for a paid order.",
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        message:
          "Razorpay payment ID is missing for this order.",
      });
    }

    const refundAmount = amount
      ? Math.round(Number(amount) * 100)
      : Math.round(Number(order.totalAmount) * 100);

    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid refund amount is required.",
      });
    }

    const orderAmountInPaise =
      Math.round(Number(order.totalAmount) * 100);

    if (refundAmount > orderAmountInPaise) {
      return res.status(400).json({
        message:
          "Refund amount cannot be greater than order amount.",
      });
    }

    console.log("Refund request:", {
      orderId: order._id.toString(),
      razorpayPaymentId:
        order.razorpayPaymentId,
      refundAmount,
    });

    const refund =
      await razorpay.payments.refund(
        order.razorpayPaymentId,
        {
          amount: refundAmount,
          speed: "normal",
          notes: {
            orderId: order._id.toString(),
            reason: "Customer refund",
          },
        }
      );

    console.log(
      "Razorpay refund response:",
      refund
    );

    order.paymentStatus = "Refunded";

    if (order.status !== "Delivered") {
      order.status = "Cancelled";
    }

    const updatedOrder =
      await order.save();

    return res.status(200).json({
      message:
        "Refund initiated successfully",

      success: true,

      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      },

      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Razorpay refund error:",
      {
        message: error.message,

        statusCode:
          error.statusCode,

        code:
          error.error?.code,

        description:
          error.error?.description,

        reason:
          error.error?.reason,

        source:
          error.error?.source,

        step:
          error.error?.step,
      }
    );

    return res.status(500).json({
      message: "Refund failed",

      success: false,

      error:
        error.error?.description ||
        error.message,
    });
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;