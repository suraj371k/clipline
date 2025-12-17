import { getVideoById } from "@/lib/helperFn";
import Link from "next/link";
import VideoTrimmer from "@/components/VideoTrimmer";

interface TrimPageProps {
  params:
    | {
        id: string;
      }
    | Promise<{
        id: string;
      }>;
}

export default async function TrimVideoPage({ params }: TrimPageProps) {
  const { id } = (await params) as { id: string };
  const video = await getVideoById(id);

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
            The video you&apos;re trying to trim doesn&apos;t exist or was
            removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={`/library/${video._id}`}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            ← Back to video
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Trim “{video.title || "Untitled recording"}”
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Create a shorter clip from this recording. The trimmed video will be
            uploaded as a new entry.
          </p>
        </div>
      </div>

      <VideoTrimmer sourceUrl={video.videoUrl} title={video.title} />
    </div>
  );
}


