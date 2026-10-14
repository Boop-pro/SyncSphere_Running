import prisma from '../config/db.js';

export const getDiscussionBoard = async (projectId, requestingUserId) => {
  const parsedProjectId = parseInt(projectId, 10);
  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    select: { id: true, title: true, teamId: true },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTeamMemberOrAdmin(project.teamId, requestingUserId);

  // Find or automatically create 1:1 DiscussionBoard for project
  let board = await prisma.discussionBoard.findUnique({
    where: { projectId: parsedProjectId },
    include: {
      posts: {
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { timestamp: 'desc' },
        ],
      },
    },
  });

  if (!board) {
    board = await prisma.discussionBoard.create({
      data: { projectId: parsedProjectId },
      include: {
        posts: {
          include: {
            author: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  return {
    boardId: board.id,
    projectId: project.id,
    projectTitle: project.title,
    posts: board.posts,
  };
};

export const createPost = async ({ projectId, title, text, isPinned = false }, authorId) => {
  const parsedProjectId = parseInt(projectId, 10);
  if (!title || !title.trim() || !text || !text.trim()) {
    const error = new Error('Post title and text content are required.');
    error.statusCode = 400;
    throw error;
  }

  const project = await prisma.project.findUnique({
    where: { id: parsedProjectId },
    include: {
      team: {
        include: {
          members: { select: { userId: true, role: true } },
        },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify author is member of team
  const authorMembership = project.team.members.find((m) => m.userId === authorId);
  const authorUser = await prisma.user.findUnique({ where: { id: authorId }, select: { role: true } });

  if (!authorMembership && authorUser?.role !== 'ADMIN') {
    const error = new Error('Access denied. You are not a member of this project team.');
    error.statusCode = 403;
    throw error;
  }

  // Only Team Leaders or Admin can pin announcements
  const canPin = authorMembership?.role === 'TEAM_LEADER' || authorUser?.role === 'ADMIN';
  const shouldPin = Boolean(isPinned && canPin);

  // Ensure DiscussionBoard exists
  let board = await prisma.discussionBoard.findUnique({
    where: { projectId: parsedProjectId },
  });

  if (!board) {
    board = await prisma.discussionBoard.create({
      data: { projectId: parsedProjectId },
    });
  }

  const post = await prisma.announcement.create({
    data: {
      discussionBoardId: board.id,
      authorId,
      title: title.trim(),
      text: text.trim(),
      isPinned: shouldPin,
    },
    include: {
      author: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });

  // Notify team members about announcements
  for (const member of project.team.members) {
    if (member.userId !== authorId) {
      await prisma.notification.create({
        data: {
          recipientId: member.userId,
          type: 'ANNOUNCEMENT',
          message: `${shouldPin ? 'Official Announcement' : 'New Discussion'} in "${project.title}": "${post.title}".`,
        },
      }).catch(() => {});
    }
  }

  return post;
};

export const updatePost = async (postId, updates, requestingUserId) => {
  const parsedPostId = parseInt(postId, 10);
  const post = await prisma.announcement.findUnique({
    where: { id: parsedPostId },
    include: {
      discussionBoard: {
        include: {
          project: { select: { teamId: true } },
        },
      },
    },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const teamId = post.discussionBoard.project.teamId;
  const isAuthor = post.authorId === requestingUserId;

  if (!isAuthor) {
    await verifyTeamLeaderOrAdmin(teamId, requestingUserId);
  }

  const data = {};
  if (updates.title) data.title = updates.title.trim();
  if (updates.text) data.text = updates.text.trim();
  if (typeof updates.isPinned === 'boolean') {
    await verifyTeamLeaderOrAdmin(teamId, requestingUserId);
    data.isPinned = updates.isPinned;
  }

  return await prisma.announcement.update({
    where: { id: parsedPostId },
    data,
    include: {
      author: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
};

export const deletePost = async (postId, requestingUserId) => {
  const parsedPostId = parseInt(postId, 10);
  const post = await prisma.announcement.findUnique({
    where: { id: parsedPostId },
    include: {
      discussionBoard: {
        include: {
          project: { select: { teamId: true } },
        },
      },
    },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const teamId = post.discussionBoard.project.teamId;
  const isAuthor = post.authorId === requestingUserId;

  if (!isAuthor) {
    await verifyTeamLeaderOrAdmin(teamId, requestingUserId);
  }

  await prisma.announcement.delete({
    where: { id: parsedPostId },
  });

  return { success: true };
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
