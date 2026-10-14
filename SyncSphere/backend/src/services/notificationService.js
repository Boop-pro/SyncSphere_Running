import prisma from '../config/db.js';

export const createReminder = async ({ taskId, meetingId, triggerTime }, userId) => {
  if (!triggerTime) {
    const error = new Error('Reminder trigger time is required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedTaskId = taskId ? parseInt(taskId, 10) : null;
  const parsedMeetingId = meetingId ? parseInt(meetingId, 10) : null;

  return await prisma.reminder.create({
    data: {
      userId,
      taskId: parsedTaskId,
      meetingId: parsedMeetingId,
      triggerTime: new Date(triggerTime),
      isTriggered: false,
    },
    include: {
      task: { select: { title: true } },
      meeting: { select: { title: true } },
    },
  });
};

export const getUserNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const markNotificationRead = async (notificationId, userId) => {
  const parsedId = parseInt(notificationId, 10);
  return await prisma.notification.updateMany({
    where: {
      id: parsedId,
      recipientId: userId,
    },
    data: { read: true },
  });
};

export const markAllNotificationsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
};

export const deleteNotification = async (notificationId, userId) => {
  const parsedId = parseInt(notificationId, 10);
  return await prisma.notification.deleteMany({
    where: {
      id: parsedId,
      recipientId: userId,
    },
  });
};

// Background processor executing scheduled reminder checks and automated deadline alerts
export const processPendingReminders = async () => {
  const now = new Date();

  // 1. Process explicit user-configured reminders
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      isTriggered: false,
      triggerTime: { lte: now },
    },
    include: {
      task: { select: { title: true } },
      meeting: { select: { title: true } },
    },
  });

  for (const reminder of pendingReminders) {
    let message = 'You have a scheduled reminder.';
    let type = 'TASK_REMINDER';

    if (reminder.task) {
      type = 'TASK_REMINDER';
      message = `Task Reminder: "${reminder.task.title}" is scheduled for review.`;
    } else if (reminder.meeting) {
      type = 'MEETING_REMINDER';
      message = `Meeting Reminder: "${reminder.meeting.title}" is starting soon.`;
    }

    await prisma.$transaction([
      prisma.notification.create({
        data: {
          recipientId: reminder.userId,
          reminderId: reminder.id,
          type,
          message,
        },
      }),
      prisma.reminder.update({
        where: { id: reminder.id },
        data: { isTriggered: true },
      }),
    ]).catch((err) => console.warn('[Reminder Error]', err.message));
  }

  // 2. Automated Deadline Alerts (Tasks due within the next 24 hours)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingTasks = await prisma.task.findMany({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: {
        gte: now,
        lte: tomorrow,
      },
    },
    include: {
      assignees: { select: { userId: true } },
    },
  });

  for (const task of upcomingTasks) {
    for (const assignee of task.assignees) {
      // Check if alert already sent in the last 24h
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: assignee.userId,
          type: 'DEADLINE_ALERT',
          message: { contains: task.title },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            recipientId: assignee.userId,
            type: 'DEADLINE_ALERT',
            message: `Deadline Alert: Task "${task.title}" is due on ${task.dueDate.toLocaleDateString()}.`,
          },
        }).catch(() => {});
      }
    }
  }

  // 3. Automated Overdue Task Alerts
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: { lt: now },
    },
    include: {
      assignees: { select: { userId: true } },
    },
  });

  for (const task of overdueTasks) {
    for (const assignee of task.assignees) {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: assignee.userId,
          type: 'OVERDUE_ALERT',
          message: { contains: task.title },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            recipientId: assignee.userId,
            type: 'OVERDUE_ALERT',
            message: `Overdue Task Alert: Task "${task.title}" was due on ${task.dueDate.toLocaleDateString()} and remains pending.`,
          },
        }).catch(() => {});
      }
    }
  }
};
