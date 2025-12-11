
# Verification Checklist: Safe Delete Collaboration Flow

## Prerequisites
- Server running: `npm run dev` in backend.
- Two users created (User A and User B).
- A collaboration exists between them.

## 1. Request Deletion
**Action:** User A requests deletion of collaboration.
**CURL:**
```bash
curl -X POST http://localhost:5000/api/collaborations/<COLLAB_ID>/request-deletion \
  -H "Authorization: Bearer <USER_A_TOKEN>"
```
**Expected Result:**
- Status: 200 OK
- Response includes `deletionRequest` with `requestedBy: <USER_A_ID>`.
- **Backend Log:** `🏗️ createNotification: { type: 'COLLAB_DELETE_REQUEST' ... }`

## 2. Verify Notification (User B)
**Action:** Check user B's notifications in DB.
**Mongo Shell:**
```javascript
db.notifications.find({ userId: ObjectId("<USER_B_ID>"), type: "COLLAB_DELETE_REQUEST" }).sort({createdAt: -1}).limit(1)
```
**Expected Result:**
- One document found.
- `message` contains "requested to delete collaboration".

## 3. Reject Deletion (User B)
**Action:** User B rejects the request.
**CURL:**
```bash
curl -X POST http://localhost:5000/api/collaborations/<COLLAB_ID>/reject-deletion \
  -H "Authorization: Bearer <USER_B_TOKEN>"
```
**Expected Result:**
- Status: 200 OK
- `deletionRequest` is reset to null.
- **Backend Log:** `🏗️ createNotification: { type: 'COLLAB_DELETE_REJECTED' ... }`

## 4. Re-Request Deletion (User A)
**Action:** User A requests deletion again.
**CURL:** Matches Step 1.

## 5. Accept Deletion (User B)
**Action:** User B accepts the request.
**CURL:**
```bash
curl -X POST http://localhost:5000/api/collaborations/<COLLAB_ID>/accept-deletion \
  -H "Authorization: Bearer <USER_B_TOKEN>"
```
**Expected Result:**
- Status: 200 OK
- Message: "Collaboration deleted successfully".
- **Backend Log:** `🏗️ createNotification: { type: 'COLLAB_DELETED' ... }`

## 6. Verify Deletion
**Action:** Check DB.
**Mongo Shell:**
```javascript
db.collaborations.findOne({ _id: ObjectId("<COLLAB_ID>") })
```
**Expected Result:** `null`

## 7. Verify Final Notification (User A)
**Action:** Check User A's notifications.
**Mongo Shell:**
```javascript
db.notifications.find({ userId: ObjectId("<USER_A_ID>"), type: "COLLAB_DELETED" })
```
