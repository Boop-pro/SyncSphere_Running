import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';
import { sendPasswordResetEmail } from './emailService.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BCRYPT_SALT_ROUNDS = 12;

export const registerUser = async ({ email, password, fullName, profile }) => {
  if (!email || !password || !fullName) {
    const error = new Error('Email, password, and full name are required.');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // If this is the first user in the system, promote to ADMIN
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      profile: profile || null,
      role,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      profile: true,
      createdAt: true,
    },
  });

  // Create initial session for seamless post-registration login
  const token = uuidv4();
  const expiry = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiry,
    },
  });

  return { user, sessionToken: token, expiry };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Create new session in PostgreSQL
  const token = uuidv4();
  const expiry = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiry,
    },
  });

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    profile: user.profile,
    createdAt: user.createdAt,
  };

  return { user: safeUser, sessionToken: token, expiry };
};

export const logoutUser = async (sessionToken) => {
  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    }).catch(() => {});
  }
};

export const requestPasswordReset = async (email) => {
  if (!email) {
    const error = new Error('Email address is required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    // For security reasons, don't reveal whether user exists
    return { success: true };
  }

  // Generate secure 64-character token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  await sendPasswordResetEmail(user.email, resetToken);

  return { success: true };
};

export const resetPasswordWithToken = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    const error = new Error('Token and new password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    const error = new Error('Invalid or expired password reset verification token.');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  // Invalidate all existing sessions on password change
  await prisma.session.deleteMany({
    where: { userId: user.id },
  }).catch(() => {});

  return { success: true };
};
