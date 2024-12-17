const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // Import the User model

const router = express.Router();
router.post("/register", async (req, res) => {
  const { username, password, interests } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      interests,
      friends: [],
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username }, // Map _id to id
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    req.session.userId = user._id; // Use MongoDB's _id

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username }, // Map _id to id
    });
  } catch (err) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});
