import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { UserModel } from "../models/User";

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
  };
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

interface UpdateUserInput {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  completed?: string;
  priority?: string;
  search?: string;
}

export async function getUsers(options: PaginationQuery) {
  const page = options.page ? parseInt(options.page) : 1;
  const limit = options.limit ? parseInt(options.limit) : 10;
  const offset = (page - 1) * limit;

  const filter: any = {};

  if (options.search) {
    filter.username = { $regex: options.search, $options: "i" };
  }

  const users = await UserModel.find(filter)
    .populate("followers", "username profile")
    .populate("following", "username profile")
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const total = await UserModel.countDocuments(filter);

  return {
    users: users,
    meta: {
      total: total,
      page: page,
      limit: limit,
      totalPage: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await UserModel.findById(id)
    .populate("followers", "username profile")
    .populate("following", "username profile");
  return user;
}

export async function createUser(input: CreateUserInput) {
  if (!input.username || input.username.trim() === "")
    throw new Error("Username is required");
  const newUser = await UserModel.create({
    username: input.username,
    email: input.email,
    password: input.password,
    profile: {
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      bio: input.profile.bio,
    },
  });

  const user = await UserModel.findById(newUser._id);

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const userUpdate = await UserModel.findOne({ _id: new ObjectId(id) });

  if (!userUpdate) return null;

  if (input.username !== undefined) userUpdate.username = input.username.trim();
  if (input.email !== undefined) userUpdate.email = input.email;

  await userUpdate.save();

  return userUpdate;
}

export async function patchUser(id: string, input: Partial<UpdateUserInput>) {
  const userPatch = await UserModel.findOne({ _id: new ObjectId(id) });

  if (!userPatch) return null;

  if (input.username !== undefined)
    userPatch.username = input.username.trimEnd();
  if (input.email !== undefined) userPatch.email = input.email;

  const update = await UserModel.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: userPatch },
    { returnDocument: "after" },
  );

  return update ?? null;
}

export async function deleteUser(id: string) {
  const result = await UserModel.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function followUser(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

  const user = await UserModel.findById(userObjectId);
  const targetUser = await UserModel.findById(targetObjectId);

  if (!user || !targetUser) {
    throw new Error("User not found");
  }

  // если уже подписан — ничего не делаем
  if (user.following.some((id) => id.equals(targetObjectId))) {
    return {
      user,
      targetUser,
      followed: false,
    };
  }

  user.following.push(targetObjectId);
  targetUser.followers.push(userObjectId);

  await user.save();
  await targetUser.save();

  return {
    user,
    targetUser,
    followed: true,
  };
}

export async function unfollowUser(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new Error("You cannot unfollow yourself");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

  const user = await UserModel.findById(userObjectId);
  const targetUser = await UserModel.findById(targetObjectId);

  if (!user || !targetUser) {
    throw new Error("User not found");
  }

  user.following = user.following.filter((id) => !id.equals(targetObjectId));
  targetUser.followers = targetUser.followers.filter(
    (id) => !id.equals(userObjectId),
  );

  await user.save();
  await targetUser.save();

  return {
    user,
    targetUser,
    followed: false,
  };
}
