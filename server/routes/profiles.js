const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User"); // Import the User model

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Get current logged-in user details
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId) // Use findById for _id lookup
      .select("username interests friends profileImage");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      profileImage: user.profileImage,
      friends: user.friends,
      interests: user.interests,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get details of a specific user by userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId) // Use findById for _id lookup
      .select("username interests friends profileImage");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      profileImage: user.profileImage,
      friends: user.friends,
      interests: user.interests,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
