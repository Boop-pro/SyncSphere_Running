import * as discussionService from '../services/discussionService.js';

export const getDiscussionBoard = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const board = await discussionService.getDiscussionBoard(projectId, req.user.id);

    res.status(200).json({
      success: true,
      board,
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { title, text, isPinned } = req.body;
    const post = await discussionService.createPost(
      { projectId, title, text, isPinned },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Post published successfully.',
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const updated = await discussionService.updatePost(postId, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Post updated.',
      post: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id, 10);
    await discussionService.deletePost(postId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Post removed.',
    });
  } catch (error) {
    next(error);
  }
};
