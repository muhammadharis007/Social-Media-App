const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Path to users.json (assuming it's in the root directory)
const pathToUsersFile = path.join(__dirname, "../users.json");

// Helper function to read users from the JSON file
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(pathToUsersFile);
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

// Helper function to validate ObjectIds
const validateObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Add Friend
router.post("/add", (req, res) => {
  const { userId, friendId } = req.body;

  if (!validateObjectId(userId) || !validateObjectId(friendId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const users = readUsersFromFile();
  const user = users.find((user) => user.id === userId);
  const friend = users.find((user) => user.id === friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: "User or friend not found" });
  }

  // Check if they are already friends
  if (!user.friends.includes(friendId)) {
    user.friends.push(friendId);
  }
  if (!friend.friends.includes(userId)) {
    friend.friends.push(userId);
  }

  writeUsersToFile(users);

  res.json({ message: "Friend added successfully" });
});

// Remove Friend
router.post("/remove", (req, res) => {
  const { userId, friendId } = req.body;

  if (!validateObjectId(userId) || !validateObjectId(friendId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const users = readUsersFromFile();
  const user = users.find((user) => user.id === userId);
  const friend = users.find((user) => user.id === friendId);

  if (!user || !friend) {
    return res.status(404).json({ error: "User or friend not found" });
  }

  // Remove the friends
  user.friends = user.friends.filter((id) => id !== friendId);
  friend.friends = friend.friends.filter((id) => id !== userId);

  writeUsersToFile(users);

  res.json({ message: "Friend removed successfully" });
});

// Fetch User's Feed
router.get("/feed/:userId", (req, res) => {
  const { userId } = req.params;

  if (!validateObjectId(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const users = readUsersFromFile();
  const user = users.find((user) => user.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Get user's posts and friends' posts
  const posts = [
    ...user.posts.map((post) => ({
      ...post,
      author: user.username,
    })),
    ...user.friends.flatMap((friendId) => {
      const friend = users.find((user) => user.id === friendId);
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

// Recommend Friends
router.get("/recommend/:userId", (req, res) => {
  const { userId } = req.params;

  if (!validateObjectId(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const users = readUsersFromFile();
  const user = users.find((user) => user.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const recommendations = users
    .filter(
      (potentialFriend) =>
        potentialFriend.id !== userId &&
        !user.friends.includes(potentialFriend.id)
    )
    .map((potentialFriend) => {
      const commonInterests = potentialFriend.interests.filter((interest) =>
        user.interests.includes(interest)
      ).length;
      const mutualFriends = potentialFriend.friends.filter((friendId) =>
        user.friends.includes(friendId)
      ).length;
      return {
        ...potentialFriend,
        commonInterests,
        mutualFriends,
      };
    })
    .sort(
      (a, b) =>
        b.commonInterests - a.commonInterests ||
        b.mutualFriends - a.mutualFriends
    );

  res.json(recommendations);
});

module.exports = router;
