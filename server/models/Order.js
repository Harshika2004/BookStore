const mongoose = require("mongoose");
const crypto = require("crypto");

const orderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    bookId: String,
    title: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    image: String,
    status: {
      type: String,
      enum: ["active", "replacement_requested", "replaced", "return_requested", "returned"],
      default: "active",
    },
    replacedWith: {
      bookId: String,
      title: String,
      price: Number,
      image: String,
      replacedAt: Date,
    },
  },
  { _id: false }
);

const replacementHistorySchema = new mongoose.Schema(
  {
    itemId: String,
    originalBook: {
      bookId: String,
      title: String,
      price: Number,
    },
    newBook: {
      bookId: String,
      title: String,
      price: Number,
    },
    replacedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    items: [orderItemSchema],
    replacementHistory: [replacementHistorySchema],
    totalAmount: Number,
    status: {
      type: String,
      enum: ["pending", "fulfilled", "placed", "returned", "replaced", "cancelled"],
      default: "fulfilled",
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      pincode: { type: String },
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      paidAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);