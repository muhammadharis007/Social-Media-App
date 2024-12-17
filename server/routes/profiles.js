const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const pathToUsersFile = path.join(__dirname, "../users.json");
folder;

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
    const data = fs.readFileSync(pathToUsersFile);
    return JSON.parse(data);
  } catch (err) {
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

// Get current logged-in user details
router.get("/me", isAuthenticated, (req, res) => {
  const users = readUsersFromFile();
  const user = users.find((user) => user.username === req.session.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    username: user.username,
    name: user.name,
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

router.get("/", (req, res) => {
  const users = readUsersFromFile();

  if (!users || users.length === 0) {
    return res.status(404).json({ error: "No users found" });
  }

  res.json(users);
});

module.exports = router;
