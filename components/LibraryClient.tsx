"use client";

import Link from "next/link";
import { useState } from "react";
import { Play } from "lucide-react";

type Video = {
  _id: string;
  title?: string;
  videoUrl: string;
  createdAtFormatted?: string;
  duration?: number;
};

export default function LibraryClient({
  initialVideos,
}: {
  initialVideos: Video[];
}) {
  const [videos] = useState(initialVideos);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Video Library
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            All your recordings, organized and ready to share
          </p>
        </div>

        {videos.length > 0 && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {videos.length} video{videos.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Empty state */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50 py-20 text-center">
          <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
            <Play size={22} />
          </div>
          <h2 className="text-sm font-medium text-gray-900">
            No recordings yet
          </h2>
          <p className="mt-1 text-xs text-gray-500 max-w-sm">
            Record your first video to see it appear in your library.
          </p>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {videos.map((video) => (
            <div
              key={video._id}
              className="group relative rounded-xl border bg-white transition
                         hover:shadow-lg hover:border-blue-200"
            >
              {/* Preview */}
              <Link href={`/library/${video._id}`}>
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <video
                    src={video.videoUrl}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    preload="metadata"
                    muted
                  />

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20
                                  opacity-0 group-hover:opacity-100 transition">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full
                                    bg-white/90 shadow">
                      <Play size={22} className="text-gray-900 ml-0.5" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {video.title || "Untitled recording"}
                </h3>

                {/* Meta */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {video.createdAtFormatted || "Unknown date"}
                  </span>
                  {video.duration && (
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      {Math.round(video.duration / 1000)}s
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4">
                  <Link
                    href={`/library/${video._id}/trim`}
                    className="inline-flex w-full items-center justify-center
                               rounded-md border border-gray-200 bg-white
                               px-3 py-2 text-xs font-medium text-gray-700
                               hover:bg-gray-50 hover:border-gray-300 transition"
                  >
                    Trim video
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
