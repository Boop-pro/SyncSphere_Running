# SyncSphere — Collaborative Schedule & Project Management System

SyncSphere is a full-stack, deterministic web application designed for personal schedule organization, collaborative team management, Kanban task tracking, shared team calendars, and project reporting.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, React Router v6, FullCalendar, dnd-kit, Axios, Lucide Icons
- **Backend**: Node.js, Express.js (ESM), bcrypt (12 salt rounds), Express Session with secure HTTP-only cookies, Multer
- **Database**: PostgreSQL 14+, Prisma ORM
- **Testing Engine**: Built-in Node Test Runner (`node:test`, `node:assert`) with native ESM support + Standalone E2E Runner
- **Architecture**: Layered MVC / Service-based REST API, Role-Based Access Control (Admin, Team Leader, Team Member)
- **Scope Boundary**: Non-AI, deterministic; no third-party calendar sync, no live chat/sockets, no payment gateways, no proprietary BaaS lock-in (Firebase/Supabase strictly avoided).

---

## 2. Project Directory Structure

```text
SyncSphere/
├── README.md
├── docs/
│   ├── SRS/
│   │   └── SRS_SyncSphere.md             # IEEE 830 Software Requirements Specification
│   ├── UML/
│   │   ├── ClassDiagram.puml             # Domain Class Diagram (Sections 6 & 7)
│   │   └── SequenceDiagrams.puml         # Sequence Diagrams for Workflows A through G
│   └── Testing/
│       ├── TestPlan.md                   # Master Test Plan & Strategy
│       └── TestCases.md                  # Traceability Matrix & Test Cases TC-001 to TC-035
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── prisma/
│   │   └── schema.prisma                 # 20 relational models with cascade rules
│   ├── uploads/                          # Multer authenticated file storage
│   ├── src/
│   │   ├── config/                       # Prisma DB connection pool
│   │   ├── controllers/                  # REST API controllers
│   │   ├── middleware/                   # Auth, RBAC, File Upload & Error Handlers
│   │   ├── routes/                       # Express v1 routes
│   │   ├── services/                     # Domain services with business logic
│   │   └── utils/                        # Background Reminder Scheduler (60s loop)
│   └── tests/
│       ├── unit/
│       │   └── validation.test.js        # Unit test suite
│       ├── integration/
│       │   └── integration.test.js       # Integration test suite
│       ├── system/
│       │   ├── systemWorkflows.test.js   # Workflows A through G system suite
│       │   └── e2eWorkflowRunner.js      # Standalone E2E automated test runner
│       └── validation/
│           └── validationChecks.test.js  # Validation test suite
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── App.jsx                       # React Router v6 Route Map
        ├── main.jsx                      # React entry
        ├── index.css                     # Tailwind design tokens
        ├── components/
        │   ├── common/                   # Navbar, Sidebar, AppLayout, Modal, Spinner
        │   └── kanban/                   # KanbanBoard, KanbanColumn, KanbanCard
        ├── context/                      # AuthContext, NotificationContext
        ├── pages/                        # 15 complete UI pages
        └── services/                     # Axios API clients
```

---

## 3. Implementation Status Across All 9 Phases

- [x] **Phase 1: React Project Structure & Common Layout** (Completed)
- [x] **Phase 2: Database Schema & Authentication** (Completed)
- [x] **Phase 3: Team & Project Management** (Completed)
- [x] **Phase 4: Task Management & Kanban Board** (Completed)
- [x] **Phase 5: Personal Scheduling & Shared Calendar** (Completed)
- [x] **Phase 6: Meetings, Reminders & Notifications** (Completed)
- [x] **Phase 7: Project Discussions & Announcements** (Completed)
- [x] **Phase 8: Dashboard & Reports** (Completed)
- [x] **Phase 9: Integration & Testing** (Completed)

---

## 4. Manual Setup & Execution Guide

### Step 1: Configure Backend Environment
1. Open PowerShell or Terminal and navigate to the backend directory:
   ```bash
   cd "SyncSphere/backend"
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update `DATABASE_URL` in `.env` with your local PostgreSQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/syncsphere_db?schema=public"
   SESSION_SECRET="syncsphere-dev-secret-key-at-least-32-chars-long"
   CLIENT_URL="http://localhost:5173"
   ```

### Step 2: Install Backend Dependencies & Migrate Database
```bash
npm install
npx prisma generate
npx prisma db push
```

### Step 3: Launch Backend Server
```bash
npm run dev
```
The REST API server will start at `http://localhost:5000`. The autonomous reminder scheduler starts running automatically every 60 seconds.

### Step 4: Install Frontend Dependencies & Launch Client
1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd "SyncSphere/frontend"
   ```
2. Install frontend packages:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## 5. Running the Test Suites

The backend includes comprehensive test suites running natively via Node.js Test Runner with zero additional dependencies:

### 1. Run Complete Test Suite
```bash
cd "SyncSphere/backend"
npm test
```

### 2. Run Individual Test Levels
```bash
# Unit Tests (Validation, Hashing, Models)
npm run test:unit

# Integration Tests (Multi-entity transactions, Cascades)
npm run test:integration

# System Tests (Workflows A through G)
npm run test:system

# Validation Tests (Invariants, Time sequencing, Math safety)
npm run test:validation
```

### 3. Run Automated E2E Workflow Runner
```bash
npm run test:e2e
```
This executes Workflows A through G sequentially and outputs a colored summary of assertions and execution duration.

---

## 6. End-to-End Workflow Verification

The following 7 core workflows have been implemented and verified:

- **Workflow A:** Register user $\rightarrow$ Login with bcrypt hash comparison $\rightarrow$ Issue session cookie $\rightarrow$ Load Dashboard.
- **Workflow B:** Create Team $\rightarrow$ 1:1 SharedCalendar provisioned $\rightarrow$ Add Member $\rightarrow$ Create Project $\rightarrow$ 1:1 DiscussionBoard provisioned $\rightarrow$ Add Milestone.
- **Workflow C:** Create Task $\rightarrow$ Assign to Member $\rightarrow$ Drag from "To Do" to "In Progress" to "Completed" $\rightarrow$ Dynamic mathematical Project Progress update (`Math.round((completedTasks/totalTasks)*100)`).
- **Workflow D:** Create Personal Event $\rightarrow$ Display in Month/Week/Day Calendar $\rightarrow$ Configure Reminder $\rightarrow$ Verify privacy isolation.
- **Workflow E:** Schedule Meeting $\rightarrow$ Propagate to Team Shared Calendar $\rightarrow$ Background scheduler emits notifications to participants.
- **Workflow F:** Open Project Discussion Board $\rightarrow$ Team Leader publishes Pinned Announcement $\rightarrow$ Role restriction prevents standard members from pinning.
- **Workflow G:** Complete remaining tasks $\rightarrow$ Project Progress updates to 100% $\rightarrow$ Generate Progress, Task Completion, and Usage Reports from stored PostgreSQL entities.

---

## 7. Database Backup & Recovery

### Automated Database Backup (`pg_dump`)
```bash
pg_dump -U postgres -d syncsphere_db -F c -b -v -f "./backups/syncsphere_$(date +%Y%m%d_%H%M%S).dump"
```

### Database Recovery (`pg_restore`)
```bash
pg_restore -U postgres -d syncsphere_db -v -c "./backups/syncsphere_backup.dump"
```
