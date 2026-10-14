import prisma from '../config/db.js';

export const getDashboardMetrics = async (userId) => {
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 1. User active teams count
  const activeTeamsCount = await prisma.teamMember.count({
    where: { userId },
  });

  // 2. User assigned tasks counts
  const assignedTasks = await prisma.taskAssignee.findMany({
    where: { userId },
    include: {
      task: {
        select: {
          id: true,
          status: true,
          dueDate: true,
          title: true,
          project: { select: { title: true } },
        },
      },
    },
  });

  const pendingTasksCount = assignedTasks.filter(
    (a) => a.task.status === 'TO_DO' || a.task.status === 'IN_PROGRESS'
  ).length;

  const completedTasksCount = assignedTasks.filter(
    (a) => a.task.status === 'COMPLETED'
  ).length;

  const upcomingDeadlinesCount = assignedTasks.filter(
    (a) =>
      a.task.status !== 'COMPLETED' &&
      new Date(a.task.dueDate) >= now &&
      new Date(a.task.dueDate) <= in48Hours
  ).length;

  // 3. Active projects overview for user's teams
  const userMemberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = userMemberships.map((m) => m.teamId);

  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      progress: true,
      deadline: true,
      team: { select: { name: true } },
    },
  });

  // 4. Upcoming meetings
  const upcomingMeetings = await prisma.meetingParticipant.findMany({
    where: {
      userId,
      meeting: {
        dateTime: { gte: now },
      },
    },
    take: 3,
    orderBy: { meeting: { dateTime: 'asc' } },
    include: {
      meeting: {
        select: {
          id: true,
          title: true,
          dateTime: true,
          durationMinutes: true,
          team: { select: { name: true } },
        },
      },
    },
  });

  return {
    activeTeamsCount,
    pendingTasksCount,
    completedTasksCount,
    upcomingDeadlinesCount,
    projects,
    upcomingMeetings: upcomingMeetings.map((p) => p.meeting),
  };
};

export const getProgressReport = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    include: {
      team: { select: { id: true, name: true } },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
        },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrAdmin(project.team.id, requestingUserId);

  const totalTasks = project.tasks.length;
  const todoTasks = project.tasks.filter((t) => t.status === 'TO_DO').length;
  const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter((m) => m.completed).length;

  let progress = 0;
  if (totalTasks > 0) {
    progress = Math.round((completedTasks / totalTasks) * 100);
  } else if (totalMilestones > 0) {
    progress = Math.round((completedMilestones / totalMilestones) * 100);
  }

  const reportPayload = {
    projectId: project.id,
    projectTitle: project.title,
    teamName: project.team.name,
    deadline: project.deadline,
    status: project.status,
    progress,
    tasksDistribution: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
    },
    milestonesSummary: {
      total: totalMilestones,
      completed: completedMilestones,
      pending: totalMilestones - completedMilestones,
      list: project.milestones,
    },
    generatedAt: new Date(),
  };

  // Persist snapshot in Report entity
  await prisma.report.create({
    data: {
      projectId: project.id,
      type: 'PROGRESS',
      data: JSON.stringify(reportPayload),
    },
  });

  return reportPayload;
};

export const getTaskCompletionReport = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      },
      tasks: {
        include: {
          assignees: { select: { userId: true } },
        },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrAdmin(project.team.id, requestingUserId);

  // Compute metrics per team member
  const memberStats = project.team.members.map((member) => {
    const memberTasks = project.tasks.filter((task) =>
      task.assignees.some((a) => a.userId === member.user.id)
    );

    const total = memberTasks.length;
    const completed = memberTasks.filter((t) => t.status === 'COMPLETED').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      userId: member.user.id,
      fullName: member.user.fullName,
      email: member.user.email,
      role: member.role,
      totalAssigned: total,
      completed,
      pending,
      completionRate: rate,
    };
  });

  const reportPayload = {
    projectId: project.id,
    projectTitle: project.title,
    totalProjectTasks: project.tasks.length,
    memberStats,
    generatedAt: new Date(),
  };

  // Persist snapshot in Report entity
  await prisma.report.create({
    data: {
      projectId: project.id,
      type: 'TASK_COMPLETION',
      data: JSON.stringify(reportPayload),
    },
  });

  return reportPayload;
};

export const getTeamUsageReport = async (teamId, requestingUserId) => {
  const parsedTeamId = parseInt(teamId, 10);
  await verifyTeamMemberOrAdmin(parsedTeamId, requestingUserId);

  const team = await prisma.team.findUnique({
    where: { id: parsedTeamId },
    include: {
      projects: {
        include: {
          tasks: { select: { id: true, status: true, title: true, completedAt: true } },
          discussionBoard: {
            include: {
              posts: { select: { id: true, title: true, timestamp: true } },
            },
          },
        },
      },
      meetings: {
        select: { id: true, title: true, dateTime: true },
        orderBy: { dateTime: 'desc' },
      },
      members: { select: { id: true } },
    },
  });

  if (!team) {
    const error = new Error('Team not found.');
    error.statusCode = 404;
    throw error;
  }

  // Aggregate metrics
  let totalTasks = 0;
  let completedTasks = 0;
  const recentActivities = [];

  for (const proj of team.projects) {
    totalTasks += proj.tasks.length;
    completedTasks += proj.tasks.filter((t) => t.status === 'COMPLETED').length;

    // Extract recent completed tasks
    for (const t of proj.tasks) {
      if (t.completedAt) {
        recentActivities.push({
          type: 'TASK_COMPLETED',
          title: `Task completed: "${t.title}" (${proj.title})`,
          timestamp: t.completedAt,
        });
      }
    }

    // Extract discussion posts
    if (proj.discussionBoard) {
      for (const p of proj.discussionBoard.posts) {
        recentActivities.push({
          type: 'ANNOUNCEMENT_POSTED',
          title: `Announcement published: "${p.title}" (${proj.title})`,
          timestamp: p.timestamp,
        });
      }
    }
  }

  // Extract scheduled meetings
  for (const m of team.meetings) {
    recentActivities.push({
      type: 'MEETING_SCHEDULED',
      title: `Meeting organized: "${m.title}"`,
      timestamp: m.dateTime,
    });
  }

  // Sort activities newest first
  recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const reportPayload = {
    teamId: team.id,
    teamName: team.name,
    totalMembers: team.members.length,
    totalProjects: team.projects.length,
    totalTasks,
    completedTasks,
    totalMeetings: team.meetings.length,
    recentActivities: recentActivities.slice(0, 15),
    generatedAt: new Date(),
  };

  // If team has projects, save snapshot under first project
  if (team.projects.length > 0) {
    await prisma.report.create({
      data: {
        projectId: team.projects[0].id,
        type: 'USAGE',
        data: JSON.stringify(reportPayload),
      },
    }).catch(() => {});
  }

  return reportPayload;
};

export const getSavedReports = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: { teamId: true },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrAdmin(project.teamId, requestingUserId);

  return await prisma.report.findMany({
    where: { projectId: parsedProjectId },
    orderBy: { generated: 'desc' },
    take: 20,
  });
};

const verifyTeamMemberOrAdmin = async (teamId, userId) => {
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
