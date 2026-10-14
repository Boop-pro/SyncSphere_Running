import * as projectService from '../services/projectService.js';

export const createProject = async (req, res, next) => {
  try {
    const { teamId, title, desc, deadline, status } = req.body;
    const project = await projectService.createProject(
      { teamId, title, desc, deadline, status },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'teamId query parameter is required.' });
    }

    const projects = await projectService.getProjects(teamId, req.user.id);
    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await projectService.getProjectById(projectId, req.user.id);

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const updated = await projectService.updateProject(projectId, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    await projectService.deleteProject(projectId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Milestones
export const createMilestone = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { title, dueDate } = req.body;
    const milestone = await projectService.createMilestone(
      projectId,
      { title, dueDate },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully.',
      milestone,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const updated = await projectService.updateMilestone(
      milestoneId,
      req.body,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Milestone updated successfully.',
      milestone: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMilestone = async (req, res, next) => {
  try {
    const milestoneId = parseInt(req.params.milestoneId, 10);
    await projectService.deleteMilestone(milestoneId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
