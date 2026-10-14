import * as calendarService from '../services/calendarService.js';

export const createPersonalEvent = async (req, res, next) => {
  try {
    const event = await calendarService.createPersonalEvent(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Personal event scheduled.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const getPersonalEvents = async (req, res, next) => {
  try {
    const events = await calendarService.getPersonalEvents(req.user.id);
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const updated = await calendarService.updatePersonalEvent(eventId, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePersonalEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    await calendarService.deletePersonalEvent(eventId, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Event removed.',
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedCalendarEvents = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const events = await calendarService.getSharedCalendarEvents(teamId, req.user.id);
    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
};
