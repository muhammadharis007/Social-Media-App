const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const usersFilePath = path.join(__dirname, "../users.json");

// Fetch posts of a user
router.get("/:username/posts", (req, res) => {
  const username = req.params.username;
  fs.readFile(usersFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read users data" });
    }
    const users = JSON.parse(data);
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.posts || []);
  });
});

// Store a new post for a user
router.post("/:username/posts", express.json(), async (req, res) => {
  try {
    const { username } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Post content is required" });
    }

    const users = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
    const userIndex = users.findIndex((u) => u.username === username);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const newPost = {
      id: Date.now().toString(),
      text,
      time: new Date().toISOString(),
      likes: 0,
    };

    users[userIndex].posts = users[userIndex].posts || [];
    users[userIndex].posts.push(newPost);

    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update like count for a post
router.post(
  "/:username/posts/:postId/like",
  express.json(),
  async (req, res) => {
    try {
      const { username, postId } = req.params;

      const users = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
      const userIndex = users.findIndex((u) => u.username === username);

      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      const postIndex = users[userIndex].posts.findIndex(
        (p) => p.id === postId
      );
      if (postIndex === -1) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Toggle like (increment/decrement)
      const currentLikes = users[userIndex].posts[postIndex].likes || 0;
      users[userIndex].posts[postIndex].likes = currentLikes + 1;

      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
      res.json({ likes: users[userIndex].posts[postIndex].likes });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
