const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      minlength: 2,
      maxlength: 100,
      trim: true
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      minlength: 2,
      maxlength: 100,
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"]
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 500,
      default: ""
    },
    discount: {
      type: Number,
      min: 0,
      default: 0
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
