import prisma from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = req.cookies?.syncsphere_session || bearerToken || req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No active session found.',
      });
    }

    // Query session in PostgreSQL database
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            profile: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      res.clearCookie('syncsphere_session');
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Please sign in again.',
      });
    }

    // Check session expiration
    if (new Date() > new Date(session.expiry)) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie('syncsphere_session');
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please sign in again.',
      });
    }

    // Attach verified user and session to request context
    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};
