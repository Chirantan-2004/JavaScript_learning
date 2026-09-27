const express = require("express");

const Booking = require("../models/Booking");
const Product = require("../models/Product");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// 7. Place booking - protected
// IMPORTANT: user_id comes from the JWT, not from req.body.
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined) {
      const error = new Error("product_id and quantity are required.");
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      const error = new Error("Quantity must be a whole number greater than or equal to 1.");
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(product_id);

    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    const bookingQuantity = Number(quantity);

    if (product.quantity < bookingQuantity) {
      const error = new Error(`Only ${product.quantity} item(s) are available.`);
      error.statusCode = 400;
      throw error;
    }

    const finalPrice = product.price * (1 - product.discount / 100);
    const totalAmount = Number((finalPrice * bookingQuantity).toFixed(2));

    // Reduce product stock.
    product.quantity -= bookingQuantity;
    await product.save();

    const booking = await Booking.create({
      user_id: req.userId,
      product_id: product._id,
      quantity: bookingQuantity,
      total_amount: totalAmount
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user_id", "name email")
      .populate("product_id", "name category price discount sku");

    res.status(201).json({
      success: true,
      message: "Booking placed successfully.",
      booking: populatedBooking
    });
  } catch (error) {
    next(error);
  }
});

// 8. Current user's bookings - protected
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user_id: req.userId })
      .populate("product_id", "name category price discount sku")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
