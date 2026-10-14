import prisma from '../config/db.js';

// Guard ensuring the user holds global system ADMIN privileges
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

// Guard ensuring the user is a Team Leader of the specified team
export const requireTeamLeader = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId || req.body.teamId, 10);
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'Team ID required.' });
    }

    if (req.user.role === 'ADMIN') {
      return next(); // System admin bypass
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.user.id,
          teamId,
        },
      },
    });

    if (!membership || membership.role !== 'TEAM_LEADER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Team Leader privileges required for this action.',
      });
    }

    req.teamMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// Guard ensuring the user is an active member or leader of the specified team
export const requireTeamMember = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId || req.body.teamId || req.query.teamId, 10);
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'Team ID required.' });
    }

    if (req.user.role === 'ADMIN') {
      return next(); // System admin bypass
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.user.id,
          teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this team.',
      });
    }

    req.teamMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};
