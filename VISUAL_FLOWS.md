# Collaboration Feature - Visual Flow Diagrams

## 1. Collaboration Invitation Flow

```
┌─────────────┐                                    ┌─────────────┐
│   User A    │                                    │   User B    │
│  (Inviter)  │                                    │  (Invitee)  │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ 1. Navigate to /collaborations                  │
       ├──────────────────────────────────────────►      │
       │                                                  │
       │ 2. Click "Invite User"                          │
       ├──────────────────────────────────────────►      │
       │                                                  │
       │ 3. Enter bob@example.com                        │
       ├──────────────────────────────────────────►      │
       │                                                  │
       │ 4. POST /api/collab/invite                      │
       ├──────────────────────────────────────────►      │
       │                                                  │
       │ 5. Collaboration created (status: pending)      │
       │◄──────────────────────────────────────────      │
       │                                                  │
       │                                                  │ 6. Login as User B
       │                                                  ├──────────────────►
       │                                                  │
       │                                                  │ 7. View pending invites
       │                                                  ├──────────────────►
       │                                                  │
       │                                                  │ 8. Click "Accept"
       │                                                  ├──────────────────►
       │                                                  │
       │ 9. POST /api/collab/:id/accept                  │
       │◄─────────────────────────────────────────────── │
       │                                                  │
       │ 10. Collaboration status: active                │
       ├──────────────────────────────────────────────► │
       │                                                  │
       │ 11. Both users can now add transactions         │
       │◄────────────────────────────────────────────────►
```

## 2. Transaction Addition Flow

```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│   User A    │                  │   Backend   │                  │  Database   │
└──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
       │                                │                                │
       │ 1. Open collaboration          │                                │
       ├───────────────────────────────►│                                │
       │                                │ 2. GET /api/collab/:id         │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │                                │ 3. Return collaboration data   │
       │                                │◄───────────────────────────────┤
       │ 4. Display dashboard           │                                │
       │◄───────────────────────────────┤                                │
       │                                │                                │
       │ 5. Click "Add Transaction"     │                                │
       ├───────────────────────────────►│                                │
       │                                │                                │
       │ 6. Fill form (₹1000, Groceries)│                                │
       ├───────────────────────────────►│                                │
       │                                │                                │
       │ 7. POST /api/collab/:id/transactions                            │
       ├───────────────────────────────►│                                │
       │                                │ 8. Validate & save             │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │                                │ 9. Transaction created         │
       │                                │◄───────────────────────────────┤
       │ 10. Success response           │                                │
       │◄───────────────────────────────┤                                │
       │                                │                                │
       │ 11. Fetch updated balance      │                                │
       ├───────────────────────────────►│                                │
       │                                │ 12. Calculate balance          │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │                                │ 13. Return balance summary     │
       │                                │◄───────────────────────────────┤
       │ 14. Display updated balance    │                                │
       │◄───────────────────────────────┤                                │
```

## 3. Balance Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Balance Calculation                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Get all         │
                    │ transactions    │
                    │ for collab      │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Separate by user and type    │
              └──────────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │   User A      │         │   User B      │
        │   Expenses    │         │   Expenses    │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                │ Sum = ₹1000            │ Sum = ₹400
                │                         │
                └────────────┬────────────┘
                             ▼
                    ┌─────────────────┐
                    │ Total Expenses  │
                    │    ₹1400        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Each Should Pay │
                    │  ₹1400 / 2 =    │
                    │     ₹700        │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │ User A Balance│         │ User B Balance│
        │ ₹1000 - ₹700  │         │ ₹400 - ₹700   │
        │   = +₹300     │         │   = -₹300     │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                └────────────┬────────────┘
                             ▼
                    ┌─────────────────┐
                    │ Final Statement │
                    │ User B owes     │
                    │ User A ₹300     │
                    └─────────────────┘
