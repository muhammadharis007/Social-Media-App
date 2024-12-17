const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const app = express();

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/mydatabase")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Session setup WITH MongoStore
app.use(
  session({
    secret: "social-app-secret",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/social-app",
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: "native",
    }),
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = express.Router();

// Registration Route
authRoutes.post("/register", async (req, res) => {
  const { username, password, interests } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      interests,
      friends: [],
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login
authRoutes.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    req.session.userId = user._id; // Use MongoDB's `_id`
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

const userRoutes = express.Router();

// Fetch current user info
userRoutes.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  User.findById(req.session.userId, "username") // Use MongoDB's `_id`
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ username: user.username });
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Server error" });
    });
});

// Fetch another user by ID
userRoutes.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username interests friends profileImage"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.use("/api/user", userRoutes);

app.use("/api/friends", require("./routes/friends"));
app.use("/api/recommend", require("./routes/recommend"));

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
