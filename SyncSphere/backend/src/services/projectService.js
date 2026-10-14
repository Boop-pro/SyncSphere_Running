import prisma from '../config/db.js';

export const createProject = async ({ teamId, title, desc, deadline, status = 'ACTIVE' }, requestingUserId) => {
  if (!teamId || !title || !desc || !deadline) {
    const error = new Error('Team ID, title, description, and deadline are required.');
    error.statusCode = 400;
    throw error;
  }

  // Ensure caller is Team Leader of teamId or system Admin
  await verifyProjectLeaderOrAdmin(teamId, requestingUserId);

  return await prisma.$transaction(async (tx) => {
    // 1. Create Project
    const project = await tx.project.create({
      data: {
        teamId: parseInt(teamId, 10),
        title: title.trim(),
        desc: desc.trim(),
        deadline: new Date(deadline),
        status: status || 'ACTIVE',
        progress: 0.0,
      },
    });

    // 2. Create 1:1 DiscussionBoard for Project
    await tx.discussionBoard.create({
      data: {
        projectId: project.id,
      },
    });

    return project;
  });
};

export const getProjects = async (teamId, requestingUserId) => {
  const parsedTeamId = parseInt(teamId, 10);

  // Verify membership
  await verifyTeamMembership(parsedTeamId, requestingUserId);

  const projects = await prisma.project.findMany({
    where: { teamId: parsedTeamId },
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          milestones: true,
          tasks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
};

export const getProjectById = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);

  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    include: {
      team: {
        select: { id: true, name: true },
      },
      milestones: {
        orderBy: { dueDate: 'asc' },
      },
      discussionBoard: {
        select: { id: true },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify user is a member of the project's parent team
  await verifyTeamMembership(project.teamId, requestingUserId);

  // Recalculate progress dynamically to ensure strict empirical accuracy
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
  let computedProgress = 0;

  if (totalTasks > 0) {
    computedProgress = Math.round((completedTasks / totalTasks) * 100);
  } else if (project.milestones.length > 0) {
    const completedMilestones = project.milestones.filter((m) => m.completed).length;
    computedProgress = Math.round((completedMilestones / project.milestones.length) * 100);
  }

  if (computedProgress !== project.progress) {
    await prisma.project.update({
      where: { id: parsedProjectId },
      data: { progress: computedProgress },
    });
    project.progress = computedProgress;
  }

  return project;
};

export const updateProject = async (projectId, updates, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const existing = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: { teamId: true },
  });

  if (!existing) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyProjectLeaderOrAdmin(existing.teamId, requestingUserId);

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.desc) data.desc = updates.desc.trim();
  if (updates.deadline) data.deadline = new Date(updates.deadline);
  if (updates.status) data.status = updates.status;

  return await prisma.project.update({
    where: { id: parsedProjectId },
    data,
    include: {
      team: { select: { name: true } },
    },
  });
};

export const deleteProject = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const existing = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: { teamId: true },
  });

  if (!existing) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyProjectLeaderOrAdmin(existing.teamId, requestingUserId);

  await prisma.project.delete({
    where: { id: parsedProjectId },
  });

  return { success: true };
};

// Milestone management
export const createMilestone = async (projectId, { title, dueDate }, requestingUserId) => {
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

  await verifyProjectLeaderOrAdmin(project.teamId, requestingUserId);

  if (!title || !dueDate) {
    const error = new Error('Milestone title and due date are required.');
    error.statusCode = 400;
    throw error;
  }

  const milestone = await prisma.milestone.create({
    data: {
      projectId: parsedProjectId,
      title: title.trim(),
      dueDate: new Date(dueDate),
      completed: false,
    },
  });

  // Re-calculate progress
  await recalculateProgress(parsedProjectId);

  return milestone;
};

export const updateMilestone = async (milestoneId, updates, requestingUserId) => {
  const parsedMilestoneId = parseInt(milestoneId, 10);
  const milestone = await prisma.milestone.findUnique({
    where: { id: parsedMilestoneId },
    include: { project: { select: { id: true, teamId: true } } },
  });

  if (!milestone) {
    const error = new Error('Milestone not found.');
    error.statusCode = 404;
    throw error;
  }

  // Allow members to view/toggle or leader to edit
  await verifyTeamMembership(milestone.project.teamId, requestingUserId);

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.dueDate) data.dueDate = new Date(updates.dueDate);
  if (typeof updates.completed === 'boolean') data.completed = updates.completed;

  const updated = await prisma.milestone.update({
    where: { id: parsedMilestoneId },
    data,
  });

  await recalculateProgress(milestone.project.id);

  return updated;
};

export const deleteMilestone = async (milestoneId, requestingUserId) => {
  const parsedMilestoneId = parseInt(milestoneId, 10);
  const milestone = await prisma.milestone.findUnique({
    where: { id: parsedMilestoneId },
    include: { project: { select: { id: true, teamId: true } } },
  });

  if (!milestone) {
    const error = new Error('Milestone not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyProjectLeaderOrAdmin(milestone.project.teamId, requestingUserId);

  await prisma.milestone.delete({
    where: { id: parsedMilestoneId },
  });

  await recalculateProgress(milestone.project.id);

  return { success: true };
};

// Internal helpers
const recalculateProgress = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { select: { status: true } },
      milestones: { select: { completed: true } },
    },
  });

  if (!project) return;

  let progress = 0;
  if (project.tasks.length > 0) {
    const completed = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    progress = Math.round((completed / project.tasks.length) * 100);
  } else if (project.milestones.length > 0) {
    const completed = project.milestones.filter((m) => m.completed).length;
    progress = Math.round((completed / project.milestones.length) * 100);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
};

const verifyTeamMembership = async (teamId, userId) => {
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
    const error = new Error('Access denied. You are not a member of this project team.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

const verifyProjectLeaderOrAdmin = async (teamId, userId) => {
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
    const error = new Error('Access denied. Team Leader privileges required to manage projects.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};
