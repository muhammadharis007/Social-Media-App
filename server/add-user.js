const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // Adjust the path if needed

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/mydatabase")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection Error:", err));

// Add User Function
async function addUser() {
  const username = "testuser"; // Change as needed
  const password = "testpassword"; // Change as needed
  const interests = ["coding", "reading"]; // Example interests

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("User already exists");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({ username, password: hashedPassword, interests });

    // Save the user to the database
    await user.save();
    console.log("User added successfully:", user);
  } catch (error) {
    console.error("Error adding user:", error);
  } finally {
    mongoose.connection.close(); // Close the connection after operation
  }
}

addUser();
