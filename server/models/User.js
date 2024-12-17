const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  interests: [String],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  profileImage: { type: String, default: "./public/images/pfp/halfjo.png" },
  posts: [
    {
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
