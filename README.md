
# SyncSphere — Collaborative Schedule & Project Management System

**Plan Smarter. Collaborate Better. Achieve Together.**

SyncSphere is a full-stack web application designed to simplify project management, task scheduling, team collaboration, and productivity tracking through a centralized digital workspace.

The platform allows users to organize teams, manage projects, assign tasks, schedule meetings, track milestones, and monitor progress efficiently.

## Live Application

**Website:** https://syncsphere-beige.vercel.app

**Backend API:** https://syncsphere-backend-lqoe.onrender.com

**API Health Check:** https://syncsphere-backend-lqoe.onrender.com/api/v1/health

## Problem Statement

Managing projects, deadlines, meetings, and team activities across multiple applications often leads to communication gaps, scheduling conflicts, missed deadlines, and reduced productivity.

Existing workflows frequently rely on separate tools for task management, calendars, communication, and progress tracking.

SyncSphere addresses these challenges by integrating essential project management and scheduling functionalities into a single collaborative platform.

## Proposed Solution

SyncSphere provides a unified workspace where individuals and teams can:

- Create and manage collaborative teams.
- Organize projects and milestones.
- Assign and monitor tasks.
- Track workflows using Kanban boards.
- Schedule meetings and calendar events.
- Receive notifications and reminders.
- Communicate through discussions and announcements.
- Monitor project performance through reports.

The system improves coordination, accountability, transparency, and productivity.

## Key Features

### 1. User Authentication and Authorization

- User registration and login
- Secure password hashing
- Session-based authentication
- Role-based access control
- User profile management
- Secure logout and session invalidation

### 2. Team Management

- Create and manage teams
- Add team members
- Organize team workspaces
- Manage membership and collaboration
- Coordinate team activities

### 3. Project Management

- Create and manage projects
- Define project milestones
- Track project progress
- Organize project activities
- Monitor project completion

### 4. Task and Kanban Management

- Create and assign tasks
- Set task deadlines
- Update task status
- Track task progress
- Organize workflows through Kanban boards
- Monitor task completion

### 5. Calendar and Scheduling

- Create personal calendar events
- Organize shared schedules
- Schedule meetings
- Track deadlines
- Manage calendar activities

### 6. Notifications and Reminders

- In-app notifications
- Task and deadline reminders
- Activity updates
- Reminder management

### 7. Collaboration and Communication

- Project discussion boards
- Task comments
- Team announcements
- File attachments
- Collaborative communication

### 8. Reports and Analytics

- Dashboard metrics
- Project progress reports
- Task status monitoring
- Performance tracking
- Project activity summaries

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma 5.22.0 |
| Authentication | Database-backed Sessions |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Cloud Database | Neon PostgreSQL |

## System Architecture

```text
                    USERS
                      |
                      v
              React + Vite
                 Frontend
                 (Vercel)
                      |
                      |
                 REST APIs
                      |
                      v
              Node.js + Express
                  Backend
                  (Render)
                      |
                      |
                 Prisma ORM
                      |
                      v
                PostgreSQL
                  (Neon)
```

### Frontend

The React frontend provides interfaces for authentication, team management, project management, task tracking, scheduling, and reporting.

### Backend

The Node.js and Express backend handles application logic, API requests, authentication, authorization, and database communication.

### Database

PostgreSQL stores users, sessions, teams, projects, tasks, milestones, meetings, notifications, and other application data.

### Cloud Infrastructure

The frontend is deployed on Vercel, the backend is hosted on Render, and the PostgreSQL database is managed using Neon.

## Database Design

SyncSphere uses a relational PostgreSQL database with Prisma ORM.

The database contains 19 main tables:

1. User
2. Session
3. Team
4. TeamMember
5. Project
6. Milestone
7. Task
8. TaskAssignee
9. PersonalEvent
10. SharedCalendar
11. Meeting
12. MeetingParticipant
13. Notification
14. Reminder
15. DiscussionBoard
16. Comment
17. FileAttachment
18. Announcement
19. Report

