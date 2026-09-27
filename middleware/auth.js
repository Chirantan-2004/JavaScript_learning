const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Simple in-memory blacklist for logged-out JWTs.
// It is suitable for this student project. A production app would normally
// use a persistent token/session store.
const revokedTokens = new Set();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Authentication required. Please provide a Bearer token.");
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];

    if (revokedTokens.has(token)) {
      const error = new Error("Token has been logged out. Please login again.");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User ID is taken only from the token, never from request body/query.
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      const error = new Error("User associated with this token was not found.");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    req.userId = user._id;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      error.statusCode = 401;
      error.message = "Invalid or expired token.";
    }
    next(error);
  }
};

const revokeToken = (token) => revokedTokens.add(token);

module.exports = { authenticate, revokeToken };
