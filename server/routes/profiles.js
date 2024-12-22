const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const pathToUsersFile = path.join(__dirname, "../users.json");

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Helper function to read users from the JSON file
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(pathToUsersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users file:", err);
    return [];
  }
};

// Helper function to write users to the JSON file
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(pathToUsersFile, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing to users file:", err);
  }
};

// Endpoint to fetch all users
router.get("/profiles", (req, res) => {
  try {
    const users = readUsersFromFile(); // Read users from the file
    res.json(users); // Send back the users as JSON
  } catch (error) {
    console.error("Error reading users from file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current logged-in user details
router.get("/me", isAuthenticated, (req, res) => {
  const users = readUsersFromFile();
  const user = users.find((user) => user.username === req.session.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    username: user.username,
    profileImage: user.profileImage,
    friends: user.friends,
    interests: user.interests,
    pfp: user.pfp,
  });
});

// Get details of a specific user by username
router.get("/:username", (req, res) => {
  const { username } = req.params;

  const users = readUsersFromFile();
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    username: user.username,
    profileImage: user.profileImage,
    friends: user.friends,
    interests: user.interests,
  });
});

// Endpoint to fetch friend recommendations
router.get("/recommend/:username", (req, res) => {
  const { username } = req.params;
  const users = readUsersFromFile();
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Find users who are not friends yet
  const recommendations = users
    .filter(
      (u) => u.username !== username && !user.friends.includes(u.username)
    )
    .map((u) => ({
      username: u.username,
      mutualFriends: u.friends.filter((f) => user.friends.includes(f)).length,
    }));

  res.json(recommendations);
});

module.exports = router;
