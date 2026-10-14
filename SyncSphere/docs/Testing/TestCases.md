# SyncSphere — Comprehensive Test Cases & Traceability Matrix

**Project:** SyncSphere — Collaborative Schedule & Project Management System  
**Version:** 1.0.0  
**Specification Reference:** Master Development Prompt Sections 4–11  
**Execution Environment:** Node.js Native Test Runner (`node:test`) + PostgreSQL / Prisma  

---

## 1. Requirements Traceability Matrix (RTM)

| Requirement / Workflow | Module Description | Test Case ID | Test Level | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-1 / Workflow A** | User Registration & Email Validation | `TC-001` | Unit | PASS |
| **REQ-1 / Workflow A** | Password Hashing (bcrypt 12 rounds) | `TC-002` | Unit | PASS |
| **REQ-1 / Workflow A** | Session Authentication & Cookie Issuance | `TC-003` | Unit / System | PASS |
| **REQ-2 / Workflow B** | Team Creation & 1:1 SharedCalendar Provisioning | `TC-004` | Integration | PASS |
| **REQ-2 / Workflow B** | Team Member Invitation & Role Assignment | `TC-005` | Integration | PASS |
| **REQ-3 / Workflow B** | Project Creation & 1:1 DiscussionBoard Provisioning| `TC-006` | Integration | PASS |
| **REQ-3 / Workflow B** | Project Milestone Lifecycle | `TC-007` | Integration | PASS |
| **REQ-3 / Workflow G** | Dynamic Mathematical Progress Calculation | `TC-008` | Unit / Integration | PASS |
| **REQ-4 / Workflow C** | Task Creation, Priority, and Due Date | `TC-009` | Unit | PASS |
| **REQ-4 / Workflow C** | Task Assignment to Multiple Members | `TC-010` | Integration | PASS |
| **REQ-4 / Workflow C** | Kanban Drag-and-Drop Status Transitions | `TC-011` | Integration | PASS |
| **REQ-4** | Task Comment Threading | `TC-012` | Integration | PASS |
| **REQ-4** | File Attachment Upload & MIME Verification | `TC-013` | Unit / Integration | PASS |
| **REQ-5 / Workflow D** | Personal Event Creation & Recurrence | `TC-014` | Unit | PASS |
| **REQ-5 / Workflow D** | Personal Schedule Privacy & Isolation | `TC-015` | Validation | PASS |
| **REQ-6 / Workflow E** | Shared Calendar Aggregated Feed | `TC-016` | Integration | PASS |
| **REQ-7 / Workflow E** | Meeting Scheduling & Participant Linking | `TC-017` | Integration | PASS |
| **REQ-8 / Workflow E** | Meeting & Task Reminder Generation | `TC-018` | Integration | PASS |
| **REQ-8** | Autonomous Background Reminder Polling | `TC-019` | System | PASS |
| **REQ-8** | Notification Dispatch & Read/Unread State | `TC-020` | Unit / Integration | PASS |
| **REQ-9 / Workflow F** | Project Discussion Post Creation | `TC-021` | Integration | PASS |
| **REQ-9 / Workflow F** | Announcement Pinning with Role Guard | `TC-022` | Integration / Security| PASS |
| **REQ-10 / Workflow G** | Progress Report Generation | `TC-023` | Unit / Integration | PASS |
| **REQ-10 / Workflow G** | Task Completion Report by Member | `TC-024` | Unit / Integration | PASS |
| **REQ-10** | Usage Report from Real Database Records | `TC-025` | Unit / Integration | PASS |
| **Workflow A** | Complete Authentication Journey | `TC-026` | System | PASS |
| **Workflow B** | Team → Member → Project → Milestone Workflow | `TC-027` | System | PASS |
| **Workflow C** | Task Creation → Assignment → Status Update | `TC-028` | System | PASS |
| **Workflow D** | Personal Event → Calendar View → Reminder | `TC-029` | System | PASS |
| **Workflow E** | Schedule Meeting → Shared Calendar → Notify | `TC-030` | System | PASS |
| **Workflow F** | Discussion Board → Post Announcement → View | `TC-031` | System | PASS |
| **Workflow G** | Complete Tasks → Update Progress → Report | `TC-032` | System | PASS |
| **Section 4 & 9** | RBAC Privilege Boundary Enforcement | `TC-033` | Security / System | PASS |
| **Section 9** | Session Invalidation on Logout | `TC-034` | Security / System | PASS |
| **Section 12** | Database Relational Cascade & Cleanup | `TC-035` | Validation | PASS |

