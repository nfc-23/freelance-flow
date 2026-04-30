# Security Specification - FreelanceFlow

## Data Invariants
1. Users can only read and write data that belongs to them (`userId == request.auth.uid`).
2. Documents cannot be created with a `userId` other than the requester's UID.
3. `createdAt` is immutable and must match `request.time` on creation.
4. `updatedAt` must match `request.time` on every update.
5. Clients must have a valid name and email.
6. Projects must have a budget >= 0 and a valid status.

## The Dirty Dozen (Test Claims)
1. Attempt to create a client with someone else's UID. (DEFIED)
2. Attempt to read another user's project by ID. (DENIED)
3. Attempt to list all invoices across the system. (DENIED)
4. Attempt to delete a client that belongs to another user. (DENIED)
5. Attempt to update a project's `createdAt` timestamp. (DENIED)
6. Attempt to inject a 2MB string into a task title. (DENIED)
7. Attempt to create an invoice with a negative amount. (DENIED)
8. Attempt to update a paid invoice's amount (state lock). (DENIED)
9. Attempt to create a task for a project that doesn't exist. (DENIED)
10. Attempt to spoof `email_verified: false` for admin-only paths (if any). (DENIED)
11. Attempt to change the `clientId` on a project after creation. (DENIED)
12. Attempt to list expenses without being logged in. (DENIED)
