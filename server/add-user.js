const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const pathToUsersFile = path.join(__dirname, "users.json");

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

// Add Users Function
async function addUsers() {
  const usersData = [
    {
      id: "1",
      username: "testuser",
      password: "testpassword",
      interests: ["reading", "music", "sports"],
      friends: ["2", "3"],
      posts: [],
    },
    {
      id: "2",
      username: "user2",
      password: "password2",
      interests: ["music", "movies"],
      friends: ["1"],
      posts: [],
    },
    {
      id: "3",
      username: "user3",
      password: "password3",
      interests: ["sports", "traveling"],
      friends: ["1"],
      posts: [],
    },
    {
      id: "4",
      username: "user4",
      password: "password4",
      interests: ["reading", "cooking"],
      friends: [],
      posts: [],
    },
    {
      id: "5",
      username: "user5",
      password: "password5",
      interests: ["gaming", "music"],
      friends: [],
      posts: [],
    },
    {
      id: "6",
      username: "user6",
      password: "password6",
      interests: ["movies", "traveling"],
      friends: [],
      posts: [],
    },
    {
      id: "7",
      username: "user7",
      password: "password7",
      interests: ["sports", "gaming"],
      friends: [],
      posts: [],
    },
    {
      id: "8",
      username: "user8",
      password: "password8",
      interests: ["cooking", "music"],
      friends: [],
      posts: [],
    },
    {
      id: "9",
      username: "user9",
      password: "password9",
      interests: ["reading", "gaming"],
      friends: [],
      posts: [],
    },
    {
      id: "10",
      username: "user10",
      password: "password10",
      interests: ["traveling", "movies"],
      friends: [],
      posts: [],
    },
  ];

  try {
    const users = readUsersFromFile();

    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = users.find(
        (user) => user.username === userData.username
      );
      if (existingUser) {
        console.log(`User ${userData.username} already exists`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create a new user object
      const newUser = {
        ...userData,
        password: hashedPassword,
      };

      // Add the new user to the users array
      users.push(newUser);
    }

    // Write the updated users array to the JSON file
    writeUsersToFile(users);
    console.log("Users added successfully");
  } catch (error) {
    console.error("Error adding users:", error);
  }
}

addUsers();
