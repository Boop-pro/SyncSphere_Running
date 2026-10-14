import * as authService from '../services/authService.js';

const COOKIE_NAME = 'syncsphere_session';

const setSessionCookie = (res, token, expiry) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiry,
  });
};

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, profile } = req.body;
    const { user, sessionToken, expiry } = await authService.registerUser({
      email,
      password,
      fullName,
      profile,
    });

    setSessionCookie(res, sessionToken, expiry);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, sessionToken, expiry } = await authService.loginUser({
      email,
      password,
    });

    setSessionCookie(res, sessionToken, expiry);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.headers['x-session-token'];
    await authService.logoutUser(token);
    res.clearCookie(COOKIE_NAME);

    res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a verification reset token has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPasswordWithToken({ token, newPassword });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};
