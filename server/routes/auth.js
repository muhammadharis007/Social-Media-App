const express = require("express");
const bcrypt = require("bcrypt");
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
    return [];
  }
};

const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(pathToUsersFile, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing to users file:", err);
  }
};
// Registration Route
router.post("/register", async (req, res) => {
  const { username, password, name, email, interests } = req.body;

  try {
    const users = readUsersFromFile();
    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      name,
      email,
      interests,
      friends: [],
    };

    users.push(newUser);
    writeUsersToFile(users);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsersFromFile();
    const user = users.find((user) => user.username === username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Store the username in session
    req.session.userId = user.username;

    res.json({
      message: "Login successful",
      user: { username: user.username },
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Error logging in" });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
