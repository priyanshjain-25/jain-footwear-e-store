const express = require("express");
const Order = require("../models/Order");
const razorpay = require("../config/razorpay");
const adminAuth = require("../middleware/adminAuth");
const auth = require("../middleware/auth");

const router = express.Router();

// CREATE ORDER
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      customer,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        message: "Customer details and cart items are required",
      });
    }

    const order = new Order({
      userId: userId || null,
      customer,
      items,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || "Razorpay",
      paymentStatus: paymentStatus || "Pending",
      razorpayOrderId: razorpayOrderId || "",
      razorpayPaymentId: razorpayPaymentId || "",
      razorpaySignature: razorpaySignature || "",
      returnRequest: "None",
      returnReason: "",
      returnStatus: "None",
      status: "Pending",
    });

    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// GET CUSTOMER ORDERS
router.get("/my-orders/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId.toString() !== req.params.userId) {
      return res.status(403).json({
        message: "You can only access your own orders",
      });
    }

    const orders = await Order.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get customer orders error:", error);

    res.status(500).json({
      message: "Failed to get orders",
      error: error.message,
    });
  }
});

// CANCEL CUSTOMER ORDER
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.status === "Shipped" ||
      order.status === "Delivered" ||
      order.status === "Cancelled"
    ) {
      return res.status(400).json({
        message: "This order can no longer be cancelled.",
      });
    }

    // If payment was not completed, simply cancel the order
    if (order.paymentStatus !== "Paid") {
      order.status = "Cancelled";

      const updatedOrder = await order.save();

      return res.json({
        message: "Order cancelled successfully",
        success: true,
        refundRequired: false,
        order: updatedOrder,
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        message:
          "This paid order does not have a Razorpay payment ID. Refund cannot be processed automatically.",
      });
    }

    console.log("Fetching Razorpay payment:", {
      orderId: order._id.toString(),
      paymentId: order.razorpayPaymentId,
    });

    // Fetch payment from Razorpay
    const payment = await razorpay.payments.fetch(
      order.razorpayPaymentId
    );

    console.log("Razorpay payment details:", {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      amount_refunded: payment.amount_refunded,
      currency: payment.currency,
    });

    if (payment.status !== "captured") {
      return res.status(400).json({
        message:
          `Refund cannot be processed because Razorpay payment status is "${payment.status}".`,
        paymentStatus: payment.status,
      });
    }

    const orderAmountInPaise =
      Math.round(Number(order.totalAmount) * 100);

    // Make sure the original payment amount matches the order
    if (payment.amount !== orderAmountInPaise) {
      console.error("Payment amount mismatch:", {
        razorpayAmount: payment.amount,
        orderAmount: orderAmountInPaise,
      });

      return res.status(400).json({
        message:
          "Razorpay payment amount does not match the order amount. Refund was not created.",
      });
    }

    // Check how much has already been refunded
    const alreadyRefunded = Number(
      payment.amount_refunded || 0
    );

    const remainingRefundableAmount =
      payment.amount - alreadyRefunded;

    console.log("Refund calculation:", {
      paymentAmount: payment.amount,
      alreadyRefunded,
      remainingRefundableAmount,
    });

    // Payment is already fully refunded
    if (remainingRefundableAmount <= 0) {
      order.status = "Cancelled";
      order.paymentStatus = "Refunded";

      const updatedOrder = await order.save();

      return res.json({
        message:
          "Order cancelled successfully. The payment was already fully refunded.",
        success: true,
        refundRequired: false,
        alreadyRefunded: true,
        order: updatedOrder,
      });
    }

    // Refund only the remaining amount
    console.log("Creating Razorpay refund:", {
      paymentId: order.razorpayPaymentId,
      amount: remainingRefundableAmount,
    });

    const refund = await razorpay.payments.refund(
      order.razorpayPaymentId,
      {
        amount: remainingRefundableAmount,
        speed: "normal",
        notes: {
          orderId: order._id.toString(),
          reason: "Customer cancelled order",
        },
      }
    );

    console.log("Razorpay refund response:", {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    });

    // The order is fully refunded after this remaining refund
    order.status = "Cancelled";
    order.paymentStatus = "Refunded";

    const updatedOrder = await order.save();

    return res.json({
      message:
        "Order cancelled and refund initiated successfully",
      success: true,
      refundRequired: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      },
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Cancel/refund error:", {
      message: error.message,
      statusCode: error.statusCode,
      code: error.error?.code,
      description: error.error?.description,
      reason: error.error?.reason,
      source: error.error?.source,
      step: error.error?.step,
    });

    return res.status(500).json({
      message:
        "Order cancellation/refund failed. Your order was not marked as refunded.",
      success: false,
      error:
        error.error?.description ||
        error.message ||
        "Unknown refund error",
    });
  }
});

// CUSTOMER RETURN / REPLACE REQUEST
router.put("/:id/return-request", auth, async (req, res) => {
  try {
    const {
      requestType,
      reason,
    } = req.body;

    if (!["Return", "Replace"].includes(requestType)) {
      return res.status(400).json({
        message: "Invalid request type",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Reason is required",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message:
          "Return or replacement can be requested only after delivery.",
      });
    }

    if (
      order.returnStatus === "Requested" ||
      order.returnStatus === "Approved"
    ) {
      return res.status(400).json({
        message:
          "A return or replacement request is already active.",
      });
    }

    order.returnRequest = requestType;
    order.returnReason = reason.trim();
    order.returnStatus = "Requested";

    const updatedOrder = await order.save();

    res.json({
      message:
        `${requestType} request submitted successfully`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Return/Replace request error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to submit return/replacement request",
      error: error.message,
    });
  }
});

// GET ALL ORDERS - ADMIN ONLY
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      message: "Failed to get orders",
      error: error.message,
    });
  }
});

// UPDATE RETURN / REPLACE REQUEST - ADMIN ONLY
router.put(
  "/:id/return-request-status",
  adminAuth,
  async (req, res) => {
    try {
      const { returnStatus } = req.body;

      const allowedStatuses = [
        "Requested",
        "Approved",
        "Rejected",
        "Completed",
      ];

      if (!allowedStatuses.includes(returnStatus)) {
        return res.status(400).json({
          message: "Invalid return request status",
        });
      }

      const updatedOrder =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            returnStatus: returnStatus,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.json({
        message:
          "Return/Replace request status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error(
        "Return/Replace status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update return/replacement request",
        error: error.message,
      });
    }
  }
);

// UPDATE ORDER STATUS - ADMIN ONLY
router.put(
  "/:id/status",
  adminAuth,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      const updatedOrder =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            status: status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.json({
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error(
        "Order status update error:",
        error
      );

      res.status(500).json({
        message: "Failed to update order status",
        error: error.message,
      });
    }
  }
);

module.exports = router;