# Software Requirements Specification (SRS)
## SyncSphere — Collaborative Schedule & Project Management System

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** October 2026  
**System Architecture:** Layered REST API (Express.js) + Decoupled SPA (React / Vite) + PostgreSQL (Prisma ORM)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the formal functional and non-functional requirements for **SyncSphere**, a deterministic full-stack web application designed for personal schedule organization, collaborative team management, Kanban task tracking, shared calendar aggregation, meeting coordination, and data-driven reporting.

### 1.2 Scope and Boundaries
SyncSphere is strictly a deterministic, non-AI application. The system boundary explicitly enforces:
- **No Artificial Intelligence / LLMs:** No dependencies on OpenAI, Google Gemini, Anthropic, or external machine learning APIs.
- **No Third-Party Calendar Sync:** Operates independently without external sync to Google Calendar, Microsoft Outlook, or Apple iCal.
- **No Real-Time Live Chat or WebRTC:** Real-time communications are strictly organized through structured Discussion Boards, Announcement feeds, and Task comment threads.
- **No Payments or Monetization:** No payment gateway integrations.
- **No Third-Party BaaS Lock-In:** Strictly self-hosted PostgreSQL via Prisma ORM; no Firebase, Supabase, or proprietary cloud datastores.

### 1.3 Definitions, Acronyms, and Abbreviations
- **RBAC:** Role-Based Access Control.
- **MVC:** Model-View-Controller architectural pattern.
- **SPA:** Single Page Application.
- **ORM:** Object-Relational Mapping (Prisma).
- **MIME:** Multipurpose Internet Mail Extensions.
- **UML:** Unified Modeling Language.

---

## 2. Overall Description

### 2.1 Product Perspective
SyncSphere functions as an autonomous, self-contained multi-tenant web application. The frontend communicates with the backend exclusively via RESTful JSON APIs protected by secure, HTTP-only session cookies.

```text
[ Client Browser (React + Vite) ]
             │ (HTTPS / HTTP-only Cookies)
             ▼
[ Express.js REST API Server ]
    ├── Authentication & RBAC Middleware
    ├── Multer File Upload Interceptor (Disk Storage)
    ├── Domain Services (Auth, Team, Project, Task, Calendar, Meeting, etc.)
    └── Reminder Scheduler (Autonomous Background Poller)
             │
             ▼ (Prisma ORM / Connection Pool)
[ PostgreSQL Relational Database ]
```

### 2.2 User Classes and Roles
The system enforces three primary roles, both at application scope and team-specific context:

| Role | Permissions & Operational Scope |
| :--- | :--- |
| **Admin** | System-wide visibility: Manages user accounts (activate/deactivate, role escalation), views platform usage analytics and aggregate system reports. |
| **Team Leader** | Team-level administrator: Creates and manages teams, invites/removes members, assigns roles, creates projects, sets milestones, creates and assigns tasks, publishes announcements. |
| **Team Member** | Contributor: Joins teams via invitations, views assigned tasks, updates task progress (Kanban drag-and-drop), uploads task attachments, posts comments, participates in meetings and discussions. |

All users also have an implicit **Personal User** role enabling private calendar events and personal profile management.

---

## 3. System Features & Module Specifications

### 3.1 Module 1 — User Management & Authentication
- **REQ-1.1 Registration:** Users register with `name`, valid RFC 5322 `email`, and strong `password` (minimum 8 characters).
- **REQ-1.2 Password Hashing:** Passwords must be hashed using `bcrypt` with 12 salt rounds before database persistence.
- **REQ-1.3 Session Security:** Successful authentication issues an HTTP-only, secure, `SameSite=Lax` session cookie. Plaintext passwords or session secrets must never be exposed.
- **REQ-1.4 Profile Management:** Users can view and update their profile details (`name`, `bio`, `avatarUrl`) and change passwords upon verifying current password.
- **REQ-1.5 Password Reset:** Self-service password reset via cryptographically secure reset token sent via email notification.

### 3.2 Module 2 — Team Management
- **REQ-2.1 Team Creation:** Any authenticated user can create a Team, automatically becoming its `Team Leader`.
- **REQ-2.2 Automated Calendar Provisioning:** Creating a Team automatically initializes its associated `SharedCalendar` record in a transactional guarantee.
- **REQ-2.3 Membership Lifecycle:** Team Leaders can invite registered users by email, add members, update roles (`LEADER` or `MEMBER`), and remove members.
- **REQ-2.4 Multi-Team Support:** Users can belong to multiple teams concurrently.

