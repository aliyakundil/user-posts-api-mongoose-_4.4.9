import mongoose, { Model } from "mongoose";

export interface IPost {
  title: string;
  content: string;
  excerpt: string;
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  views: number;
  publishedAt: Date;
  comments: {
    text: string;
    author: mongoose.Types.ObjectId;
  }[];
}

export interface IPostDocument extends Document {
  title: string;
  content: string;
  excerpt: string;
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  views: number;
  publishedAt: Date;
  comments: {
    text: string;
    author: mongoose.Types.ObjectId;
  }[];
}

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  excerpt: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  publishedAt: Date,
  comments: [commentSchema],
});

postSchema.pre<IPostDocument>("save", function () {
  if (!this.excerpt) {
    this.excerpt = this.content.substring(0, 100);
  }

  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }
});

postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

postSchema.virtual("readingTime").get(function () {
  const words = this.content.split("").length;
  return Math.ceil(words / 200);
});

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ views: -1 });

export const PostModel: Model<IPostDocument> = mongoose.model<IPostDocument>(
  "Post",
  postSchema,
);
