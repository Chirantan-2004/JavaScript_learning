const express = require("express");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// 4. Update profile name and email - protected
router.put("/", authenticate, async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      const error = new Error("Provide at least name or email to update.");
      error.statusCode = 400;
      throw error;
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// 5. Update profile picture - protected
router.put("/picture", authenticate, upload.single("profileImage"), async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Please upload an image using the profileImage field.");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    // Delete old local image if one exists.
    if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture updated successfully.",
      profileImage: user.profileImage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
