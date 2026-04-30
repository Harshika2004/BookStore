const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { sendEmail } = require("../utils/email");

// CREATE CONTACT MESSAGE
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = new Contact({ name, email, message });
    await contact.save();

    // Send email notification to site owner
    try {
      await sendEmail({
        to: "thebookcafe.store@gmail.com",
        subject: `New Contact Message from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F0F0F; color: #F2EDE4; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <h2 style="color: #C9A96E; border-bottom: 1px solid #222; padding-bottom: 10px;">New Inquiry Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #1A1A1A; padding: 15px; border-radius: 8px; border-left: 4px solid #C9A96E; margin-top: 10px;">
              ${message}
            </div>
            <p style="font-size: 12px; color: #6B6560; margin-top: 30px;">This message was sent from the Contact form on The Book Cafe.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send contact notification email:", emailError.message);
      // We don't return an error to the user since the message IS saved in DB
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