These tables support authentication, team collaboration, project tracking, scheduling, notifications, and reporting.

## Installation and Setup

### Prerequisites

Install the following:

- Node.js
- npm
- PostgreSQL
- Git
- Visual Studio Code or another code editor

### Step 1: Clone the Repository

```bash
git clone https://github.com/Boop-pro/SyncSphere_Running.git
cd SyncSphere_Running/SyncSphere
```

### Step 2: Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory.

Example configuration:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/syncsphere"
SESSION_SECRET="replace-with-a-secure-random-secret"
CLIENT_URL="http://localhost:5173"
```

Replace the placeholder values with your local database credentials and a secure session secret.

### Step 3: Database Configuration

Create a PostgreSQL database named `syncsphere`.

Generate Prisma Client:

```bash
npx prisma generate
```

Initialize the schema for a new development database:

```bash
npx prisma db push
```

### Step 4: Start the Backend

```bash
npm start
```

The backend runs at:

```text
http://localhost:5000
```

### Step 5: Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd SyncSphere/frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Overview

SyncSphere uses REST APIs for communication between the frontend and backend.

Base API URL:

```text
https://syncsphere-backend-lqoe.onrender.com/api/v1
```

The backend provides functionality for:

- Authentication
- User management
- Teams
- Projects
- Milestones
- Tasks
- Calendars
- Meetings
- Notifications
- Discussions
- Reports

### Health Check

```http
GET /api/v1/health
```

Example response:

```json
{
  "status": "healthy",
  "service": "SyncSphere Backend API"
}
```

## Cloud Deployment

### Frontend — Vercel

The React application is deployed using Vercel.

Production URL:

https://syncsphere-beige.vercel.app

### Backend — Render

The Express backend is hosted on Render.

Backend URL:

https://syncsphere-backend-lqoe.onrender.com

### Database — Neon

The application uses Neon PostgreSQL for cloud database hosting.

The production database is configured through secure environment variables.

## Testing and Verification

During cloud deployment, an automated production verification suite reported 29 successful checks out of 29.

### Verified Areas

- Frontend route accessibility
- Backend health check
- User registration
- User login
- Session persistence
- Team creation
- Team member management
- Project creation
- Milestone creation
- Task creation
- Kanban task status updates
- Personal calendar events
- Meeting creation
- Discussion posts
- Dashboard reports
- Project progress reports
- Notification retrieval
- Logout
- Session invalidation

These checks verify selected production workflows and do not represent exhaustive testing of every feature.

## Deployment Limitations

### Render Free Tier

The backend may become inactive after a period of inactivity.

The first request after inactivity may take additional time while the service restarts.

### File Storage

Files stored directly on Render's local filesystem may be lost during restarts or redeployments.

Persistent cloud object storage is recommended for production file attachments.

### Background Reminders

Reminder scheduling depends on the backend process remaining active.

Scheduled reminders may be delayed while a free-tier instance is sleeping.

## Future Enhancements

- Persistent cloud storage for attachments
- Reliable background notification processing
- Email and push notifications
- Real-time team collaboration
- Advanced project analytics
- Calendar synchronization
- Mobile application support
- Enhanced administrator dashboard
- AI-powered task prioritization
- Intelligent scheduling recommendations

## Project Objectives

1. Centralize project and schedule management.
2. Improve collaboration between team members.
3. Simplify task assignment and tracking.
4. Reduce scheduling conflicts.
5. Improve visibility into project progress.
6. Increase productivity through integrated workflows.

## Repository

GitHub:

https://github.com/Boop-pro/SyncSphere_Running

## Project Links

**Live Website:** https://syncsphere-beige.vercel.app

**Backend API:** https://syncsphere-backend-lqoe.onrender.com

**API Health Check:** https://syncsphere-backend-lqoe.onrender.com/api/v1/health

## License

No license has been specified for this project. All rights remain with the repository owner unless a license is added.

---

**SyncSphere — Bringing Teams, Tasks, and Time Together.**
