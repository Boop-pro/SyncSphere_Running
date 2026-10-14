import prisma from '../config/db.js';

export const createMeeting = async (
  { teamId, title, description, dateTime, durationMinutes = 60, participantUserIds = [] },
  organizerId
) => {
  const parsedTeamId = parseInt(teamId, 10);
  if (!parsedTeamId || !title || !title.trim() || !dateTime) {
    const error = new Error('Team ID, title, and date/time are required.');
    error.statusCode = 400;
    throw error;
  }

  // Verify caller belongs to team or is Admin
  await verifyTeamMember(parsedTeamId, organizerId);

  // Find team's SharedCalendar
  const sharedCal = await prisma.sharedCalendar.findUnique({
    where: { teamId: parsedTeamId },
  });

  return await prisma.$transaction(async (tx) => {
    // 1. Create Meeting
    const meeting = await tx.meeting.create({
      data: {
        teamId: parsedTeamId,
        organizerId,
        sharedCalendarId: sharedCal ? sharedCal.id : null,
        title: title.trim(),
        description: description ? description.trim() : null,
        dateTime: new Date(dateTime),
        durationMinutes: parseInt(durationMinutes, 10) || 60,
      },
    });

    // 2. Add organizer as participant
    const uniqueParticipants = Array.from(
      new Set([organizerId, ...participantUserIds.map((id) => parseInt(id, 10))])
    ).filter(Boolean);

    for (const userId of uniqueParticipants) {
      await tx.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId,
          status: userId === organizerId ? 'ACCEPTED' : 'INVITED',
        },
      });

      // 3. Notify participants (except organizer)
      if (userId !== organizerId) {
        await tx.notification.create({
          data: {
            recipientId: userId,
            type: 'MEETING_REMINDER',
            message: `You were invited to team meeting: "${meeting.title}" on ${new Date(meeting.dateTime).toLocaleString()}.`,
          },
        }).catch(() => {});
      }

      // 4. Create an automatic Reminder record 15 minutes before meeting start
      const triggerTime = new Date(new Date(dateTime).getTime() - 15 * 60 * 1000);
      if (triggerTime > new Date()) {
        await tx.reminder.create({
          data: {
            userId,
            meetingId: meeting.id,
            triggerTime,
          },
        }).catch(() => {});
      }
    }

    return meeting;
  });
};

export const getMeetings = async (teamId, requestingUserId) => {
  const parsedTeamId = parseInt(teamId, 10);
  await verifyTeamMember(parsedTeamId, requestingUserId);

  return await prisma.meeting.findMany({
    where: { teamId: parsedTeamId },
    include: {
      organizer: {
        select: { id: true, fullName: true, email: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: { dateTime: 'desc' },
  });
};

export const updateMeeting = async (meetingId, updates, requestingUserId) => {
  const parsedMeetingId = parseInt(meetingId, 10);
  const meeting = await prisma.meeting.findUnique({
    where: { id: parsedMeetingId },
    select: { organizerId: true, teamId: true },
  });

  if (!meeting) {
    const error = new Error('Meeting not found.');
    error.statusCode = 404;
    throw error;
  }

  // Only organizer or Admin / Team Leader can update
  if (meeting.organizerId !== requestingUserId) {
    await verifyTeamLeaderOrAdmin(meeting.teamId, requestingUserId);
  }

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.description !== undefined) data.description = updates.description ? updates.description.trim() : null;
  if (updates.dateTime) data.dateTime = new Date(updates.dateTime);
  if (updates.durationMinutes) data.durationMinutes = parseInt(updates.durationMinutes, 10);

  return await prisma.meeting.update({
    where: { id: parsedMeetingId },
    data,
  });
};

export const cancelMeeting = async (meetingId, requestingUserId) => {
  const parsedMeetingId = parseInt(meetingId, 10);
  const meeting = await prisma.meeting.findUnique({
    where: { id: parsedMeetingId },
    include: {
      participants: { select: { userId: true } },
    },
  });

  if (!meeting) {
    const error = new Error('Meeting not found.');
    error.statusCode = 404;
    throw error;
  }

  if (meeting.organizerId !== requestingUserId) {
    await verifyTeamLeaderOrAdmin(meeting.teamId, requestingUserId);
  }

  // Notify participants of cancellation
  for (const p of meeting.participants) {
    if (p.userId !== requestingUserId) {
      await prisma.notification.create({
        data: {
          recipientId: p.userId,
          type: 'MEETING_REMINDER',
          message: `The meeting "${meeting.title}" originally scheduled for ${new Date(meeting.dateTime).toLocaleString()} has been cancelled.`,
        },
      }).catch(() => {});
    }
  }

  // Remove meeting record (cascading participants & reminders)
  await prisma.meeting.delete({
    where: { id: parsedMeetingId },
  });

  return { success: true };
};

const verifyTeamMember = async (teamId, userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMIN') return true;

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!membership) {
    const error = new Error('Access denied. You are not a member of this team.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

const verifyTeamLeaderOrAdmin = async (teamId, userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMIN') return true;

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!membership || membership.role !== 'TEAM_LEADER') {
    const error = new Error('Access denied. Team Leader privileges required.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};
