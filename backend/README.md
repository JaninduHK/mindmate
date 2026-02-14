# MindMate Backend API

RESTful API server for MindMate mental health application built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Start MongoDB service
# Run development server
npm run dev
```

The server will start on `http://localhost:5000`

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cloudinary** - File storage
- **multer** - File upload handling
- **joi** - Schema validation
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - CORS middleware
- **cookie-parser** - Cookie parsing
- **compression** - Response compression
- **morgan** - HTTP logging
- **express-mongo-sanitize** - NoSQL injection prevention

## 🌳 Project Structure

```
backend/
├── config/
│   ├── cloudinary.js       # Cloudinary configuration
│   ├── constants.js        # App constants
│   └── database.js         # MongoDB connection
├── controllers/
│   ├── auth.controller.js  # Authentication logic
│   ├── upload.controller.js # File upload logic
│   └── user.controller.js  # User management logic
├── middlewares/
│   ├── auth.middleware.js  # JWT verification
│   ├── error.middleware.js # Error handling
│   ├── upload.middleware.js # Multer config
│   └── validate.middleware.js # Request validation
├── models/
│   ├── RefreshToken.model.js # Refresh token schema
│   └── User.model.js       # User schema
├── routes/
│   ├── auth.routes.js      # Auth endpoints
│   ├── upload.routes.js    # Upload endpoints
│   └── user.routes.js      # User endpoints
├── utils/
│   ├── ApiError.js         # Custom error class
│   ├── ApiResponse.js      # Response formatter
│   ├── asyncHandler.js     # Async wrapper
│   ├── jwt.util.js         # JWT utilities
│   └── validation.util.js  # Joi schemas
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── README.md               # This file
└── server.js               # Entry point
```

## 🔐 Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindmate
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login user
POST   /api/auth/logout        Logout user
POST   /api/auth/refresh       Refresh access token
GET    /api/auth/me            Get current user (protected)
```

### User Management
```
GET    /api/user/profile       Get user profile (protected)
PUT    /api/user/profile       Update profile (protected)
PUT    /api/user/password      Change password (protected)
DELETE /api/user/account       Delete account (protected)
```

### File Upload
```
POST   /api/upload/image       Upload image (protected)
DELETE /api/upload/image       Delete image (protected)
```

### Health Check
```
GET    /api/health             Server health status
```

## 🔒 Authentication

Uses JWT dual-token strategy:
- **Access Token**: Short-lived (15 min), sent in Authorization header
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie

### Request Headers
```
Authorization: Bearer <access_token>
```

## 📝 Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🛡️ Security Features

- JWT authentication
- Password hashing (bcrypt, 12 rounds)
- httpOnly cookies for refresh tokens
- Rate limiting (5 requests per 15 min for auth)
- Input validation (Joi schemas)
- NoSQL injection prevention
- CORS configuration
- Helmet security headers
- Request sanitization

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

1. Set `NODE_ENV=production`
2. Use strong, random JWT secrets (32+ characters)
3. Configure MongoDB Atlas connection
4. Set up Cloudinary production environment
5. Enable HTTPS
6. Configure CORS for production client URL
7. Set secure cookie options
8. Deploy to your preferred platform

### Production Checklist
- [ ] Strong JWT secrets
- [ ] MongoDB Atlas with IP whitelist
- [ ] HTTPS enabled
- [ ] Production Cloudinary setup
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Logging configured
- [ ] Monitoring setup

## 📊 Database Models

### User
- name: String
- email: String (unique)
- password: String (hashed)
- avatar: { url, publicId }
- role: String (user/admin)
- isEmailVerified: Boolean
- lastLogin: Date
- isActive: Boolean

### RefreshToken
- userId: ObjectId
- token: String (unique)
- expiresAt: Date
- createdByIp: String
- revokedAt: Date
- revokedByIp: String
- replacedByToken: String

## 🐛 Error Handling

Centralized error handling with custom ApiError class:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Duplicate key errors (409)
- Server errors (500)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guidelines](https://owasp.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License
