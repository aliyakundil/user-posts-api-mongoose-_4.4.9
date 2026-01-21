import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser {
  username: string;
  email: string;
  password: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

export const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // не возвращать в ответах
  },
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

userSchema.pre<IUserDocument>("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.virtual("followersCount").get(function () {
  return this.followers.length;
});

userSchema.virtual("followingCount").get(function () {
  return this.following.length;
});

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  userSchema,
);
