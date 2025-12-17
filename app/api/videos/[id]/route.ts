import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDb";
import Video from "@/lib/models/video";
import Analytic from "@/lib/models/analytics";
import mongoose from "mongoose";

// GET /api/videos/:id -> fetch a single video's metadata
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Convert to ObjectId
    const _id = new mongoose.Types.ObjectId(id);

    // Find video
    const video = await Video.findById(_id).lean();

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(video, { status: 200 });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/:id -> delete a video and its analytics (idempotent)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log(`[DELETE API] Received delete request for video: ${id}`);
    console.log(`[DELETE API] ID type: ${typeof id}, value: ${id}`);

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`[DELETE API] Invalid video ID: ${id}`);
      return NextResponse.json(
        { error: "Invalid video ID", receivedId: id },
        { status: 400 }
      );
    }

    console.log(`[DELETE API] Connecting to database...`);
    // Connect to database
    await connectDB();
    console.log(`[DELETE API] Database connected`);

    // Convert to ObjectId
    const _id = new mongoose.Types.ObjectId(id);
    console.log(`[DELETE API] Converted to ObjectId: ${_id}`);

    // Delete video
    console.log(`[DELETE API] Attempting to delete video from database...`);
    const deletedVideo = await Video.findByIdAndDelete(_id);

    if (!deletedVideo) {
      console.log(`[DELETE API] Video ${id} not found in database`);
    } else {
      console.log(`[DELETE API] Successfully deleted video ${id}`);
    }

    // Delete analytics (idempotent - always run even if video not found)
    console.log(`[DELETE API] Deleting analytics for video ${id}...`);
    const analyticsDeleted = await Analytic.deleteMany({ videoId: _id });
    console.log(
      `[DELETE API] Deleted ${analyticsDeleted.deletedCount} analytics records`
    );

    // Always respond success – delete is idempotent
    const response = {
      success: true,
      deleted: Boolean(deletedVideo),
      analyticsDeleted: analyticsDeleted.deletedCount,
    };
    console.log(`[DELETE API] Sending success response:`, response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[DELETE API] Error deleting video:", error);
    console.error("[DELETE API] Error stack:", error instanceof Error ? error.stack : "No stack");
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to delete video",
        details: message,
      },
      { status: 500 }
    );
  }
}


