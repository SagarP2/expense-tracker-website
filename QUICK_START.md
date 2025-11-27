# Collaboration Feature - Quick Start Guide

## Testing the Collaboration Feature

Follow these steps to test the complete collaboration workflow:

### Step 1: Create Two User Accounts

1. **Register User A**
   - Navigate to `/register`
   - Name: "Alice"
   - Email: "alice@example.com"
   - Password: "password123"

2. **Register User B**
   - Logout from User A
   - Navigate to `/register`
   - Name: "Bob"
   - Email: "bob@example.com"
   - Password: "password123"

### Step 2: Send Collaboration Invite

1. **Login as Alice**
   - Email: alice@example.com
   - Password: password123

2. **Navigate to Collaborations**
   - Click "Collaborations" in the sidebar
   - Click "Invite User" button

3. **Send Invite to Bob**
   - Enter email: bob@example.com
   - Click "Send Invitation"
   - You'll see the pending invitation in the list

### Step 3: Accept Invitation

1. **Logout and Login as Bob**
   - Email: bob@example.com
   - Password: password123

2. **View Pending Invitations**
   - Navigate to "Collaborations"
   - See invitation from Alice in "Pending Invitations" section

3. **Accept the Invitation**
   - Click "Accept" button
   - Collaboration becomes active

### Step 4: Add Shared Expenses

1. **As Bob, Open Collaboration**
   - Click on the active collaboration card
   - You'll see the collaboration dashboard

2. **Add First Expense**
   - Click "Add Transaction"
   - Amount: 1000
   - Type: Expense
   - Category: "Groceries"
   - Description: "Weekly shopping"
   - Click "Add Transaction"

3. **View Balance**
   - Balance summary shows:
     - Bob's Total: ₹1000
     - Alice's Total: ₹0
     - Each should pay: ₹500
     - **Result: Alice owes Bob ₹500**

### Step 5: Add More Transactions

1. **Logout and Login as Alice**

2. **Navigate to Same Collaboration**
   - Go to Collaborations
   - Click on the shared group with Bob

3. **Add Alice's Expense**
   - Click "Add Transaction"
   - Amount: 400
   - Type: Expense
   - Category: "Utilities"
   - Description: "Electricity bill"
   - Click "Add Transaction"

4. **View Updated Balance**
   - Total Expenses: ₹1400
   - Bob's Total: ₹1000
   - Alice's Total: ₹400
   - Each should pay: ₹700
   - **Result: Alice owes Bob ₹300**

### Step 6: Test Different Scenarios

#### Scenario 1: Equal Split
- Bob spends: ₹500
- Alice spends: ₹500
- Result: Both are settled

#### Scenario 2: Alice Pays More
- Bob spends: ₹300
- Alice spends: ₹700
- Result: Bob owes Alice ₹200

#### Scenario 3: Add Income
- Add shared income (e.g., refund)
- See how it affects the balance

### Step 7: Explore Features

1. **View Charts**
   - Pie chart shows expense distribution
   - See who contributed what percentage

2. **Filter Transactions**
   - View all shared transactions
   - See who added each transaction

3. **Delete Transactions**
   - Hover over your own transactions
   - Click delete icon
   - Balance updates automatically

4. **Multiple Collaborations**
   - Create another collaboration with a different user
   - Manage multiple shared expense groups

## Expected Behavior

### Balance Calculation
The system calculates:
1. Total expenses for each user
2. Equal split (50/50)
3. Difference between what each paid and what they should pay
4. Final settlement statement

### Formula
```
Total Expenses = User A Expenses + User B Expenses
Each Should Pay = Total Expenses / 2
User A Balance = User A Expenses - Each Should Pay
User B Balance = User B Expenses - Each Should Pay

If User A Balance > 0: User B owes User A
If User B Balance > 0: User A owes User B
If both are 0: Both are settled
```

### Visual Indicators

- **Green**: Income, positive balance (paid extra)
- **Red**: Expense, negative balance (owes money)
- **Yellow**: Pending invitations
- **Blue**: Active collaborations

## Troubleshooting

### Issue: Can't send invite
- **Solution**: Make sure the email exists in the system
- User must be registered first

### Issue: Invitation not showing
- **Solution**: Refresh the page or check if logged in as the correct user

### Issue: Can't delete transaction
- **Solution**: You can only delete your own transactions

### Issue: Balance not updating
- **Solution**: Refresh the page to see latest calculations

## API Testing with Postman

### 1. Login and Get Token
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "alice@example.com",
  "password": "password123"
}
```
Copy the token from response.

### 2. Send Invite
```
POST http://localhost:5000/api/collab/invite
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  "email": "bob@example.com"
}
```

### 3. Get Collaborations
```
GET http://localhost:5000/api/collab/my-groups
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### 4. Add Transaction
```
POST http://localhost:5000/api/collab/:collabId/transactions
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  "amount": 1000,
  "type": "expense",
  "category": "Food",
  "description": "Dinner",
  "date": "2025-11-26"
}
```

### 5. Get Balance Summary
```
GET http://localhost:5000/api/collab/:collabId/balance-summary
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
```

## Mobile Testing

1. **Responsive Design**
   - Open on mobile device
   - All features should work
   - No horizontal scrolling

2. **Touch Interactions**
   - Tap to open collaborations
   - Swipe-friendly modals
   - Easy-to-tap buttons

## Production Checklist

Before deploying:
- [ ] Update MongoDB URI to production database
- [ ] Set strong JWT_SECRET
- [ ] Enable CORS for production domain
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Set up error logging
- [ ] Add email notifications for invites
- [ ] Implement data backup strategy

## Next Steps

After testing:
1. Add more users and collaborations
2. Test with real expense data
3. Explore edge cases
4. Provide feedback for improvements
5. Consider additional features:
   - Unequal splits
   - Multiple users per group
   - Expense categories
   - Export reports
   - Payment integration
