# Expense Tracker - MERN Stack

A production-ready Expense Tracker application built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Overview

This application allows users to track their income and expenses, view detailed analytics, and collaborate with other users for shared expenses.

### Features
- **User Authentication**: Secure login and registration.
- **Dashboard**: Visual overview of financial health.
- **Transactions**: Add, edit, and delete income/expense transactions.
- **Collaboration**: Share expenses with other users and track balances.
- **Responsive Design**: Works seamlessly on desktop and mobile.

## Folder Structure

```
/backend
  /src
    /config         # Database configuration
    /controllers    # Request handlers
    /middleware     # Custom middleware (auth, error, security)
    /models         # Mongoose models
    /routes         # API routes
  server.js         # Entry point

/frontend
  /src
    /components     # Reusable UI components
    /pages          # Application pages
    /context        # React Context (Auth)
    /utils          # Helper functions
    /assets         # Static assets
  vite.config.js    # Vite configuration
```

## Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd expense-tracker-main
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

## Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update the values:
```
MONGO_URI=mongodb://localhost:27017/expense-tracker
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` and update the values:
```
VITE_API_URL=http://localhost:5000/api
```

## Startup

### Development
1.  Start Backend:
    ```bash
    cd backend
    npm run dev
    ```
2.  Start Frontend:
    ```bash
    cd frontend
    npm run dev
    ```

### Production
1.  Build Frontend:
    ```bash
    cd frontend
    npm run build
    ```
2.  Start Backend in Production Mode:
    ```bash
    cd backend
    npm start
    ```
    (Ensure `NODE_ENV=production` is set in `.env`)



