"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface LibraryVideoActionsProps {
  videoId: string;
}

export default function LibraryVideoActions({
  videoId,
}: LibraryVideoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this video? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      // In a well-behaved API this should always be 200; if not, just log and continue
      if (!res.ok) {
        console.warn("Unexpected delete response status:", res.status);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting || isPending}
      className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {deleting || isPending ? "Deleting..." : "Delete"}
    </button>
  );
}


