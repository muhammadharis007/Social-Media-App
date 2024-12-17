const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");
const pathToUsersFile = path.join(__dirname, "users.json");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup (without MongoStore)
app.use(
  session({
    secret: "social-app-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Adjust for non-HTTPS (if using HTTPS, set to true)
  })
);

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

// Routes
const authRoutes = express.Router();

// Registration Route
authRoutes.post("/register", async (req, res) => {
  const { username, password, interests } = req.body;

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
      interests,
      friends: [],
    };

    users.push(newUser);
    writeUsersToFile(users);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login
authRoutes.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = readUsersFromFile();
    const user = users.find((user) => user.username === username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    req.session.userId = user.username; // Store the username for session
    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Error logging in" });
  }
});

// Logout
authRoutes.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.use("/api/auth", authRoutes);

const profileRoutes = express.Router();

// Fetch current user info
profileRoutes.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const users = readUsersFromFile();
  const user = users.find((user) => user.username === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ username: user.username });
});

// Fetch another user by username
profileRoutes.get("/:username", (req, res) => {
  const users = readUsersFromFile();
  const user = users.find((user) => user.username === req.params.username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.use("/api/profiles", profileRoutes);

// Serve feed.html with basic authentication check
app.get("/feed.html", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "../public/feed.html"));
});

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Fallback for undefined routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
