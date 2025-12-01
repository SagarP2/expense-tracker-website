# Expense Tracker

A full-stack expense tracking application with modern UI and collaboration features.

## Features

- **User Authentication**: Secure registration and login with JWT
- **Personal Expense Tracking**: Add, edit, and delete income/expense transactions
- **Dashboard Analytics**: 
  - Visual charts (Pie & Bar charts)
  - Balance summary
  - Income/Expense breakdown
  - Monthly trends
- **Collaboration System**: 
  - Share expenses with other users
  - Real-time balance calculations
  - Split expenses 50/50
  - Track who owes whom
  - Invite users via email
- **Modern UI/UX**: 
  - Glassmorphism design
  - Smooth animations
  - Fully responsive (Mobile, Tablet, Desktop)
  - Premium color schemes
- **Currency**: Indian Rupees (₹)

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 19
- React Router v7
- Tailwind CSS v3
- Recharts for data visualization
- Lucide React for icons
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (or next available port)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Personal Transactions
- `GET /api/transactions` - Get all user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

<<<<<<< HEAD
### Collaborations
- `POST /api/collab/invite` - Send collaboration invite
- `POST /api/collab/:id/accept` - Accept invitation
- `POST /api/collab/:id/reject` - Reject invitation
- `GET /api/collab/my-groups` - Get all collaborations
- `GET /api/collab/:id` - Get collaboration details
- `POST /api/collab/:id/transactions` - Add shared transaction
- `GET /api/collab/:id/transactions` - Get shared transactions
- `DELETE /api/collab/:id/transactions/:txId` - Delete shared transaction
- `GET /api/collab/:id/balance-summary` - Get balance summary

## Collaboration Feature

The collaboration system allows users to:
- Invite other users to share expenses
- Track shared income and expenses
- Automatically calculate who owes whom
- View expense distribution charts
- Manage shared transactions

**Balance Calculation Example:**
```
User A spends: ₹1000
User B spends: ₹400
Total: ₹1400
Each should pay: ₹700
Result: User B owes User A ₹300
```

For detailed documentation, see [COLLABORATION_FEATURE.md](./COLLABORATION_FEATURE.md)

## Features Walkthrough

### 1. Dashboard
- View total balance, income, and expenses
- Monthly trends bar chart
- Expense breakdown pie chart
- Quick stats cards

### 2. Transactions
- Add/edit/delete personal transactions
- Filter by type (income/expense)
- Search by description or category
- Responsive table/card views

### 3. Collaborations
- Send invites to other users
- Accept/reject pending invitations
- View active collaborations
- Access shared expense dashboards

### 4. Collaboration Dashboard
- Balance summary showing who owes whom
- Expense distribution chart
- Shared transaction history
- Add/delete shared transactions

## Design Features

- **Glassmorphism**: Frosted glass effect on cards and sidebar
- **Gradient Backgrounds**: Subtle radial gradients
- **Smooth Animations**: Fade-in, slide-up effects
- **Color-Coded**: Green for income, Red for expenses
- **Responsive**: Mobile-first design approach
- **Modern Typography**: Inter font family
- **Shadow Effects**: Soft shadows and glows

## Security

- Password hashing with bcryptjs
- JWT-based authentication
- Protected API routes
- User-specific data access
- Input validation
- Secure collaboration access control

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Author

Built with ❤️ using React, Node.js, and MongoDB
=======

>>>>>>> 34ce4d42d55ef8f76d8eba9d3f394c96aff99c71
