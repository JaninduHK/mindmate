# MindMate Frontend

React-based frontend application for MindMate mental health support platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API URL

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Key Technologies

- **React 19** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - Beautiful notifications

## 🌳 Project Structure

```
src/
├── api/                    # API service layer
├── components/             # Reusable components
│   ├── common/            # Button, Input, Loading, etc.
│   └── layout/            # Header, Footer
├── contexts/              # Global state (AuthContext)
├── hooks/                 # Custom hooks (useAuth)
├── pages/                 # Page components
├── App.jsx                # Main app with routing
└── main.jsx               # Entry point
```

## 🔐 Authentication Flow

1. User logs in or registers
2. Access token stored in memory
3. Refresh token in httpOnly cookie
4. Axios interceptor auto-refreshes expired tokens
5. Protected routes redirect unauthorized users

## 🗺️ Routes

### Public
- `/` - Landing page
- `/login` - User login
- `/register` - Sign up

### Protected
- `/dashboard` - User dashboard
- `/profile` - Profile & settings

## 🎨 Component Examples

### Button
```jsx
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```

### Input
```jsx
<Input
  label="Email"
  type="email"
  error={error}
  required
/>
```

## 🔧 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=MindMate
```

## 🚀 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Responsive Design

Built mobile-first with Tailwind breakpoints:
- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+
- `xl:` 1280px+

## 🔄 State Management

Uses React Context API for global state:
- **AuthContext** - User authentication state

Access with `useAuth()` hook:
```jsx
const { user, isAuthenticated, login, logout } = useAuth();
```

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Static hosting**: Upload `dist/` folder

Remember to set `VITE_API_BASE_URL` to your production API!

## 🐛 Troubleshooting

**Port in use?**
```bash
npm run dev -- --port 3000
```

**API not connecting?**
- Check `.env` has correct `VITE_API_BASE_URL`
- Ensure backend is running
- Verify CORS settings

## 📚 Learn More

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

## 📄 License

MIT License
