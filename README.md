# Stickkery Admin Panel

Admin panel for managing the Stickkery website. This is a separate frontend application that uses the same backend as the main website.

## Project Structure

```
MERN_Projects/
├── stickerswebsite/              # Main website frontend
├── stickerswebsite-backend/      # Backend API (shared)
└── stickerswebsite-admin-panel/  # Admin panel frontend (this project)
```

## Features

- **Dashboard**: Overview of users, stickers, orders, and revenue
- **Users Management**: View and manage all users
- **Stickers Management**: View and manage all stickers
- **Orders Management**: View and manage all orders
- **Authentication**: Secure login for admin access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The admin panel will run on `http://localhost:5174`

## Backend Integration

The admin panel connects to the same backend as the main website:
- Backend URL: `http://localhost:3001`
- Backend Location: `../stickerswebsite-backend/`
- API proxy is configured in `vite.config.js`

## Pages

- `/login` - Admin login page
- `/dashboard` - Main dashboard with statistics
- `/users` - User management
- `/stickers` - Sticker management
- `/orders` - Order management

## Development

### Running the Admin Panel
```bash
cd /Users/aaryarastogi/MERN_Projects/stickerswebsite-admin-panel
npm run dev
```

### Running the Backend
```bash
cd /Users/aaryarastogi/MERN_Projects/stickerswebsite-backend
mvn spring-boot:run
```

### Running the Main Website
```bash
cd /Users/aaryarastogi/MERN_Projects/stickerswebsite/frontend
npm run dev
```

## Notes

- The admin panel uses the same authentication endpoints as the main website
- Admin role checking should be implemented in the backend
- All API calls are proxied through Vite to the backend on port 3001
- The admin panel runs on port 5174 (different from the main website which runs on 5173)

## Ports

- Main Website: `http://localhost:5173`
- Admin Panel: `http://localhost:5174`
- Backend API: `http://localhost:3001`
