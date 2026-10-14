# SyncSphere — Master Test Plan

**Project:** SyncSphere — Collaborative Schedule & Project Management System  
**Version:** 1.0.0  
**Test Lead:** Quality Engineering & Testing Division  
**Date:** October 2026  
**Status:** Approved for Verification  

---

## 1. Test Objectives

The primary objectives of testing SyncSphere are:
1. **Verification of Strict Functional Scope:** Ensure all 10 core functional modules (User Management, Team Management, Project Management, Task Management & Kanban, Personal Scheduling, Shared Calendar, Meetings, Reminders & Notifications, Project Communication, Dashboard & Reports) operate deterministically according to the Master Development Specification.
2. **UML & Data Relationship Validation:** Ensure strict adherence to domain models, relational cardinality (1:1, 1:N, M:N), transactional consistency, foreign key cascades, and empirical computations.
3. **End-to-End Workflow Validation:** Guarantee that Workflows A through G execute smoothly without data corruption or synchronization discrepancies.
4. **Non-Functional Target Verification:** Verify performance ($<3\text{s}$ dashboard load, 500 concurrent user scaling capacity), security (RBAC enforcement, HTTP-only cookies, bcrypt hashing, MIME validation), and 99.0% operational availability.

---

## 2. Scope of Testing

### 2.1 In-Scope
- **Unit Testing:** Individual service methods, input validation helpers, hashing utilities, and date-time recalculation routines.
- **Integration Testing:** Cross-entity transactions (Team + SharedCalendar, Project + DiscussionBoard, Task + Assignee + Comments + Attachments, Reminder + Notification).
- **System Testing:** End-to-end user journeys (Workflows A through G), RBAC boundaries (Admin vs Leader vs Member), and session lifecycle (login, cookie issuance, logout, invalidation).
- **Validation Testing:** Real user scenarios ensuring personal schedule privacy, team coordination, Kanban drag-and-drop persistence, and report accuracy.

### 2.2 Out-of-Scope (Strict Enforcement)
- Artificial Intelligence or generative assistants.
- External calendar synchronization (Google Calendar, Outlook).
- WebRTC video calls, voice chat, or live socket broadcasts.
- Cloud payment gateways or subscription billing.
- Third-party BaaS backends (Firebase, Supabase).

---

## 3. Test Levels & Strategy

```text
┌────────────────────────────────────────────────────────┐
│            Validation & Acceptance Testing             │
│        (User Journey, Privacy, Realistic Scenarios)    │
├────────────────────────────────────────────────────────┤
│                     System Testing                     │
│         (Workflows A–G, RBAC Guard, Session Life)      │
├────────────────────────────────────────────────────────┤
│                  Integration Testing                   │
│        (Multi-table Transactions, Cascade Rules)       │
├────────────────────────────────────────────────────────┤
│                      Unit Testing                      │
│        (Validation, Regex, Hashing, Computations)      │
└────────────────────────────────────────────────────────┘
```

### 3.1 Unit Testing Strategy
- Tests execution logic of services in isolation (`authService`, `teamService`, `projectService`, `taskService`, `calendarService`, `meetingService`, `notificationService`, `reportService`).
- Focuses on boundary conditions, invalid inputs, edge cases, and deterministic mathematical outputs.

### 3.2 Integration Testing Strategy
- Tests interactions across PostgreSQL relational models using Prisma ORM.
- Validates transactional guarantees (e.g. creating a team must atomically provision its 1:1 SharedCalendar).

### 3.3 System Testing Strategy
- Executes synthetic REST API workflows simulating full browser interactions.
- Validates cookie-based session persistence, route protection, and data isolation between different teams.

### 3.4 Validation Testing Strategy
- Emulates realistic end-user behavior to ensure that UI components (Kanban board, FullCalendar views, Discussion threads, Reports dashboard) accurately reflect database state.

---

## 4. Test Environment & Configuration

| Layer | Technology / Specification |
| :--- | :--- |
| **Node.js Runtime** | Node.js v18.0.0+ / v20.x (ESM enabled) |
| **Backend Framework** | Express.js 4.19+ |
| **Test Engine** | Built-in Node Test Runner (`node:test`, `node:assert`) with Zero-Dependency native ESM execution |
| **Database** | PostgreSQL 14+ |
| **ORM Client** | Prisma Client 5.12+ |
| **Client Engine** | React 18, Vite 5, Tailwind CSS |
| **Environment Config**| `backend/.env` containing `DATABASE_URL`, `SESSION_SECRET`, `PORT=5000` |

---

## 5. Entry & Exit Criteria

### 5.1 Entry Criteria
1. PostgreSQL database running with schema synced via `npx prisma db push` or `prisma migrate`.
2. Environment variables verified and available.
3. Node.js backend dependencies installed (`npm install`).
4. File upload directory (`backend/uploads/`) created with read/write permissions.

### 5.2 Exit Criteria
1. 100% of Unit Test suites pass without unhandled rejections.
2. 100% of Integration Test suites pass with transactional data integrity.
3. All System Workflows (A through G) complete successfully with verified database state.
4. No critical security or authorization vulnerabilities detected.
5. All test results documented in the Test Cases Traceability Matrix.
