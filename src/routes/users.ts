import express from "express";
import mongoose from "mongoose";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
} from "../services/userService";
import { UserModel } from "../models/User";

const router = express.Router();

router.get("/users", async (req, res, next) => {
  try {
    const user = await getUsers(req.query);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const result = await getUserById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Invalid user id",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await updateUser(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      const err = new Error("Body не может быть пустым");
      (err as any).status = 400;
      return next(err);
    }

    const result = await patchUser(id, req.body);

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

router.delete("/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await deleteUser(id);

    if (!deleted) {
      const err = new Error("User not found");
      (err as any).status = 404;
      return next(err);
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/follow", async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.body.userId;

    if (!currentUserId) {
      const err = new Error("User ID is required to like post");
      (err as any).status = 400;
      return next(err);
    }

    if (currentUserId === targetUserId) {
      const err = new Error("You cannot follow yourself");
      (err as any).status = 400;
      return next(err);
    }

    const targetUser = await UserModel.findById(targetUserId);
    const currentUser = await UserModel.findById(currentUserId);

    if (!targetUser) {
      const err = new Error("User not found");
      (err as any).status = 404;
      return next(err);
    }

    if (!currentUser) {
      const err = new Error("Current user not found");
      (err as any).status = 404;
      return next(err);
    }

    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    if (
      !targetUser.followers.some(
        (id) => id.toString() === currentUserObjectId.toString(),
      )
    ) {
      targetUser.followers.push(currentUserObjectId);
      await targetUser?.save();
    }

    const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);

    if (
      !targetUser.followers.some(
        (id) => id.toString() === targetUserObjectId.toString(),
      )
    ) {
      targetUser.followers.push(targetUserObjectId);
      await targetUser?.save();
    }

    res.status(201).json({
      success: true,
      data: targetUser,
      followersCount: targetUser.followers.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
