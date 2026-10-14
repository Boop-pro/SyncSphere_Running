import * as taskService from '../services/taskService.js';

export const createTask = async (req, res, next) => {
  try {
    const { projectId, title, desc, priority, dueDate, assigneeIds } = req.body;
    const task = await taskService.createTask(
      { projectId, title, desc, priority, dueDate, assigneeIds },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId query parameter is required.' });
    }

    const tasks = await taskService.getTasks(projectId, req.user.id);
    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await taskService.getTaskById(taskId, req.user.id);

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const updated = await taskService.updateTask(taskId, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const updated = await taskService.updateTaskStatus(taskId, status, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Task status updated.',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    await taskService.deleteTask(taskId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { text } = req.body;
    const comment = await taskService.addTaskComment(taskId, text, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Comment added.',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const attachment = await taskService.addTaskAttachment(taskId, req.file, req.user.id);

    res.status(201).json({
      success: true,
      message: 'File uploaded and attached to task.',
      attachment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId, 10);
    await taskService.deleteTaskAttachment(attachmentId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Attachment removed.',
    });
  } catch (error) {
    next(error);
  }
};
