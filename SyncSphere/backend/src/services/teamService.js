import prisma from '../config/db.js';

export const createTeam = async ({ name, description, creatorId }) => {
  if (!name || !name.trim()) {
    const error = new Error('Team name is required.');
    error.statusCode = 400;
    throw error;
  }

  // Transaction: Create Team, add creator as TEAM_LEADER, and initialize SharedCalendar
  return await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        creatorId,
      },
    });

    // Add creator as TEAM_LEADER
    await tx.teamMember.create({
      data: {
        userId: creatorId,
        teamId: team.id,
        role: 'TEAM_LEADER',
      },
    });

    // Create SharedCalendar entity linked to Team
    await tx.sharedCalendar.create({
      data: {
        teamId: team.id,
      },
    });

    return team;
  });
};

export const getUserTeams = async (userId) => {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          creator: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.team,
    userRole: m.role,
    joinedAt: m.joinedAt,
    membersCount: m.team._count.members,
    projectsCount: m.team._count.projects,
  }));
};

export const getTeamById = async (teamId, userId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      creator: {
        select: { id: true, fullName: true, email: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profile: true,
              role: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          members: true,
          projects: true,
          meetings: true,
        },
      },
    },
  });

  if (!team) {
    const error = new Error('Team not found.');
    error.statusCode = 404;
    throw error;
  }

  // Ensure user is member or system admin
  const isMember = team.members.some((m) => m.userId === userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (!isMember && user?.role !== 'ADMIN') {
    const error = new Error('Access denied. You are not a member of this team.');
    error.statusCode = 403;
    throw error;
  }

  return team;
};

export const addTeamMember = async (teamId, { email, role = 'TEAM_MEMBER' }, requestingUserId) => {
  if (!email) {
    const error = new Error('Registered user email is required.');
    error.statusCode = 400;
    throw error;
  }

  // Verify requesting user is TEAM_LEADER or ADMIN
  await verifyLeaderOrAdmin(teamId, requestingUserId);

  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!targetUser) {
    const error = new Error(`No registered user found with email: ${email}`);
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: targetUser.id,
        teamId,
      },
    },
  });

  if (existingMember) {
    const error = new Error('This user is already a member of this team.');
    error.statusCode = 400;
    throw error;
  }

  const membership = await prisma.teamMember.create({
    data: {
      teamId,
      userId: targetUser.id,
      role: role === 'TEAM_LEADER' ? 'TEAM_LEADER' : 'TEAM_MEMBER',
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true },
      },
      team: {
        select: { name: true },
      },
    },
  });

  // Create an in-app notification for the newly added member
  await prisma.notification.create({
    data: {
      recipientId: targetUser.id,
      type: 'PROJECT_UPDATE',
      message: `You were added to team "${membership.team.name}" as a ${membership.role === 'TEAM_LEADER' ? 'Team Leader' : 'Team Member'}.`,
    },
  }).catch(() => {});

  return membership;
};

export const updateMemberRole = async (teamId, targetUserId, newRole, requestingUserId) => {
  if (!['TEAM_LEADER', 'TEAM_MEMBER'].includes(newRole)) {
    const error = new Error('Role must be either TEAM_LEADER or TEAM_MEMBER.');
    error.statusCode = 400;
    throw error;
  }

  await verifyLeaderOrAdmin(teamId, requestingUserId);

  return await prisma.teamMember.update({
    where: {
      userId_teamId: {
        userId: targetUserId,
        teamId,
      },
    },
    data: { role: newRole },
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
};

export const removeTeamMember = async (teamId, targetUserId, requestingUserId) => {
  // Allow leader/admin to remove others, or allow user to remove self
  if (requestingUserId !== targetUserId) {
    await verifyLeaderOrAdmin(teamId, requestingUserId);
  }

  // Prevent leaving if target is the sole team leader
  const targetMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: targetUserId,
        teamId,
      },
    },
  });

  if (!targetMember) {
    const error = new Error('Membership record not found.');
    error.statusCode = 404;
    throw error;
  }

  if (targetMember.role === 'TEAM_LEADER') {
    const leaderCount = await prisma.teamMember.count({
      where: {
        teamId,
        role: 'TEAM_LEADER',
      },
    });

    if (leaderCount <= 1) {
      const error = new Error(
        'Cannot remove the only Team Leader. Promote another member to Team Leader first.'
      );
      error.statusCode = 400;
      throw error;
    }
  }

  await prisma.teamMember.delete({
    where: {
      userId_teamId: {
        userId: targetUserId,
        teamId,
      },
    },
  });

  return { success: true };
};

export const deleteTeam = async (teamId, requestingUserId) => {
  await verifyLeaderOrAdmin(teamId, requestingUserId);

  await prisma.team.delete({
    where: { id: teamId },
  });

  return { success: true };
};

// Helper function to verify caller privileges
const verifyLeaderOrAdmin = async (teamId, userId) => {
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
