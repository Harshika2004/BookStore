const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// Helper: detect if input looks like a phone number
const isPhone = (input) => /^\d{10,15}$/.test(input);

// ── Email transporter (Gmail SMTP) ──────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Validate phone if provided
    if (phone && !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 10-15 digits" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check phone uniqueness if provided
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    if (phone) {
      userData.phone = phone;
    }

    const user = await User.create(userData);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN (supports email or phone)
router.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body;

    // Support both 'identifier' (new) and 'email' (legacy) field names
    const loginId = identifier || email;

    if (!loginId || !password) {
      return res.status(400).json({ message: "Credentials are required" });
    }

    let user;
    if (isPhone(loginId)) {
      user = await User.findOne({ phone: loginId });
    } else {
      user = await User.findOne({ email: loginId });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists for security
      return res.json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Build reset URL (frontend URL)
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Send email
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Book Cafe" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password — The Book Cafe",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background: #0F0F0F; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
          <div style="padding: 40px 36px; text-align: center;">
            <h1 style="color: #C9A96E; font-size: 24px; margin-bottom: 8px; font-weight: 600;">The Book Cafe</h1>
            <p style="color: #A8A29E; font-size: 14px; margin-bottom: 32px;">Password Reset Request</p>
            
            <p style="color: #F2EDE4; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
              Hi <strong>${user.name}</strong>,<br/>
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: #C9A96E; color: #0F0F0F; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase;">
              Reset Password
            </a>
            
            <p style="color: #6B6560; font-size: 12px; margin-top: 32px; line-height: 1.6;">
              This link expires in 15 minutes.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;