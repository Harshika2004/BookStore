const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");
const Book = require("../models/Book");
const { protect } = require("../middleware/authMiddleware");

// CREATE ORDER (with checkout details)
router.post("/", protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, paymentDetails } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.pincode) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // For online payment, require verified payment details
    if (paymentMethod === "online") {
      if (!paymentDetails || !paymentDetails.razorpayPaymentId || !paymentDetails.razorpayOrderId || !paymentDetails.razorpaySignature) {
        return res.status(400).json({ message: "Payment verification is required for online payment" });
      }
    }

    // Auto-generate itemId for each item
    const orderItems = items.map(item => ({
      itemId: crypto.randomUUID(),
      bookId: item.bookId,
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1,
      image: item.image || "",
      status: "active",
    }));

    // Decrease stock for each item
    for (const item of orderItems) {
      if (item.bookId) {
        await Book.findByIdAndUpdate(item.bookId, {
          $inc: { stock: -(item.quantity || 1) },
        });
      }
    }

    const orderData = {
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      status: "fulfilled",
    };

    // Add payment details for online payments
    if (paymentMethod === "online" && paymentDetails) {
      orderData.paymentDetails = {
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        razorpaySignature: paymentDetails.razorpaySignature,
        paymentStatus: "completed",
        paidAt: new Date(),
      };
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET USER ORDERS (sorted by latest first)
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RETURN ORDER
router.post("/:id/return", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "fulfilled" && order.status !== "placed") {
      return res.status(400).json({ message: `Cannot return an order that is already ${order.status}` });
    }

    // Increase stock for returned items
    for (const item of order.items) {
      if (item.bookId && item.status === "active") {
        await Book.findByIdAndUpdate(item.bookId, {
          $inc: { stock: item.quantity || 1 },
        });
      }
    }

    order.status = "returned";
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REPLACE ITEM — replaces a single item in an order
router.post("/:id/replace-item", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "fulfilled" && order.status !== "placed") {
      return res.status(400).json({ message: `Cannot replace items in an order that is ${order.status}` });
    }

    const { itemId, newBook } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    if (!newBook || !newBook.title || !newBook.price) {
      return res.status(400).json({ message: "Replacement book details are required" });
    }

    // Find the item to replace
    const itemIndex = order.items.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in this order" });
    }

    const originalItem = order.items[itemIndex];

    if (originalItem.status === "replaced") {
      return res.status(400).json({ message: "This item has already been replaced" });
    }

    // Update inventory: increase stock for returned book
    if (originalItem.bookId) {
      await Book.findByIdAndUpdate(originalItem.bookId, {
        $inc: { stock: originalItem.quantity || 1 },
      });
    }

    // Decrease stock for new book
    if (newBook.bookId) {
      await Book.findByIdAndUpdate(newBook.bookId, {
        $inc: { stock: -1 },
      });
    }

    // Mark original item as replaced
    order.items[itemIndex].status = "replaced";
    order.items[itemIndex].replacedWith = {
      bookId: newBook.bookId || "",
      title: newBook.title,
      price: newBook.price,
      image: newBook.image || "",
      replacedAt: new Date(),
    };

    // Add new item to the order
    const newItemId = crypto.randomUUID();
    order.items.push({
      itemId: newItemId,
      bookId: newBook.bookId || "",
      title: newBook.title,
      price: newBook.price,
      quantity: 1,
      image: newBook.image || "",
      status: "active",
    });

    // Add to replacement history
    order.replacementHistory.push({
      itemId: originalItem.itemId,
      originalBook: {
        bookId: originalItem.bookId,
        title: originalItem.title,
        price: originalItem.price,
      },
      newBook: {
        bookId: newBook.bookId || "",
        title: newBook.title,
        price: newBook.price,
      },
      replacedAt: new Date(),
    });

    // Recalculate total based on active items
    order.totalAmount = order.items
      .filter(item => item.status === "active")
      .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

    // Check if all original items are replaced — if so, mark order as replaced
    const activeItems = order.items.filter(item => item.status === "active");
    const allOriginalReplaced = order.items
      .filter(item => item.status === "replaced")
      .length > 0 && activeItems.every(item => {
        // Check if this active item is a replacement (has a corresponding history entry as newBook)
        return order.replacementHistory.some(h => h.newBook.title === item.title);
      });

    // Don't auto-mark as replaced — keep as fulfilled as long as there are active items

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RETURN ITEM — returns a single item in an order
router.post("/:id/return-item", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "fulfilled" && order.status !== "placed") {
      return res.status(400).json({ message: `Cannot return items in an order that is ${order.status}` });
    }

    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Find the item to return
    const itemIndex = order.items.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in this order" });
    }

    const item = order.items[itemIndex];

    if (item.status !== "active") {
      return res.status(400).json({ message: `Cannot return an item with status: ${item.status}` });
    }

    // Update inventory: increase stock for returned book
    if (item.bookId) {
      await Book.findByIdAndUpdate(item.bookId, {
        $inc: { stock: item.quantity || 1 },
      });
    }

    // Mark item as returned
    order.items[itemIndex].status = "returned";

    // Recalculate total based on active items
    order.totalAmount = order.items
      .filter(i => i.status === "active")
      .reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;