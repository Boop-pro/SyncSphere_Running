import * as meetingService from '../services/meetingService.js';

export const createMeeting = async (req, res, next) => {
  try {
    const { teamId, title, description, dateTime, durationMinutes, participantUserIds } = req.body;
    const meeting = await meetingService.createMeeting(
      { teamId, title, description, dateTime, durationMinutes, participantUserIds },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully.',
      meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (req, res, next) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'teamId query parameter is required.' });
    }

    const meetings = await meetingService.getMeetings(teamId, req.user.id);
    res.status(200).json({
      success: true,
      meetings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const meetingId = parseInt(req.params.id, 10);
    const updated = await meetingService.updateMeeting(meetingId, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully.',
      meeting: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMeeting = async (req, res, next) => {
  try {
    const meetingId = parseInt(req.params.id, 10);
    await meetingService.cancelMeeting(meetingId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled.',
    });
  } catch (error) {
    next(error);
  }
};
