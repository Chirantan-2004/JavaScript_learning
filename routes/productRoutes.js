const express = require("express");

const Product = require("../models/Product");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// 6A. Create product - protected
router.post("/", authenticate, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product
    });
  } catch (error) {
    next(error);
  }
});

// 6B. Get all products - protected
router.get("/", authenticate, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
});

// 6C. Get single product - protected
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// 6D. Update product - protected
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Product updated successfully.",
      product
    });
  } catch (error) {
    next(error);
  }
});

// 6E. Delete product - protected
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Product deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
