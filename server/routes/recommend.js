const express = require("express");
const User = require("../models/User");
const mongoose = require("mongoose");

const router = express.Router();

// Helper function to validate ObjectId
const validateObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Suggest Friends Route
router.get("/suggest/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!validateObjectId(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    // Fetch the user with their friends populated
    const user = await User.findById(userId).populate("friends", "_id friends");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFriends = new Set(
      user.friends.map((friend) => friend._id.toString())
    );

    // Collect friends of friends
    const suggestedFriends = new Set();
    user.friends.forEach((friend) => {
      friend.friends.forEach((friendOfFriend) => {
        const friendOfFriendId = friendOfFriend.toString();
        if (
          friendOfFriendId !== userId && // Exclude the user themselves
          !userFriends.has(friendOfFriendId) // Exclude existing friends
        ) {
          suggestedFriends.add(friendOfFriendId);
        }
      });
    });

    // Fetch suggested friend details
    const suggestions = await User.find({
      _id: { $in: Array.from(suggestedFriends) },
    }).select("username profileImage interests");

    res.json(suggestions);
  } catch (err) {
    console.error("Error fetching friend suggestions:", err);
    res.status(500).json({ error: "Server error fetching recommendations" });
  }
});

module.exports = router;
