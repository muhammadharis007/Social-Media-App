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

// Helper function to calculate similarity score
const calculateSimilarityScore = (user, otherUser) => {
  // Calculate mutual friends score (30% weight)
  const mutualFriends = otherUser.friends.filter((friend) =>
    user.friends.includes(friend)
  ).length;
  const maxPossibleMutualFriends = Math.min(
    user.friends.length,
    otherUser.friends.length
  );
  const mutualFriendsScore =
    maxPossibleMutualFriends > 0
      ? (mutualFriends / maxPossibleMutualFriends) * 30
      : 0;

  // Calculate interests similarity score (70% weight)
  const commonInterests = otherUser.interests.filter((interest) =>
    user.interests.includes(interest)
  ).length;
  const maxPossibleInterests = Math.min(
    user.interests.length,
    otherUser.interests.length
  );
  const interestsScore =
    maxPossibleInterests > 0
      ? (commonInterests / maxPossibleInterests) * 70
      : 0;

  // Combined score
  const totalScore = mutualFriendsScore + interestsScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    mutualFriends,
    commonInterests,
  };
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

// Get friends of friends for sidebar
router.get("/friends-of-friends/:username", (req, res) => {
  const { username } = req.params;
  const users = readUsersFromFile();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Get friends of friends
  const friendsOfFriends = users
    .filter(
      (otherUser) =>
        // Not the user themselves and not already a friend
        otherUser.username !== username &&
        !user.friends.includes(otherUser.username) &&
        // Has mutual friends
        otherUser.friends.some((friend) => user.friends.includes(friend))
    )
    .map((potentialFriend) => ({
      username: potentialFriend.username,
      mutualFriends: potentialFriend.friends.filter((friend) =>
        user.friends.includes(friend)
      ).length,
    }))
    .sort((a, b) => b.mutualFriends - a.mutualFriends)
    .slice(0, 4); // Top 4 with most mutual friends

  res.json(friendsOfFriends);
});

// Get full recommendations based on combined score
router.get("/recommend/:username", (req, res) => {
  const { username } = req.params;
  const users = readUsersFromFile();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const recommendations = users
    .filter(
      (potentialMatch) =>
        potentialMatch.username !== username &&
        !user.friends.includes(potentialMatch.username)
    )
    .map((potentialMatch) => ({
      username: potentialMatch.username,
      ...calculateSimilarityScore(user, potentialMatch),
    }))
    .sort((a, b) => b.score - a.score);

  res.json(recommendations);
});

module.exports = router;
