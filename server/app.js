const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const pathToUsersFile = path.join(__dirname, "users.json");

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

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");

app.use("/api/auth", authRoutes);
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
