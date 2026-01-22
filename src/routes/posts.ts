import express from "express";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  patchPost,
  deletePost,
  addComment,
  toggleLike,
  getPostsByAuthor,
} from "../services/postService";
import { PostModel } from "../models/Post";

const router = express.Router();

router.get("/posts", async (req, res, next) => {
  try {
    const post = await getPosts(req.query);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

router.get("/posts/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const result = await getPostById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Invalid post id",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/posts", async (req, res, next) => {
  try {
    const result = await createPost(req.body);
    console.log(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.put("/posts/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const postId = req.params.id;
    const result = await updatePost(id, req.body);

    const post = await PostModel.findById(postId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    if (id !== result.author.toString()) {
      res.status(403).json({
        success: false,
        data: "You are not allowed to modify this post",
      });
    }

    if (!post) return null;

    if (req.body.userId !== post.author.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.patch("/posts/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const postId = req.params.id;
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      const err = new Error("Body не может быть пустым");
      (err as any).status = 400;
      return next(err);
    }

    const result = await patchPost(id, req.body);

    if (!result) {
      const err = new Error("Not Found");
      (err as any).status = 400;
      return next(err);
    }

    if (id !== result.author.toString()) {
      res.status(403).json({
        success: false,
        data: "You are not allowed to modify this post",
      });
    }

    const post = await PostModel.findById(postId);
    if (!post) return null;

    if (req.body.userId !== post.author.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.delete("/posts/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await deletePost(id);

    if (!deleted) {
      const err = new Error("Post not found");
      (err as any).status = 404;
      return next(err);
    }

    if (id !== deleted.author.toString()) {
      res.status(403).json({
        success: false,
        data: "You are not allowed to modify this post",
      });
    }

    await deleted.deleteOne();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/posts/:id/comments", async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { text, author } = req.body;

    if (!author) {
      const err = new Error("Author ID is required to comment post");
      (err as any).status = 400;
      return next(err);
    }

    if (!text || text.trim() === "") {
      const err = new Error("Comment text is required");
      (err as any).status = 404;
      return next(err);
    }
    const post = await addComment(postId, { text, author });

    if (!post) {
      const err = new Error("Post not found");
      (err as any).status = 404;
      return next(err);
    }

    res.status(201).json({
      success: true,
      data: post,
      commentCount: post.comments.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/posts/:id/like", async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.body.userId;

    if (!userId) {
      const err = new Error("User ID is required to like post");
      (err as any).status = 400;
      return next(err);
    }

    const post = await toggleLike(postId, userId);

    if (!post) {
      const err = new Error("Post not found");
      (err as any).status = 404;
      return next(err);
    }

    res.status(201).json({
      success: true,
      data: post,
      likesCount: post.likes.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

router.get("/users/:id/posts", async (req, res, next) => {
  try {
    const userId = req.params.id;

    const result = await getPostsByAuthor(userId, {
      page: req.query.page as string,
      limit: req.query.limit as string,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Invalid post id",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
