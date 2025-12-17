"use client";

import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface VideoActionsProps {
  videoUrl: string;
  title: string;
}

export default function VideoActions({ videoUrl, title }: VideoActionsProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied successfully!")
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleCopyLink}
        className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
      >
        <Share2 size={18} />
        Copy Link
      </button>
    </div>
  );
}
