import * as reportService from '../services/reportService.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await reportService.getDashboardMetrics(req.user.id);
    res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error) {
    next(error);
  }
};

export const getProgressReport = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const report = await reportService.getProgressReport(projectId, req.user.id);
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskCompletionReport = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const report = await reportService.getTaskCompletionReport(projectId, req.user.id);
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamUsageReport = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const report = await reportService.getTeamUsageReport(teamId, req.user.id);
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedReports = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const reports = await reportService.getSavedReports(projectId, req.user.id);
    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
};
