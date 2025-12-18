"use client";
import React, { useState, useRef, useEffect } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { Upload, Loader2, AlertCircle } from "lucide-react";

interface VideoTrimmerProps {
  // Optional existing video to trim (e.g. from library)
  sourceUrl?: string;
  title?: string;
}

export default function VideoTrimmer({ sourceUrl, title }: VideoTrimmerProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [trimmedUrl, setTrimmedUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [processingLog, setProcessingLog] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  // If a sourceUrl is provided (e.g. from the library), use it as the initial video
  useEffect(() => {
    if (sourceUrl) {
      setVideoUrl(sourceUrl);
      setTrimmedUrl("");
      setError("");
      setProcessingLog("");
      setVideoFile(null);
    }
  }, [sourceUrl]);

  const loadFFmpeg = async () => {
    // Ensure we only run in the browser
    if (typeof window === "undefined") return;

    if (!ffmpegRef.current) {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return;

    ffmpeg.on("log", ({ message }) => {
      console.log(message);
      setProcessingLog((prev) => prev + "\n" + message);
    });

    try {
      setProcessingLog("Loading FFmpeg...");
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      setFfmpegLoaded(true);
      setProcessingLog("FFmpeg loaded successfully!");
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      setError("Failed to load video processor. Please refresh the page.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setTrimmedUrl("");
      setError("");
      setProcessingLog("");
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
    }
  };

  const trimVideo = async () => {
    if ((!videoFile && !videoUrl) || !ffmpegLoaded) return;

    setIsProcessing(true);
    setError("");
    setProcessingLog("Starting trim process...");
    const ffmpeg = ffmpegRef.current;

    try {
      // Determine input source: uploaded file or existing URL
      const inputSource: File | string = videoFile ?? videoUrl ?? "";

      setProcessingLog("Reading input file...");

      // Derive a virtual input file name with extension for ffmpeg
      let inputExt = "webm";
      if (inputSource instanceof File) {
        inputExt = inputSource.name.split(".").pop()?.toLowerCase() || "webm";
      } else if (typeof inputSource === "string") {
        const urlPath = inputSource.split("?")[0];
        inputExt = urlPath.split(".").pop()?.toLowerCase() || "mp4";
      }

      if (!ffmpeg) {
        setError("Video processor is not ready. Please reload the page.");
        setIsProcessing(false);
        return;
      }

      const inputName = `input.${inputExt}`;

      await ffmpeg.writeFile(inputName, await fetchFile(inputSource));

      // Calculate trim duration
      const trimDuration = endTime - startTime;

      setProcessingLog(`Input format: ${inputExt}`);
      setProcessingLog(
        `Trimming from ${startTime}s to ${endTime}s (${trimDuration}s duration)`
      );

      let outputFile = "output.mp4";
      let mimeType = "video/mp4";

      // Strategy: Always output as MP4 for compatibility
      try {
        setProcessingLog("Attempting fast copy (no re-encoding)...");
        await ffmpeg.exec([
          "-i",
          inputName,
          "-ss",
          startTime.toString(),
          "-t",
          trimDuration.toString(),
          "-c",
          "copy",
          outputFile,
        ]);
        setProcessingLog("Fast copy successful!");
      } catch (copyError) {
        setProcessingLog("Fast copy failed, re-encoding video...");

        // Re-encode to MP4 with H.264
        await ffmpeg.exec([
          "-i",
          inputName,
          "-ss",
          startTime.toString(),
          "-t",
          trimDuration.toString(),
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputFile,
        ]);
        setProcessingLog("Re-encoding complete!");
      }

      // Read output file
      setProcessingLog("Reading output file...");

      // Add small delay to ensure file is fully written
      await new Promise((resolve) => setTimeout(resolve, 100));

      const data = await ffmpeg.readFile(outputFile);

      let uint8: Uint8Array;

      if (typeof data === "string") {
        uint8 = new TextEncoder().encode(data);
      } else {
        uint8 = new Uint8Array(data);
      }

      const blob = new Blob([uint8.slice().buffer], { type: mimeType });

      const url = URL.createObjectURL(blob);

      setProcessingLog(
        `Success! Trimmed video ready (${(blob.size / (1024 * 1024)).toFixed(
          2
        )} MB)`
      );

      // Clean up files
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputFile);
      } catch (cleanupError) {
        console.log("Cleanup warning:", cleanupError);
      }

      setTrimmedUrl(url);
    } catch (error) {
      console.error("Trimming error:", error);
      setError(
        "Failed to trim video. Please try a different video or time range."
      );
      setProcessingLog(
        "Error occurred during trimming: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadVideo = async () => {
    if (!trimmedUrl) return;

    setUploadProgress("Preparing upload...");
    setError("");

    try {
      // Fetch the blob from the URL
      const response = await fetch(trimmedUrl);
      const blob = await response.blob();

      console.log("Uploading blob:", blob.size, blob.type);

      // Create form data
      const formData = new FormData();
      formData.append("video", blob, "trimmed-video.mp4");
      formData.append(
        "title",
        videoFile?.name.replace(/\.(webm|mp4|mov)$/i, " (Trimmed)") ||
          "Trimmed Video"
      );

      setUploadProgress("Uploading to cloud...");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(result.error || result.details || "Upload failed");
      }

      console.log("Upload successful:", result);
      setUploadProgress("Upload complete! Redirecting...");

      setTimeout(() => {
        window.location.href = result.shareUrl;
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        "Failed to upload video: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setUploadProgress("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Video Trimmer</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-red-800">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* File Upload */}
        {!videoUrl && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition">
            <input
              type="file"
              accept="video/webm,video/mp4,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Click to upload video
              </p>
              <p className="text-sm text-gray-500">
                Support for WebM, MP4, and MOV files
              </p>
            </label>
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && !trimmedUrl && (
          <div className="space-y-6">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full rounded-lg shadow-md"
            />

            {/* Trim Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time: {formatTime(startTime)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(
                      Math.min(parseFloat(e.target.value), endTime - 0.1)
                    )
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time: {formatTime(endTime)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(
                      Math.max(parseFloat(e.target.value), startTime + 0.1)
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Trimmed duration: {formatTime(endTime - startTime)}
                </p>
              </div>

              <button
                onClick={trimVideo}
                disabled={isProcessing || !ffmpegLoaded || startTime >= endTime}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : !ffmpegLoaded ? (
                  "Loading video processor..."
                ) : (
                  "Trim Video"
                )}
              </button>
            </div>

            {/* Processing Log */}
            {processingLog && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {processingLog}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trimmed Result */}
        {trimmedUrl && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Trimmed Video
            </h2>
            <video
              src={trimmedUrl}
              controls
              className="w-full rounded-lg shadow-md"
            />

            <div className="flex gap-4">
              <a
                href={trimmedUrl}
                download="trimmed-video.mp4"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-center font-medium"
              >
                Download
              </a>
              <button
                onClick={uploadVideo}
                disabled={uploadProgress !== ""}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
              >
                {uploadProgress || "Upload & Share"}
              </button>
            </div>

            <button
              onClick={() => {
                setTrimmedUrl("");
                setVideoUrl("");
                setVideoFile(null);
                setError("");
                setProcessingLog("");
              }}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
