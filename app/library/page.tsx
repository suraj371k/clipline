// app/library/page.tsx
import { getAllVideos } from "@/lib/helperFn";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const videos = await getAllVideos();

  return <LibraryClient initialVideos={videos} />;
}