---

## 2. Detailed Test Specifications

### TC-001: Registration Input & Email Validation
- **Module:** User Management
- **Level:** Unit Testing
- **Description:** Verify that registration rejects malformed emails, empty passwords, and names shorter than minimum requirements.
- **Preconditions:** None.
- **Steps:**
  1. Submit registration with invalid email formats (e.g. `invalid-email`, `user@`, `@domain.com`).
  2. Submit password with length $< 8$ characters.
  3. Submit valid data (`alice@example.com`, `SecurePassword123!`, `Alice Smith`).
- **Expected Outcome:** Invalid inputs throw standard 400 Bad Request; valid data passes validation schema.

### TC-002: Bcrypt Password Hashing & Salt Verification
- **Module:** Authentication & Security
- **Level:** Unit Testing
- **Description:** Ensure passwords stored in database are hashed with `bcryptjs` using at least 12 salt rounds.
- **Steps:**
  1. Pass plaintext password through `bcrypt.hash(password, 12)`.
  2. Verify resulting hash begins with `$2a$12$` or `$2b$12$`.
  3. Verify `bcrypt.compare(plaintext, hash)` returns `true` for matching and `false` for mismatched credentials.
- **Expected Outcome:** Hashes are one-way, unique, and strictly salted.

### TC-004: Team Creation with 1:1 SharedCalendar Provisioning
- **Module:** Team Management
- **Level:** Integration Testing
- **Description:** Verify that creating a Team atomically provisions its 1:1 `SharedCalendar` record inside a database transaction.
- **Steps:**
  1. Call `teamService.createTeam(creatorId, { name: "Frontend Team" })`.
  2. Query `prisma.sharedCalendar.findUnique({ where: { teamId } })`.
- **Expected Outcome:** Both `Team` and `SharedCalendar` records exist with matching `teamId`.

### TC-008: Empirical Dynamic Project Progress Calculation
- **Module:** Project Management
- **Level:** Unit / Integration Testing
- **Description:** Verify that project completion percentage is calculated as `Math.round((completedTasks / totalTasks) * 100)` and persists accurately.
- **Steps:**
  1. Create Project with 4 tasks.
  2. Mark 1 task as `COMPLETED`. Project progress must equal $25\%$.
  3. Mark 2 more tasks as `COMPLETED`. Project progress must equal $75\%$.
  4. Mark 4th task as `COMPLETED`. Project progress must equal $100\%$.
- **Expected Outcome:** Project progress matches empirical task ratio at all times.

### TC-011: Kanban Drag-and-Drop Status Transitions
- **Module:** Task Management
- **Level:** Integration Testing
- **Description:** Verify tasks can transition through `TO_DO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` and persist to PostgreSQL.
- **Steps:**
  1. Create task with initial status `TO_DO`.
  2. Update status to `IN_PROGRESS`.
  3. Update status to `COMPLETED`.
  4. Query database to confirm persisted status.
- **Expected Outcome:** Status updates persist in PostgreSQL; completed tasks increment project progress.

### TC-015: Personal Schedule Privacy & Isolation
- **Module:** Personal Scheduling
- **Level:** Validation Testing
- **Description:** Verify that User A cannot read, edit, or delete personal events owned by User B.
- **Steps:**
  1. Authenticate as User A and create a personal event.
  2. Attempt to retrieve or delete the event using User B's session context.
- **Expected Outcome:** API returns 403 Forbidden or 404 Not Found; User B cannot access User A's private events.

### TC-033: Role-Based Access Control (RBAC) Enforcement
- **Module:** Security & Access Control
- **Level:** System Testing
- **Description:** Verify that a standard Team Member cannot create projects, delete teams, or pin announcements.
- **Steps:**
  1. User with `MEMBER` role calls `POST /api/v1/projects`.
  2. User calls `POST /api/v1/discussions/announcements` with `isPinned: true`.
- **Expected Outcome:** Express RBAC middleware rejects requests with `403 Forbidden` ("Insufficient permissions for this team action").
