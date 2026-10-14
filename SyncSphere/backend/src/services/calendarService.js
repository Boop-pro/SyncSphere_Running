import prisma from '../config/db.js';

export const createPersonalEvent = async (
  { title, description, date, endDate, recurring = false, recurrenceRule, shareWithTeamId },
  userId
) => {
  if (!title || !title.trim() || !date) {
    const error = new Error('Event title and date are required.');
    error.statusCode = 400;
    throw error;
  }

  let sharedCalendarId = null;

  // If user chooses to share this event on a team's shared calendar
  if (shareWithTeamId) {
    const teamId = parseInt(shareWithTeamId, 10);
    const sharedCal = await prisma.sharedCalendar.findUnique({
      where: { teamId },
    });
    if (sharedCal) {
      sharedCalendarId = sharedCal.id;
    }
  }

  return await prisma.personalEvent.create({
    data: {
      userId,
      sharedCalendarId,
      title: title.trim(),
      description: description ? description.trim() : null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      recurring: Boolean(recurring),
      recurrenceRule: recurring ? recurrenceRule || 'WEEKLY' : null,
    },
  });
};

export const getPersonalEvents = async (userId) => {
  return await prisma.personalEvent.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

export const updatePersonalEvent = async (eventId, updates, userId) => {
  const parsedId = parseInt(eventId, 10);
  const event = await prisma.personalEvent.findUnique({
    where: { id: parsedId },
  });

  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  if (event.userId !== userId) {
    const error = new Error('Access denied. You can only update your own events.');
    error.statusCode = 403;
    throw error;
  }

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.description !== undefined) data.description = updates.description ? updates.description.trim() : null;
  if (updates.date) data.date = new Date(updates.date);
  if (updates.endDate !== undefined) data.endDate = updates.endDate ? new Date(updates.endDate) : null;
  if (typeof updates.recurring === 'boolean') {
    data.recurring = updates.recurring;
    data.recurrenceRule = updates.recurring ? updates.recurrenceRule || 'WEEKLY' : null;
  }

  return await prisma.personalEvent.update({
    where: { id: parsedId },
    data,
  });
};

export const deletePersonalEvent = async (eventId, userId) => {
  const parsedId = parseInt(eventId, 10);
  const event = await prisma.personalEvent.findUnique({
    where: { id: parsedId },
  });

  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  if (event.userId !== userId) {
    const error = new Error('Access denied. You can only delete your own events.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.personalEvent.delete({
    where: { id: parsedId },
  });

  return { success: true };
};

// Module 6: Aggregated Shared Calendar Events
export const getSharedCalendarEvents = async (teamId, userId) => {
  const parsedTeamId = parseInt(teamId, 10);

  // 1. Verify user is a member of this team or system Admin
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: parsedTeamId,
        },
      },
    });

    if (!membership) {
      const error = new Error('Access denied. You are not a member of this team.');
      error.statusCode = 403;
      throw error;
    }
  }

  // 2. Query team's shared calendar
  const sharedCal = await prisma.sharedCalendar.findUnique({
    where: { teamId: parsedTeamId },
  });

  const sharedCalId = sharedCal ? sharedCal.id : null;

  // 3. Aggregate data sources in parallel:
  const [meetings, tasks, milestones, sharedPersonalEvents] = await Promise.all([
    // A. Team Meetings
    prisma.meeting.findMany({
      where: { teamId: parsedTeamId },
      include: {
        organizer: { select: { fullName: true } },
        participants: { include: { user: { select: { fullName: true } } } },
      },
    }),
    // B. Team Task Deadlines (across all projects belonging to this team)
    prisma.task.findMany({
      where: {
        project: { teamId: parsedTeamId },
      },
      include: {
        project: { select: { title: true } },
        assignees: { include: { user: { select: { fullName: true } } } },
      },
    }),
    // C. Team Project Milestones
    prisma.milestone.findMany({
      where: {
        project: { teamId: parsedTeamId },
      },
      include: {
        project: { select: { title: true } },
      },
    }),
    // D. Shared Personal Events linked to this team
    sharedCalId
      ? prisma.personalEvent.findMany({
          where: { sharedCalendarId: sharedCalId },
          include: {
            user: { select: { fullName: true } },
          },
        })
      : [],
  ]);

  // 4. Format into standardized FullCalendar event models with distinct visual categories
  const formattedEvents = [];

  // Meetings (Violet/Purple)
  for (const m of meetings) {
    const start = m.dateTime.toISOString();
    const endDate = new Date(m.dateTime.getTime() + m.durationMinutes * 60000);
    formattedEvents.push({
      id: `meeting-${m.id}`,
      title: `[Meeting] ${m.title}`,
      start,
      end: endDate.toISOString(),
      category: 'MEETING',
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      extendedProps: {
        description: m.description,
        organizer: m.organizer.fullName,
        duration: m.durationMinutes,
        attendees: m.participants.map((p) => p.user.fullName),
      },
    });
  }

  // Task Deadlines (Rose/Red)
  for (const t of tasks) {
    formattedEvents.push({
      id: `task-${t.id}`,
      title: `[Task Due] ${t.title} (${t.status.replace('_', ' ')})`,
      start: t.dueDate.toISOString().split('T')[0],
      allDay: true,
      category: 'TASK_DEADLINE',
      backgroundColor: '#f43f5e',
      borderColor: '#e11d48',
      extendedProps: {
        projectTitle: t.project.title,
        priority: t.priority,
        status: t.status,
        assignees: t.assignees.map((a) => a.user.fullName),
      },
    });
  }

  // Project Milestones (Emerald/Green)
  for (const ms of milestones) {
    formattedEvents.push({
      id: `milestone-${ms.id}`,
      title: `[Milestone] ${ms.title} (${ms.completed ? 'Completed' : 'Pending'})`,
      start: ms.dueDate.toISOString().split('T')[0],
      allDay: true,
      category: 'MILESTONE',
      backgroundColor: '#10b981',
      borderColor: '#059669',
      extendedProps: {
        projectTitle: ms.project.title,
        completed: ms.completed,
      },
    });
  }

  // Team Shared Personal Events (Blue)
  for (const spe of sharedPersonalEvents) {
    formattedEvents.push({
      id: `shared-event-${spe.id}`,
      title: `[Event] ${spe.title} (${spe.user.fullName})`,
      start: spe.date.toISOString(),
      end: spe.endDate ? spe.endDate.toISOString() : undefined,
      category: 'TEAM_EVENT',
      backgroundColor: '#0e8ce9',
      borderColor: '#026fc7',
      extendedProps: {
        description: spe.description,
        creator: spe.user.fullName,
        recurring: spe.recurring,
      },
    });
  }

  return formattedEvents;
};
