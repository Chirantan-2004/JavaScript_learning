require("dotenv").config();

const express = require("express");
const path = require("path");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const productRoutes = require("./routes/productRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;


// =====================================================
// DATABASE CONNECTION
// =====================================================

connectDB();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);


// =====================================================
// FRONTEND
// =====================================================

// Serve HTML, CSS and JavaScript from /public
app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// =====================================================
// UPLOADED PROFILE IMAGES
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// =====================================================
// HOME PAGE
// =====================================================

// Open http://localhost:5000
app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


// =====================================================
// FAVICON
// =====================================================

app.get("/favicon.ico", (req, res) => {

  res.status(204).end();

});


// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);


// Profile
app.use(
  "/api/profile",
  profileRoutes
);


// Products
app.use(
  "/api/products",
  productRoutes
);


// Bookings
app.use(
  "/api/bookings",
  bookingRoutes
);


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res, next) => {

  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  error.statusCode = 404;

  next(error);

});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(errorHandler);


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});