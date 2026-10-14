import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

export const createTask = async (
  { projectId, title, desc, priority = 'MEDIUM', dueDate, assigneeIds = [] },
  requestingUserId
) => {
  const parsedProjectId = parseInt(projectId, 10);
  if (!parsedProjectId || !title || !title.trim() || !dueDate) {
    const error = new Error('Project ID, title, and due date are required.');
    error.statusCode = 400;
    throw error;
  }

  // Verify access to project and team
  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: { id: true, teamId: true, title: true },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(project.teamId, requestingUserId);

  return await prisma.$transaction(async (tx) => {
    // 1. Create Task
    const task = await tx.task.create({
      data: {
        projectId: parsedProjectId,
        title: title.trim(),
        desc: desc ? desc.trim() : '',
        priority: priority || 'MEDIUM',
        dueDate: new Date(dueDate),
        status: 'TO_DO',
      },
    });

    // 2. Assign members if provided
    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      const parsedIds = assigneeIds.map((id) => parseInt(id, 10)).filter(Boolean);
      for (const userId of parsedIds) {
        await tx.taskAssignee.create({
          data: {
            taskId: task.id,
            userId,
          },
        });

        // Generate in-app task assignment notification
        await tx.notification.create({
          data: {
            recipientId: userId,
            type: 'TASK_ASSIGNMENT',
            message: `You were assigned to task: "${task.title}" in project "${project.title}".`,
          },
        }).catch(() => {});
      }
    }

    // 3. Recalculate project progress
    await recalculateProjectProgress(tx, parsedProjectId);

    return task;
  });
};

export const getTasks = async (projectId, requestingUserId) => {
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

  await verifyTeamMemberOrLeader(project.teamId, requestingUserId);

  return await prisma.task.findMany({
    where: { projectId: parsedProjectId },
    include: {
      assignees: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
      comments: {
        include: {
          author: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { timestamp: 'asc' },
      },
      files: {
        include: {
          uploader: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
      _count: {
        select: {
          comments: true,
          files: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTaskById = async (taskId, requestingUserId) => {
  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: {
      project: {
        select: { id: true, title: true, teamId: true },
      },
      assignees: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
      comments: {
        include: {
          author: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { timestamp: 'asc' },
      },
      files: {
        include: {
          uploader: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, requestingUserId);

  return task;
};

export const updateTask = async (taskId, updates, requestingUserId) => {
  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: { project: { select: { id: true, teamId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, requestingUserId);

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.desc !== undefined) data.desc = updates.desc ? updates.desc.trim() : '';
  if (updates.priority) data.priority = updates.priority;
  if (updates.dueDate) data.dueDate = new Date(updates.dueDate);
  if (updates.status) {
    data.status = updates.status;
    data.completedAt = updates.status === 'COMPLETED' ? new Date() : null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: parsedTaskId },
    data,
  });

  // If assignees were modified
  if (Array.isArray(updates.assigneeIds)) {
    const newIds = updates.assigneeIds.map((id) => parseInt(id, 10)).filter(Boolean);
    // Remove existing
    await prisma.taskAssignee.deleteMany({ where: { taskId: parsedTaskId } });
    // Add new
    for (const userId of newIds) {
      await prisma.taskAssignee.create({
        data: { taskId: parsedTaskId, userId },
      });
    }
  }

  // Recalculate project progress
  await recalculateProjectProgress(prisma, task.project.id);

  return updatedTask;
};

export const updateTaskStatus = async (taskId, newStatus, requestingUserId) => {
  if (!['TO_DO', 'IN_PROGRESS', 'COMPLETED'].includes(newStatus)) {
    const error = new Error('Invalid status. Allowed values: TO_DO, IN_PROGRESS, COMPLETED.');
    error.statusCode = 400;
    throw error;
  }

  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: { project: { select: { id: true, teamId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, requestingUserId);

  const updatedTask = await prisma.task.update({
    where: { id: parsedTaskId },
    data: {
      status: newStatus,
      completedAt: newStatus === 'COMPLETED' ? new Date() : null,
    },
    include: {
      assignees: {
        include: {
          user: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  // Automatically recalculate project progress in PostgreSQL
  await recalculateProjectProgress(prisma, task.project.id);

  return updatedTask;
};

export const deleteTask = async (taskId, requestingUserId) => {
  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: { project: { select: { id: true, teamId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, requestingUserId);

  await prisma.task.delete({
    where: { id: parsedTaskId },
  });

  await recalculateProjectProgress(prisma, task.project.id);

  return { success: true };
};

// Comments
export const addTaskComment = async (taskId, text, authorId) => {
  if (!text || !text.trim()) {
    const error = new Error('Comment text is required.');
    error.statusCode = 400;
    throw error;
  }

  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: { project: { select: { teamId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, authorId);

  return await prisma.comment.create({
    data: {
      taskId: parsedTaskId,
      authorId,
      text: text.trim(),
    },
    include: {
      author: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
};

// File Attachments
export const addTaskAttachment = async (taskId, file, uploaderId) => {
  if (!file) {
    const error = new Error('File payload is missing.');
    error.statusCode = 400;
    throw error;
  }

  const parsedTaskId = parseInt(taskId, 10);
  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    include: { project: { select: { teamId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(task.project.teamId, uploaderId);

  const fileUrl = `/uploads/${file.filename}`;

  return await prisma.fileAttachment.create({
    data: {
      taskId: parsedTaskId,
      uploaderId,
      filename: file.originalname,
      url: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
    include: {
      uploader: {
        select: { id: true, fullName: true },
      },
    },
  });
};

export const deleteTaskAttachment = async (attachmentId, requestingUserId) => {
  const parsedId = parseInt(attachmentId, 10);
  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: parsedId },
    include: {
      task: {
        include: {
          project: { select: { teamId: true } },
        },
      },
    },
  });

  if (!attachment) {
    const error = new Error('Attachment not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrLeader(attachment.task.project.teamId, requestingUserId);

  // Remove from database
  await prisma.fileAttachment.delete({ where: { id: parsedId } });

  // Unlink file from local disk storage
  const filename = path.basename(attachment.url);
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { success: true };
};

// Recalculates and updates project.progress
const recalculateProjectProgress = async (client, projectId) => {
  const project = await client.project.findUnique({
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

  await client.project.update({
    where: { id: projectId },
    data: { progress },
  });
};

const verifyTeamMemberOrLeader = async (teamId, userId) => {
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
    const error = new Error('Access denied. You are not a member of the project team.');
    error.statusCode = 403;
    throw error;
  }

  return true;
};
