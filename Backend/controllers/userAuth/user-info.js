const User = require('../../models/userModel');

const SetUserInformation = async (req, res) => {
  try {
    const { name, email, username, gender } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user information
    if (name) user.name = name;

    if (username) {
      // Check if the new username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.email !== email) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      user.username = username;
    }

    if (gender) {
      // Validate gender
      if (!["male", "female", "*"].includes(gender.toLowerCase())) {
        return res.status(400).json({ message: "Invalid gender value" });
      }
      user.gender = gender.toLowerCase();
    }

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${name}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${name}`;
    user.ProfilePic = gender === "male" ? boyProfilePic : girlProfilePic;
    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "User information updated successfully",
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("Error in SetUserInformation:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { SetUserInformation };