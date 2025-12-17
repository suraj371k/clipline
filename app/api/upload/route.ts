import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { randomBytes } from "crypto";
import { createVideo } from "@/lib/helperFn";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get("video") as File;
    const title = (formData.get("title") as string) || "Untitled Video";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" }, 
        { status: 400 }
      );
    }

    console.log("file type: " , file.type)
    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a video file." },
        { status: 400 }
      );
    }

    console.log("Received file:", file.name, file.type, file.size);

    const shareId = randomBytes(8).toString("hex");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("Uploading to Cloudinary...");

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "video-mvp",
          public_id: shareId,
          chunk_size: 6000000, // 6MB chunks for large files
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Upload successful:", result?.public_id);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    const videoUrl = uploadResult.secure_url;
    const duration = Math.round(uploadResult.duration || 0);

    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 640, height: 360, crop: "fill" },
        { quality: "auto" },
      ],
    });

    console.log("Saving to database...");

    // Save metadata to MongoDB
    const video = await createVideo({
      title,
      videoUrl,
      duration,
      shareId,
      filename: file.name,
      size: file.size,
      thumbnailUrl,
    });

    console.log("Video saved:", video._id);

    return NextResponse.json({
      success: true,
      videoId: video._id.toString(),
      shareId,
      videoUrl,
      thumbnailUrl,
      duration,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareId}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: "Video upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}