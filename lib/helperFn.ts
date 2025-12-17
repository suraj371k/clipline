import mongoose from "mongoose";
import connectDB from "./connectDb";
import Video from "./models/video";
import Analytic from "./models/analytics";

//create a new video
export async function createVideo(data: {
  title: string;
  videoUrl: string;
  duration?: number;
  shareId: string;
  filename?: string;
  size?: number;
  thumbnailUrl?: string;
}) {
  await connectDB();
  
  const video = new Video(data);
  await video.save();
  
  return video;
}

// Get video by shareId
export async function getVideoByShareId(shareId: string) {
  await connectDB();
  
  const video = await Video.findOne({ shareId }).lean();
  return video;
}

// Get video by ID
export async function getVideoById(videoId: string) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return null;
  }
  
  const video = await Video.findById(videoId).lean();
  return video;
}

// Increment video 
export async function incrementVideoViews(shareId: string) {
  await connectDB();
  
  // Views are calculated from analytics count
  return true;
}

// Track analytics event
export async function trackAnalytics(data: {
  videoId: string;
  completionPercentage: number;
  watchDuration?: number;
  userAgent?: string;
  ip?: string;
}) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(data.videoId)) {
    throw new Error('Invalid video ID');
  }
  
  const analytic = new Analytic({
    videoId: data.videoId,
    completionPercentage: data.completionPercentage,
    watchDuration: data.watchDuration || 0,
    userAgent: data.userAgent,
    ip: data.ip,
  });
  
  await analytic.save();
  return analytic;
}

// Get video analytics
export async function getVideoAnalytics(videoId: string) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return {
      totalViews: 0,
      avgCompletion: 0,
      totalWatchTime: 0,
      completedViews: 0,
      viewsOverTime: [],
    };
  }
  
  const analytics = await Analytic.find({ videoId }).sort({ createdAt: -1 }).lean();
  
  const totalViews = analytics.length;
  const avgCompletion = totalViews > 0
    ? Math.round(analytics.reduce((sum, a) => sum + a.completionPercentage, 0) / totalViews)
    : 0;
  
  const totalWatchTime = analytics.reduce((sum, a) => sum + (a.watchDuration || 0), 0);
  const completedViews = analytics.filter(a => a.completionPercentage === 100).length;
  
  return {
    totalViews,
    avgCompletion,
    totalWatchTime: Math.round(totalWatchTime / 1000), // Convert to seconds
    completedViews,
    viewsOverTime: analytics.map(a => ({
      date: a.createdAt,
      completion: a.completionPercentage,
      duration: a.watchDuration,
    })),
  };
}

// Get all videos
export async function getAllVideos(limit = 10) {
  await connectDB();
  
  const videos = await Video.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  return videos;
}

// Delete video
export async function deleteVideo(videoId: string) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new Error('Invalid video ID');
  }
  
  // Delete video and its analytics
  await Video.findByIdAndDelete(videoId);
  await Analytic.deleteMany({ videoId });
  
  return true;
}
