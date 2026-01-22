import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { PostModel } from "../models/Post";

interface CreatePostInput {
  title: string;
  content: string;
  author: string;
  excerpt?: string;
}

interface UpdatePostInput {
  title: string;
  content: string;
  author: string;
  excerpt?: string;
}

interface CreateComment {
  text: string;
  author: string;
}

interface ToggleLike {
  userId: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  completed?: string;
  priority?: string;
  search?: string;
}

export async function getPosts(options: PaginationQuery) {
  const page = options.page ? parseInt(options.page) : 1;
  const limit = options.limit ? parseInt(options.limit) : 10;
  const offset = (page - 1) * limit;

  const filter: any = {};

  if (options.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { content: { $regex: options.search, $options: "i" } },
    ];
  }

  const users = await PostModel.find(filter)
    .populate("author", "username profile")
    .populate("comments.author", "username profile")
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const total = await PostModel.countDocuments(filter);

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

export async function getPostById(id: string) {
  try {
    const post = await PostModel.findById(id)
      .populate("author", "username profile")
      .populate("comments.author", "username profile");
    if (!post) return null;
    post.views += 1;
    await post.save();
    return post;
  } catch (err) {
    return null;
  }
}

export async function createPost(input: CreatePostInput) {
  if (!input.title || input.title.trim() === "")
    throw new Error("Title is required");
  if (!input.content || input.content.trim() === "")
    throw new Error("Content is required");
  const newPost = new PostModel({
    title: input.title,
    content: input.content,
    author: input.author,
  });

  await newPost.save();

  return newPost;
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const postUpdate = await PostModel.findOne({ _id: new ObjectId(id) });

  if (!postUpdate) return null;

  if (input.title !== undefined) postUpdate.title = input.title;
  if (input.content !== undefined) postUpdate.content = input.content;

  await postUpdate.save();

  return postUpdate;
}

export async function patchPost(id: string, input: Partial<UpdatePostInput>) {
  const postPatch = await PostModel.findOne({ _id: new ObjectId(id) });

  if (!postPatch) return null;

  if (input.title !== undefined) postPatch.title = input.title.trimEnd();
  if (input.content !== undefined) postPatch.content = input.content;

  const update = await PostModel.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: postPatch },
    { returnDocument: "after" },
  );

  return update ?? null;
}

export async function deletePost(id: string) {
  const result = await PostModel.findById({ _id: new ObjectId(id) });
  return result;
}

export async function addComment(id: string, input: CreateComment) {
  const post = await PostModel.findOne({ _id: new ObjectId(id) });

  const commentObject = {
    text: input.text,
    author: new mongoose.Types.ObjectId(input.author),
  };

  if (!post) return null;

  post.comments.push(commentObject);
  await post.save();
  return post;
}

export async function toggleLike(postId: string, input: ToggleLike) {
  const post = await PostModel.findById(postId);
  const userObjectId = new mongoose.Types.ObjectId(input.userId);

  if (!post) return null;

  if (!post.likes.some((id) => id.equals(userObjectId))) {
    post.likes.push(userObjectId);
  } else {
    post.likes = post.likes.filter((id) => !id.equals(userObjectId));
  }

  await post.save();

  return post;
}

export async function getPostsByAuthor(
  authorId: string,
  options: PaginationQuery,
) {
  const page = options.page ? parseInt(options.page) : 1;
  const limit = options.limit ? parseInt(options.limit) : 10;
  const offset = (page - 1) * limit;

  const filter = { author: new mongoose.Types.ObjectId(authorId) };

  const posts = await PostModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author", "username profile");

  const total = await PostModel.countDocuments(filter);

  return {
    posts,
    meta: {
      total: total,
      page: page,
      limit: limit,
      totalPage: Math.ceil(total / limit),
    },
  };
}