### 3.3 Module 3 — Project Management & Milestones
- **REQ-3.1 Scoped Projects:** Projects belong strictly to a Team. Non-team members cannot view or modify team projects.
- **REQ-3.2 Lifecycle & Status:** Projects track `title`, `description`, `deadline`, and `status` (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`).
- **REQ-3.3 Automated Discussion Board:** Creating a Project automatically initializes an associated `DiscussionBoard` 1:1 entity.
- **REQ-3.4 Milestones:** Projects contain zero or more Milestones with `title` and `dueDate`.
- **REQ-3.5 Empirical Progress Calculation:** `project.progress` (0–100%) is dynamically calculated as:
  $$\text{Progress} = \text{round}\left( \frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100 \right)$$
  *(Falls back to completed milestones ratio if no tasks exist).*

### 3.4 Module 4 — Task Management & Kanban Board
- **REQ-4.1 Task Structure:** Tasks require `title`, `description`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `dueDate`, and `status`.
- **REQ-4.2 Kanban Board:** Interactive board supporting three core stages:
  $$\text{To Do} \longrightarrow \text{In Progress} \longrightarrow \text{Completed}$$
- **REQ-4.3 Persistence on Transition:** Moving a card updates the task `status` in PostgreSQL via REST API and triggers empirical project progress re-calculation.
- **REQ-4.4 Multi-Assignee:** Tasks can be assigned to multiple Team Members.
- **REQ-4.5 Comments & Attachments:** Tasks support timestamped comments and authenticated file uploads (max 10MB, strictly validating MIME types against PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, ZIP).

### 3.5 Module 5 — Personal Scheduling
- **REQ-5.1 Personal Events:** Private user events with `title`, `description`, `startTime`, `endTime`, and optional `recurring` flag.
- **REQ-5.2 Calendar Views:** Interactive FullCalendar rendering in Month, Week, and Day views.
- **REQ-5.3 Privacy Isolation:** Personal events are strictly private to the owner and never visible to other team members.

### 3.6 Module 6 — Shared Team Calendar
- **REQ-6.1 Aggregated Timeline:** Displays team meetings, task due dates, project deadlines, and public team events in a unified calendar.
- **REQ-6.2 Color-Coded Categorization:** Visual distinction between Meetings (Purple), Task Deadlines (Red/Amber), and Project Milestones (Emerald).

### 3.7 Module 7 — Meetings Coordination
- **REQ-7.1 Scheduling:** Meetings record `title`, `description`, `meetingLink` or location, `startTime`, `endTime`, and participant list.
- **REQ-7.2 Participant Synchronization:** Automatically synchronizes into the team's `SharedCalendar` and generates invitations.
- **REQ-7.3 Status Management:** Meetings can be updated or cancelled with automated participant alerts.

### 3.8 Module 8 — Reminders & Notifications
- **REQ-8.1 Autonomous Scheduler:** In-memory background poller running every 60 seconds to inspect upcoming reminders, task deadlines (< 24 hours), and overdue tasks.
- **REQ-8.2 Notification Types:** `TASK_ASSIGNED`, `TASK_DUE_SOON`, `TASK_OVERDUE`, `MEETING_INVITE`, `MEETING_STARTING`, `ANNOUNCEMENT_POSTED`, `PROJECT_UPDATE`.
- **REQ-8.3 State Management:** In-app notification center with read/unread flags, bulk mark-as-read, and badge counters.

### 3.9 Module 9 — Project Communication
- **REQ-9.1 Discussion Board:** 1:1 mapped to each Project for team threads and technical posts.
- **REQ-9.2 Announcements:** Pinned announcements with elevated visibility.
- **REQ-9.3 Authorization:** Only Team Leaders and Admins can pin announcements.

### 3.10 Module 10 — Dashboard & Empirical Reports
- **REQ-10.1 Real Data Enforcement:** All analytics, charts, and metrics are derived strictly from database queries.
- **REQ-10.2 Supported Report Types:**
  - `Progress Report`: Overall completion % per project, active vs completed tasks.
  - `Task Completion Report`: Tasks completed per user, on-time vs overdue ratio.
  - `Usage Report`: Platform activity log, teams count, active sessions, storage consumption.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Concurrency
- **Target Load:** Support up to 500 concurrent users without database pool starvation.
- **Response Latency:** Primary API endpoints respond within $\le 300\text{ ms}$; full dashboard load within $\le 3\text{ seconds}$.
- **Indexing:** B-tree indexes applied to foreign keys, user emails, due dates, and notification recipient IDs.

### 4.2 Security & Compliance
- **Authentication:** Bcrypt 12 rounds; 24-hour expiring sessions; HTTP-only, SameSite cookies.
- **Authorization:** Multi-layered RBAC middleware at controller level.
- **Input Sanitization:** Parameterized queries via Prisma ORM preventing SQL injection.
- **File Security:** Strict filename sanitization and MIME-type verification on uploads.

### 4.3 Availability & Fault Tolerance
- **Target Availability:** 99.0% uptime under standard operational conditions.
- **Resilience:** Uncaught error middleware ensures server remains online during transient operational faults.

---

## 5. Backup & Recovery Specification

### 5.1 Automated Database Dump (`pg_dump`)
```bash
pg_dump -U postgres -d syncsphere_db -F c -b -v -f "./backups/syncsphere_$(date +%Y%m%d_%H%M%S).dump"
```

### 5.2 Database Restoration (`pg_restore`)
```bash
pg_restore -U postgres -d syncsphere_db -v -c "./backups/syncsphere_backup.dump"
```
