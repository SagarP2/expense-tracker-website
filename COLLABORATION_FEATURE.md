# Collaboration Feature Documentation

## Overview
The Collaboration feature allows users to share expenses with other registered users. It provides a complete expense-splitting system with real-time balance calculations.

## Features

### 1. **Collaboration Management**
- Send collaboration invites via email
- Accept or reject pending invitations
- View all active and pending collaborations
- Real-time status updates

### 2. **Shared Transactions**
- Add income and expenses to shared groups
- Track who added each transaction
- View combined transaction history
- Delete your own transactions

### 3. **Balance Calculation**
The system automatically calculates:
- Total expenses for each user
- Equal split amount (50/50)
- Who owes money to whom
- Settlement status

**Example:**
```
User A spends: ₹1000
User B spends: ₹400
Total: ₹1400
Each should pay: ₹700

Result: User B owes User A ₹300
```

### 4. **Visual Analytics**
- Pie chart showing expense distribution
- Per-user contribution breakdown
- Balance summary cards
- Transaction timeline

## API Endpoints

### Collaboration Routes
```
POST   /api/collab/invite              - Send collaboration invite
POST   /api/collab/:id/accept          - Accept invitation
POST   /api/collab/:id/reject          - Reject invitation
GET    /api/collab/my-groups           - Get all collaborations
GET    /api/collab/:id                 - Get single collaboration
```

### Transaction Routes
```
POST   /api/collab/:id/transactions              - Add transaction
GET    /api/collab/:id/transactions              - Get all transactions
PUT    /api/collab/:id/transactions/:txId        - Update transaction
DELETE /api/collab/:id/transactions/:txId        - Delete transaction
GET    /api/collab/:id/balance-summary           - Get balance summary
```

## Database Models

### Collaboration Model
```javascript
{
  users: [ObjectId],           // Array of 2 user IDs
  status: String,              // 'pending' | 'active' | 'rejected'
  createdBy: ObjectId,         // User who sent invite
  invitedUser: ObjectId,       // User who received invite
  name: String,                // Group name (default: 'Shared Expenses')
  timestamps: true
}
```

### CollabTransaction Model
```javascript
{
  collaborationId: ObjectId,   // Reference to collaboration
  userId: ObjectId,            // User who added transaction
  amount: Number,              // Transaction amount
  type: String,                // 'income' | 'expense'
  category: String,            // Transaction category
  description: String,         // Optional description
  date: Date,                  // Transaction date
  timestamps: true
}
```

## Balance Calculation Logic

The balance summary API returns:
```javascript
{
  userA: {
    id, name, email,
    total_expense: Number,
    total_income: Number,
    balance: Number          // Positive = paid extra, Negative = owes money
  },
  userB: { /* same structure */ },
  total_expense: Number,
  total_income: Number,
  amount_each_should_pay: Number,
  final_statement: String,   // "User A owes User B ₹X" or "Both are settled"
  owedAmount: Number,
  owedBy: Object,            // User who owes
  owedTo: Object             // User who is owed
}
```

## Frontend Pages

### 1. CollaborationList (`/collaborations`)
- Displays all collaborations
- Shows pending invitations with Accept/Reject buttons
- Invite new users via email
- Navigate to collaboration dashboard

### 2. CollaborationDashboard (`/collaborations/:id`)
- Balance summary cards
- Expense distribution pie chart
- Recent transactions list
- Add/delete shared transactions
- Real-time balance updates

## UI Components

### Reusable Components Used
- `Card` - Container with glass effect
- `Button` - Action buttons with variants
- `Input` - Form inputs with labels
- `Badge` - Status indicators
- `Avatar` - User avatars

### Custom Features
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Modern glassmorphism effects
- Color-coded transaction types
- Interactive charts (Recharts)

## Usage Flow

### 1. Sending an Invite
```
1. Navigate to /collaborations
2. Click "Invite User"
3. Enter user's email
4. Click "Send Invitation"
```

### 2. Accepting an Invite
```
1. View pending invitations
2. Click "Accept" on desired invitation
3. Collaboration becomes active
```

### 3. Adding Transactions
```
1. Open collaboration dashboard
2. Click "Add Transaction"
3. Fill in amount, category, description
4. Select type (Income/Expense)
5. Submit
```

### 4. Viewing Balance
```
The dashboard automatically shows:
- Total expenses
- Each user's contribution
- Who owes whom
- Settlement amount
```

## Security Features

- JWT authentication required for all routes
- Users can only access their own collaborations
- Users can only delete their own transactions
- Email validation for invites
- Duplicate collaboration prevention

## Responsive Design

All collaboration pages are fully responsive:
- **Desktop**: Full layout with charts and tables
- **Tablet**: 2-column grid layouts
- **Mobile**: Single column, card-based views
- **No horizontal scrolling** on any device

## Currency Format

All amounts are displayed in Indian Rupees (₹) with 2 decimal places.

Example: `₹1,234.56`

## Error Handling

The system handles:
- Invalid email addresses
- Non-existent users
- Duplicate invitations
- Unauthorized access attempts
- Network errors with user-friendly messages

## Future Enhancements

Potential features for future versions:
- Multiple users per collaboration (groups)
- Unequal split ratios
- Category-wise splitting
- Export to PDF/Excel
- Payment integration
- Recurring expenses
- Expense approval workflow
