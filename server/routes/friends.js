const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const usersFilePath = path.join(__dirname, "../users.json");

// Helper function to read users
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
  } catch (error) {
    console.error("Error reading users file:", error);
    return null;
  }
};

// Helper function to write users
const writeUsers = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing users file:", error);
    return false;
  }
};

// Add friend route
router.post("/add", async (req, res) => {
  try {
    const { username, friendUsername } = req.body;

    if (!username || !friendUsername) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const users = readUsers();
    if (!users) {
      return res.status(500).json({ error: "Error reading users data" });
    }

    const user = users.find((u) => u.username === username);
    const friend = users.find((u) => u.username === friendUsername);

    if (!user || !friend) {
      return res.status(404).json({ error: "User or friend not found" });
    }

    if (username === friendUsername) {
      return res.status(400).json({ error: "Cannot add yourself as friend" });
    }

    // Initialize friends arrays if they don't exist
    if (!user.friends) user.friends = [];
    if (!friend.friends) friend.friends = [];

    // Check if already friends
    if (user.friends.includes(friendUsername)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Add each other as friends
    user.friends.push(friendUsername);
    friend.friends.push(username);

    if (!writeUsers(users)) {
      return res
        .status(500)
        .json({ error: "Error saving friend relationship" });
    }

    res.json({ message: "Friend added successfully" });
  } catch (error) {
    console.error("Server error in add friend:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove Friend
router.post("/remove", (req, res) => {
  const { username, friendUsername } = req.body;

  const users = readUsers();
  const user = users.find((user) => user.username === username);
  const friend = users.find((user) => user.username === friendUsername);

  if (!user || !friend) {
    return res.status(404).json({ error: "User or friend not found" });
  }

  // Remove the friends
  user.friends = user.friends.filter((uname) => uname !== friendUsername);
  friend.friends = friend.friends.filter((uname) => uname !== username);

  writeUsers(users);

  res.json({ message: "Friend removed successfully" });
});

// Fetch User's Feed
router.get("/feed/:username", (req, res) => {
  const { username } = req.params;

  const users = readUsers();
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Get user's posts and friends' posts
  const posts = [
    ...user.posts.map((post) => ({
      ...post,
      author: user.username,
    })),
    ...user.friends.flatMap((friendUsername) => {
      const friend = users.find((user) => user.username === friendUsername);
      return friend
        ? friend.posts.map((post) => ({
            ...post,
            author: friend.username,
          }))
        : [];
    }),
  ];

  // Sort posts by date (most recent first)
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(posts);
});

module.exports = router;
