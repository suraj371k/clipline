import { getVideoById } from "@/lib/helperFn";
import Link from "next/link";

interface LibraryVideoPageProps {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
}

export default async function LibraryVideoPage({ params }: LibraryVideoPageProps) {
  const resolvedParams = await params as { id: string };
  const video = await getVideoById(resolvedParams.id);

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-6">
          <Link
            href="/library"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to library
          </Link>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Video not found</h1>
          <p className="text-gray-500 text-sm">
            The video you’re looking for doesn’t exist or might have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb / Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/library"
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            ← Back to library
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900 line-clamp-2">
            {video.title || "Untitled recording"}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Recorded on{" "}
            {video.createdAt
              ? new Date(video.createdAt).toLocaleString()
              : "Unknown date"}
          </p>
        </div>
      </div>

      {/* Player Card */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="bg-black aspect-video">
          <video
            src={video.videoUrl}
            className="h-full w-full object-contain bg-black"
            controls
            controlsList="nodownload"
          />
        </div>

        <div className="px-6 py-4 flex items-center justify-between text-xs text-gray-500 border-t">
          <div className="flex flex-col gap-1">
            <span>
              Duration:{" "}
              {video.duration
                ? `${Math.round(video.duration / 1000)}s`
                : "Unknown"}
            </span>
            {video.size && (
              <span>
                Size: {(video.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
          {video.shareId && (
            <Link
              href={`/share/${video.shareId}`}
              className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Open public share link
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}