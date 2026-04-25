# MindMate - Mental Health Support Application

A comprehensive MERN stack application for mental health support and wellness tracking.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with access and refresh tokens
- **User Management**: Profile management with avatar upload via Cloudinary
- **Protected Routes**: Client-side route protection for authenticated users
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS
- **Security**: Rate limiting, input validation, CORS protection, and more

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server and API framework
- **MongoDB** & **Mongoose** - Database and ODM
- **JWT** - Authentication
- **Cloudinary** - File storage
- **Bcrypt** - Password hashing
- **Joi** - Validation
- **Helmet** - Security headers
- **Express Rate Limit** - DDoS protection

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
MindMate/
├── backend/                 # Backend API server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Custom middlewares
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API services
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utilities
│   └── ...
│
└── README.md              # This file
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MindMate
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindmate
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=MindMate
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

### File Upload
- `POST /api/upload/image` - Upload profile image
- `DELETE /api/upload/image` - Delete profile image

## 🎨 Frontend Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected)
- `/profile` - User profile (protected)

## 🚀 Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas
4. Set up Cloudinary production environment
5. Enable HTTPS
6. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend
1. Run `npm run build`
2. Deploy dist folder to Netlify, Vercel, or similar
3. Update environment variables for production API


