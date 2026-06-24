# ✓ TaskFlow — Task Management Application

A full-stack task management web app with user authentication, CRUD operations, real-time updates via WebSockets, and a responsive UI.

## Features
- 🔐 User authentication & authorization (JWT)
- ✅ Full CRUD for tasks (create, read, update, delete)
- 📊 Kanban board view + list view
- 🔴 Priority levels (low / medium / high)
- 🔔 Real-time updates via Socket.io
- 📱 Responsive design for mobile & desktop
- 🔍 Search & filter tasks

## Tech Stack
**Backend:** Node.js, Express.js, MongoDB + Mongoose, Socket.io, JWT  
**Frontend:** Vanilla JS (ES Modules), CSS custom properties

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/task-manager-app.git
cd task-manager-app

# Install backend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start the backend server
npm run server   # with nodemon (dev)
# or
npm start        # production
```

### Open the frontend
Open `index.html` directly in your browser, or serve it with any static file server:
```bash
npx serve .
```

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET  | `/api/auth/me` | Get current user |

### Tasks (all require `Authorization: Bearer <token>`)
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/tasks` | Get all tasks (supports `?status=&priority=&search=`) |
| POST   | `/api/tasks` | Create a task |
| PUT    | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET    | `/api/tasks/stats/summary` | Get task count by status |

## Project Structure
```
task-manager-app/
├── server/
│   ├── index.js          # Express + Socket.io setup
│   ├── models/
│   │   ├── User.js       # User schema (bcrypt hashed pw)
│   │   └── Task.js       # Task schema
│   ├── routes/
│   │   ├── auth.js       # Auth endpoints
│   │   └── tasks.js      # Task CRUD endpoints
│   └── middleware/
│       └── auth.js       # JWT protect middleware
├── css/
│   └── style.css         # App styles
├── js/
│   ├── main.js           # Entry point
│   ├── auth.js           # Auth UI & logic
│   ├── app.js            # Main app layout
│   ├── tasks.js          # Task CRUD + rendering
│   ├── api.js            # API fetch helpers
│   └── utils.js          # Helpers (toast, format)
├── index.html
├── .env.example
└── package.json
```

## License
MIT
