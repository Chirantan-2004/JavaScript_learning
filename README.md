# Authentication & Profile Management API

A simple student-friendly REST API built with:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs password hashing
- Multer profile image upload
- express-rate-limit
- dotenv

## 1. Project structure

```text
auth-profile-management-api/
├── config/
│   └── db.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── upload.js
├── models/
│   ├── Booking.js
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── productRoutes.js
│   └── profileRoutes.js
├── uploads/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## 2. Installation

```bash
npm install
```

Create a `.env` file from `.env.example`.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_auth_api
JWT_SECRET=my_super_secret_key_123
JWT_EXPIRES_IN=1d
```

Make sure MongoDB is running.

## 3. Run

Development:

```bash
npm run dev
```

Normal:

```bash
npm start
```

Server:

```text
http://localhost:5000
```

## 4. Authentication

After login, copy the JWT token.

For protected APIs send:

```text
Authorization: Bearer YOUR_TOKEN
```

The user ID is always read from the JWT. Protected APIs do NOT accept a user ID from the request body.

## 5. API list

### Authentication

#### Register
`POST /api/auth/register`

Body:

```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "123456"
}
```

#### Login
`POST /api/auth/login`

Body:

```json
{
  "email": "rahul@example.com",
  "password": "123456"
}
```

Returns a JWT token.

#### Logout
`POST /api/auth/logout`

Protected.

Header:

```text
Authorization: Bearer YOUR_TOKEN
```

### Profile

#### Update name/email
`PUT /api/profile`

Protected.

Body can contain either or both:

```json
{
  "name": "Rahul Kumar",
  "email": "rahulk@example.com"
}
```

#### Update profile picture
`PUT /api/profile/picture`

Protected.

Use `multipart/form-data`.

Field:

```text
profileImage = <image file>
```

Allowed: JPG, JPEG, PNG, WEBP.

Maximum size: 2MB.

### Products

All product APIs are protected.

#### Create
`POST /api/products`

Example:

```json
{
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 799,
  "sku": "MOUSE-001",
  "description": "Basic wireless mouse",
  "discount": 10,
  "quantity": 20
}
```

#### Get all
`GET /api/products`

#### Get one
`GET /api/products/:id`

#### Update
`PUT /api/products/:id`

#### Delete
`DELETE /api/products/:id`

### Bookings

All booking APIs are protected.

#### Place booking
`POST /api/bookings`

Body:

```json
{
  "product_id": "PRODUCT_MONGODB_ID",
  "quantity": 2
}
```

Do NOT send `user_id`.

The server gets the current user's ID from the JWT.

The server:
1. checks the product exists
2. checks stock
3. calculates discounted price
4. decreases product quantity
5. creates the booking

#### Current user's bookings
`GET /api/bookings/my`

The server gets the current user from the JWT.

## 6. Model note

MongoDB automatically creates an `_id` using `ObjectId`.

For `Booking`, `user_id` and `product_id` are therefore implemented as Mongoose `ObjectId` references. This is the normal Mongoose way to enforce that the referenced User/Product exists.

The assignment says `number` for these fields, but MongoDB's standard relational/reference implementation is `ObjectId`. The API behavior still satisfies the important requirement: a booking cannot be created for a non-existent user or product.

## 7. Error handling

All routes pass errors to:

```text
middleware/errorHandler.js
```

It handles:
- Mongoose validation errors
- duplicate values such as email/SKU
- invalid MongoDB IDs
- Multer upload errors
- authentication errors
- unknown routes
- general server errors

## 8. Rate limiting

Authentication endpoints use `express-rate-limit` to reduce repeated login/register requests.

## 9. Important student-project behavior

- Passwords are never stored as plain text.
- JWT is required for every protected endpoint.
- User ID for protected operations comes from JWT.
- Profile images are stored in `/uploads`.
- Product stock decreases when a booking is placed.
- Total booking amount is calculated on the server rather than trusted from the client.
