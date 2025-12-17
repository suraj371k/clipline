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
    throw new Error("Invalid video ID");
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

  const analytics = await Analytic.find({ videoId })
    .sort({ createdAt: -1 })
    .lean();

  const totalViews = analytics.length;
  const avgCompletion =
    totalViews > 0
      ? Math.round(
          analytics.reduce((sum, a) => sum + a.completionPercentage, 0) /
            totalViews
        )
      : 0;

  const totalWatchTime = analytics.reduce(
    (sum, a) => sum + (a.watchDuration || 0),
    0
  );
  const completedViews = analytics.filter(
    (a) => a.completionPercentage === 100
  ).length;

  return {
    totalViews,
    avgCompletion,
    totalWatchTime: Math.round(totalWatchTime / 1000), // Convert to seconds
    completedViews,
    viewsOverTime: analytics.map((a) => ({
      date: a.createdAt,
      completion: a.completionPercentage,
      duration: a.watchDuration,
    })),
  };
}

// Get all videos
export async function getAllVideos(limit = 10) {
  await connectDB();

  const videos = await Video.find().sort({ createdAt: -1 }).limit(limit).lean();

  return videos.map((video) => {
    const createdAt = video.createdAt
      ? new Date(video.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Unknown date";

    return {
      ...video,
      _id: video._id.toString(),
      createdAt: video.createdAt?.toISOString(),
      createdAtFormatted: createdAt,
      updatedAt: video.updatedAt?.toISOString(),
    };
  });
}

// Get overall analytics (aggregate across all videos)
export async function getOverallAnalytics() {
  await connectDB();

  // Get all analytics
  const allAnalytics = await Analytic.find().lean();

  // Get all videos with their analytics
  const videos = await Video.find().lean();
  
  const videoAnalyticsMap = new Map();
  
  // Group analytics by video
  allAnalytics.forEach((analytic) => {
    const videoId = analytic.videoId.toString();
    if (!videoAnalyticsMap.has(videoId)) {
      videoAnalyticsMap.set(videoId, []);
    }
    videoAnalyticsMap.get(videoId).push(analytic);
  });

  // Calculate per-video stats
  const videoStats = videos.map((video) => {
    const analytics = videoAnalyticsMap.get(video._id.toString()) || [];
    const totalViews = analytics.length;
    const avgCompletion =
      totalViews > 0
        ? Math.round(
            analytics.reduce((sum: number, a: any) => sum + a.completionPercentage, 0) /
              totalViews
          )
        : 0;
    const totalWatchTime = analytics.reduce(
      (sum: number, a: any) => sum + (a.watchDuration || 0),
      0
    );
    const completedViews = analytics.filter(
      (a: any) => a.completionPercentage === 100
    ).length;

    return {
      videoId: video._id.toString(),
      title: video.title,
      shareId: video.shareId,
      totalViews,
      avgCompletion,
      totalWatchTime: Math.round(totalWatchTime / 1000), // Convert to seconds
      completedViews,
      createdAt: video.createdAt,
    };
  });

  // Calculate overall stats
  const totalViews = allAnalytics.length;
  const avgCompletion =
    totalViews > 0
      ? Math.round(
          allAnalytics.reduce((sum: number, a: any) => sum + a.completionPercentage, 0) /
            totalViews
        )
      : 0;
  const totalWatchTime = allAnalytics.reduce(
    (sum: number, a: any) => sum + (a.watchDuration || 0),
    0
  );
  const completedViews = allAnalytics.filter(
    (a: any) => a.completionPercentage === 100
  ).length;

  return {
    overall: {
      totalViews,
      avgCompletion,
      totalWatchTime: Math.round(totalWatchTime / 1000), // Convert to seconds
      completedViews,
      totalVideos: videos.length,
    },
    byVideo: videoStats.sort((a, b) => b.totalViews - a.totalViews), // Sort by views descending
  };
}