```

## 4. Component Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         App.jsx                               │
│                     (Route Manager)                           │
└───────────────────────────┬───────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │   Layout      │       │ Auth Pages    │
        │  (Sidebar +   │       │ (Login/       │
        │   Navbar)     │       │  Register)    │
        └───────┬───────┘       └───────────────┘
                │
    ┌───────────┼───────────┬───────────────────┐
    ▼           ▼           ▼                   ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────────────┐
│Dashboard│ │Transact-│ │Collaboration │ │Collaboration     │
│         │ │ions     │ │List          │ │Dashboard         │
└─────────┘ └─────────┘ └──────┬───────┘ └────────┬─────────┘
                               │                  │
                               │                  │
                    ┌──────────┴──────────────────┴──────┐
                    │                                     │
                    ▼                                     ▼
            ┌───────────────┐                   ┌────────────────┐
            │ Invite Modal  │                   │ Transaction    │
            │               │                   │ Modal          │
            └───────────────┘                   └────────────────┘
                    │                                     │
                    │                                     │
                    └──────────┬──────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  UI Components   │
                    │  - Card          │
                    │  - Button        │
                    │  - Input         │
                    │  - Badge         │
                    │  - Avatar        │
                    └──────────────────┘
```

## 5. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests (Axios)
                            │ + JWT Token
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API                                │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐       │
│  │   Routes    │───►│ Controllers  │───►│ Middleware  │       │
│  │             │    │              │    │ (Auth)      │       │
│  └─────────────┘    └──────┬───────┘    └─────────────┘       │
│                            │                                    │
│                            ▼                                    │
│                    ┌───────────────┐                           │
│                    │    Models     │                           │
│                    │  (Mongoose)   │                           │
│                    └───────┬───────┘                           │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             │ MongoDB Queries
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Users     │  │Collaborations│  │CollabTransact│         │
│  │              │  │              │  │ions          │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 6. User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Journey: Sharing Expenses               │
└─────────────────────────────────────────────────────────────────┘

Step 1: Registration
    │
    ├─► User creates account
    │   └─► Email, Name, Password
    │
    ▼

Step 2: Login
    │
    ├─► User logs in
    │   └─► JWT token generated
    │
    ▼

Step 3: Navigate to Collaborations
    │
    ├─► Click "Collaborations" in sidebar
    │   └─► View empty state or existing collabs
    │
    ▼

Step 4: Send Invite
    │
    ├─► Click "Invite User"
    │   ├─► Enter friend's email
    │   └─► Submit invitation
    │
    ▼

Step 5: Friend Accepts
    │
    ├─► Friend logs in
    │   ├─► Sees pending invitation
    │   └─► Clicks "Accept"
    │
    ▼

Step 6: Collaboration Active
    │
    ├─► Both users can access shared dashboard
    │   ├─► View balance (initially ₹0)
    │   └─► See empty transaction list
    │
    ▼

Step 7: Add Expenses
    │
    ├─► User A adds expense (₹1000)
    │   ├─► Balance updates
    │   └─► Chart shows distribution
    │
    ├─► User B adds expense (₹400)
    │   ├─► Balance recalculates
    │   └─► Settlement shows: B owes A ₹300
    │
    ▼

Step 8: Track & Settle
    │
    ├─► View who owes whom
    │   ├─► See transaction history
    │   ├─► View charts
    │   └─► Settle outside app
    │
    ▼

Step 9: Continue Tracking
    │
    └─► Add more transactions as needed
        └─► Balance auto-updates
```

## 7. Database Relationships

```
┌─────────────────┐
│      User       │
│                 │
│  _id            │◄────────┐
│  name           │         │
│  email          │         │
│  password       │         │
└─────────────────┘         │
                            │
                            │ users[]
                            │
                    ┌───────┴──────────┐
                    │  Collaboration   │
                    │                  │
                    │  _id             │◄──────┐
                    │  users[2]        │       │
                    │  status          │       │
                    │  createdBy       │       │
                    │  invitedUser     │       │
                    └──────────────────┘       │
                                               │
                                               │ collaborationId
                                               │
                                    ┌──────────┴─────────────┐
                                    │  CollabTransaction     │
                                    │                        │
                                    │  _id                   │
                                    │  collaborationId  ─────┘
                                    │  userId  ──────────────┐
                                    │  amount                │
                                    │  type                  │
                                    │  category              │
                                    │  description           │
                                    │  date                  │
                                    └────────────────────────┘
                                                             │
                                                             │
                                    ┌────────────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │     User      │
                            │               │
                            │  _id          │
                            │  name         │
                            │  email        │
                            └───────────────┘
```

## 8. State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Component State                        │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Collaboration │   │ Transactions  │   │    Balance    │
│     List      │   │     List      │   │    Summary    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  API Service  │
                    │  (collabApi)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Axios Instance│
                    │  + JWT Token  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    └───────────────┘
```

This visual documentation helps understand the complete flow of the collaboration feature!
