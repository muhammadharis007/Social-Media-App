const express = require("express");
const User = require("../models/User"); // Import the User model

const router = express.Router();

// Helper function to validate ObjectIds
const validateObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Add Friend
router.post("/add", async (req, res) => {
  const { userId, friendId } = req.body;

  if (!validateObjectId(userId) || !validateObjectId(friendId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "User not found" });
    }

    const userUpdated = !user.friends.includes(friendId);
    const friendUpdated = !friend.friends.includes(userId);

    if (userUpdated) {
      user.friends.push(friendId);
    }
    if (friendUpdated) {
      friend.friends.push(userId);
    }

    if (userUpdated || friendUpdated) {
      await Promise.all([user.save(), friend.save()]);
    }

    res.json({ message: "Friend added successfully" });
  } catch (err) {
    console.error("Error adding friend:", err);
    res.status(500).json({ error: "Server error adding friend" });
  }
});

// Remove Friend
router.post("/remove", async (req, res) => {
  const { userId, friendId } = req.body;

  if (!validateObjectId(userId) || !validateObjectId(friendId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "User not found" });
    }

    const userUpdated = user.friends.includes(friendId);
    const friendUpdated = friend.friends.includes(userId);

    if (userUpdated) {
      user.friends = user.friends.filter((id) => id.toString() !== friendId);
    }
    if (friendUpdated) {
      friend.friends = friend.friends.filter((id) => id.toString() !== userId);
    }

    if (userUpdated || friendUpdated) {
      await Promise.all([user.save(), friend.save()]);
    }

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error("Error removing friend:", err);
    res.status(500).json({ error: "Server error removing friend" });
  }
});

// Fetch User's Feed
router.get("/feed/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!validateObjectId(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId).populate({
      path: "friends",
      populate: {
        path: "posts",
        options: { sort: { createdAt: -1 } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = [
      ...user.posts.map((post) => ({
        ...post.toObject(),
        author: user.username,
      })),
      ...user.friends.flatMap((friend) =>
        friend.posts.map((post) => ({
          ...post.toObject(),
          author: friend.username,
        }))
      ),
    ];

    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(posts);
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Server error fetching feed" });
  }
});

module.exports = router;
