import mongoose from "mongoose";

// TypeScript types
export interface IVideo {
  _id: mongoose.Types.ObjectId;
  title: string;
  videoUrl: string;
  duration: number;
  shareId: string;
  filename?: string;
  size: number;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}


const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
    },
    size: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

export default Video;
