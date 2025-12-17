// app/share/[shareId]/page.tsx
import { notFound } from "next/navigation";
import { getVideoByShareId } from "@/lib/helperFn";
import { Metadata } from "next";
import VideoRecorder from "@/components/Recording";
import VideoActions from "@/components/VideoActions";

type Props = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const video = await getVideoByShareId(shareId);

  if (!video) {
    return {
      title: "Video Not Found",
    };
  }

  return {
    title: video.title || "Shared Video",
    description: `Watch this video shared with you`,
    openGraph: {
      title: video.title || "Shared Video",
      description: "Watch this video shared with you",
      images: [
        {
          url: video.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: video.title || "Video thumbnail",
        },
      ],
      videos: [
        {
          url: video.videoUrl,
          width: 1280,
          height: 720,
          type: "video/webm",
        },
      ],
    },
    twitter: {
      card: "player",
      title: video.title || "Shared Video",
      description: "Watch this video shared with you",
      images: [video.thumbnailUrl],
      players: [
        {
          playerUrl: video.videoUrl,
          streamUrl: video.videoUrl,
          width: 1280,
          height: 720,
        },
      ],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params;
  const video = await getVideoByShareId(shareId);

  if (!video) {
    notFound();
  }

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {video.title}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Shared Video</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">⏱️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">
                  {formatDuration(video.duration)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="font-semibold">{formatFileSize(video.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="font-semibold">{formattedDate}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Video Player */}
        <div className="mb-8">
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={video.videoUrl}
              controls
              className="w-full aspect-video"
              poster={video.thumbnailUrl}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Video Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Filename:</span>
                  <span className="font-medium text-gray-900">
                    {video.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium text-gray-900">WebM (VP9)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span className="font-medium text-gray-900">HD</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Sharing</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Share ID:</span>
                  <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {video.shareId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-900">
                    {video.views || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Using Client Component */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <VideoActions videoUrl={video.videoUrl} title={video.title} />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            This video was recorded using Screen Recorder • Share link expires
            in 30 days
          </p>
        </div>
      </div>
    </div>
  );
}
