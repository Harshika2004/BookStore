const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { protect } = require("../middleware/authMiddleware");

// CREATE REVIEW
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;

    if (!bookId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if user already reviewed this book
    const existing = await Review.findOne({ bookId, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this book" });
    }

    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    const review = new Review({
      bookId,
      userId: req.user.id,
      userName: user ? user.name : "Anonymous",
      rating,
      comment,
    });

    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this book" });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET REVIEWS FOR A BOOK
router.get("/:bookId", async (req, res) => {
  try {
    const reviews = await Review.find({ bookId: req.params.bookId }).sort({
      createdAt: -1,
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
