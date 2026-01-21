import { ObjectId } from "mongodb";
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
    filter.title = { $regex: options.search, $options: "i" };
    filter.content = { $regex: options.search, $options: "i" };
  }

  const users = await PostModel.find(filter)
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
    const user = await PostModel.findById(id);
    return user;
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
  const result = await PostModel.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
