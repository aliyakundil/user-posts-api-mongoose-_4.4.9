import express from "express";
import mongoose from "mongoose";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  patchPost,
  deletePost,
} from "../services/postService";
import { PostModel } from "models/Post";

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
    const result = await updatePost(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.patch("/posts/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

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
    const post = await PostModel.findById(postId);

    if (!post) {
      const err = new Error("Post not found");
      (err as any).status = 404;
      return next(err);
    }

    const commentObject = {
      text: text.trim(),
      author: new mongoose.Types.ObjectId(author),
    };

    post.comments.push(commentObject);
    await post.save();

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
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!userId) {
      const err = new Error("User ID is required to like post");
      (err as any).status = 400;
      return next(err);
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      const err = new Error("Post not found");
      (err as any).status = 404;
      return next(err);
    }

    if (!post.likes.some((id) => id.toString() === userObjectId.toString())) {
      post.likes.push(userObjectId);
      await post?.save();
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
