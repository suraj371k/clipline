import mongoose from "mongoose";


export interface IAnalytic {
  _id: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  completionPercentage: number;
  watchDuration: number;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new mongoose.Schema<IAnalytic>(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    completionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    watchDuration: {
      type: Number,
      default: 0,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
  },
  { timestamps: true }
);

const Analytic = mongoose.models.Analytic || mongoose.model('Analytic', analyticsSchema);

export default Analytic;
