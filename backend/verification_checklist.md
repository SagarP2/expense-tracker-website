# Verification Checklist

## 1. Safety Check (Server Run)
- [ ] Run `npm run dev` in `backend`.
- [ ] Ensure no crash on startup.
- [ ] Ensure no "Bull" or "Redis" connection errors in logs.

## 2. Settlement Request Test (CURL)
Run the following command (replace `<COLLAB_ID>` and `<TOKEN>`):

```bash
curl -X POST http://localhost:5000/api/collab/<COLLAB_ID>/settlement/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"amount": 50, "method": "UPI"}'
```

**Expected Response (200 OK):**
```json
{
  "_id": "...",
  "settlementRequest": {
    "amount": 50,
    "requestedBy": "...",
    ...
  }
}
```

**Expected Backend Logs:**
- `🏗️ createNotification: { type: 'SETTLEMENT_REQUEST', ... }`
- `✅ Notification created in DB: ...`
- `📧 Attempting email to ...` (or `ℹ️ User ... not found` / `❌ Email failed` but NO CRASH)

## 3. Database Verification
- [ ] Check MongoDB `notifications` collection.
- [ ] Find the new document.
- [ ] **Verify**: `type` is `"SETTLEMENT_REQUEST"`.
- [ ] **Verify**: `payload.settlementId` matches the collaboration ID.

## 4. Frontend Verification
- [ ] Log in as the Payer.
- [ ] Check notification bell.
- [ ] **Expect**: "Requester requested settlement of ₹50" (Not "invited you...").
- [ ] **Expect**: "Pay" button is visible and works.
