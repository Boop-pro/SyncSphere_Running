import * as teamService from '../services/teamService.js';

export const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const team = await teamService.createTeam({
      name,
      description,
      creatorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      team,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const teams = await teamService.getUserTeams(req.user.id);
    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const team = await teamService.getTeamById(teamId, req.user.id);
    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { email, role } = req.body;
    const member = await teamService.addTeamMember(
      teamId,
      { email, role },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Member added to team successfully.',
      member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const { role } = req.body;
    const updated = await teamService.updateMemberRole(
      teamId,
      targetUserId,
      role,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully.',
      member: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    await teamService.removeTeamMember(teamId, targetUserId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Member removed from team.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    await teamService.deleteTeam(teamId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
