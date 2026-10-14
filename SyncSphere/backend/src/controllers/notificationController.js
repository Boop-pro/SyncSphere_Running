import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const { taskId, meetingId, triggerTime } = req.body;
    const reminder = await notificationService.createReminder(
      { taskId, meetingId, triggerTime },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Reminder configured.',
      reminder,
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    await notificationService.markNotificationRead(notificationId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    await notificationService.deleteNotification(notificationId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification dismissed.',
    });
  } catch (error) {
    next(error);
  }
};
