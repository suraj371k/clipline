"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Square,
  Download,
  Scissors,
  Check,
  Zap,
  Share2,
  PlayCircle,
  Upload,
  Loader,
  Pause,
  RotateCcw,
} from "lucide-react";


export default function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [title, setTitle] = useState("My Recording");
  const [autoSave, setAutoSave] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      // Request screen capture + audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Optionally add microphone audio
      let audioStream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (e) {
        console.log("Mic access denied, continuing without mic");
      }

      // Combine streams
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
      ];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(tracks);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setUploadResult(null); // Reset previous upload result

        // Stop all tracks
        combinedStream.getTracks().forEach((track) => track.stop());

        // Auto-save if enabled
        if (autoSave) {
          setTimeout(() => uploadRecording(blob), 500); // Small delay to ensure blob is ready
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pausedTimeRef.current = 0;
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Failed to start recording. Please allow screen and audio access.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedTimeRef.current = Date.now();
      } catch (err) {
        console.error("Error pausing recording:", err);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume();
        // Add the paused duration to total paused time
        const pausedDuration = Date.now() - pausedTimeRef.current;
        totalPausedTimeRef.current += pausedDuration;
        setIsPaused(false);
        pausedTimeRef.current = 0;
      } catch (err) {
        console.error("Error resuming recording:", err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      recordingStartTimeRef.current = 0;
      totalPausedTimeRef.current = 0;
      pausedTimeRef.current = 0;
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
    }
  };

  const uploadRecording = async (blob?: Blob) => {
    const videoBlob = blob || recordedBlob;
    if (!videoBlob) {
      alert("No recording to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert blob to File object
      const file = new File([videoBlob], `recording-${Date.now()}.webm`, {
        type: "video/webm",
      });

      // Create FormData
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title);

      // Simulate progress for upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setUploadResult(result);
      setUploadProgress(100);

      console.log("Upload successful:", result);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
      // Reset progress after 2 seconds
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const manualUpload = () => {
    uploadRecording();
  };

  const copyShareLink = () => {
    if (uploadResult?.shareUrl) {
      navigator.clipboard.writeText(uploadResult.shareUrl);
      alert("Share link copied to clipboard!");
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Timer effect for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - recordingStartTimeRef.current - totalPausedTimeRef.current) / 1000
        );
        setRecordingDuration(elapsed);
      }, 1000); // Update every second
    } else if (!isRecording) {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Screen Recorder
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Beta</span>
            </div>
          </div>
          <p className="text-gray-600">
            Record your screen with crystal clear audio and automatically save
            to cloud
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Recording Preview Area */}
              <div className="p-6 md:p-8 border-b border-gray-100">
                <div className="aspect-video bg-linear-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      controls
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : isRecording ? (
                    <div className="text-center">
                      {isPaused ? (
                        <>
                          <div className="relative inline-block mb-4">
                            <div className="w-16 h-16 bg-yellow-500 rounded-full"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Pause size={32} className="text-white" />
                            </div>
                          </div>
                          <p className="text-white font-medium">
                            Recording Paused
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Click Resume to continue recording
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative inline-block mb-4">
                            <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 border-4 border-red-300 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-white font-medium">
                            Recording in progress...
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Your screen is being captured
                          </p>
                          {autoSave && (
                            <p className="text-blue-400 text-sm mt-2">
                              Auto-save enabled
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Play size={32} className="text-white ml-1" />
                      </div>
                      <p className="text-white text-lg font-semibold">
                        Ready to Record
                      </p>
                      <p className="text-gray-400 mt-2">
                        Click start to begin capturing
                      </p>
                      {autoSave && (
                        <p className="text-green-400 text-sm mt-2">
                          Videos will auto-save to cloud
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Auto-save Toggle */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSave}
                          onChange={(e) => setAutoSave(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Auto-save to Cloud
                      </p>
                      <p className="text-sm text-gray-600">
                        {autoSave
                          ? "Videos automatically upload when recording stops"
                          : "Manual upload required"}
                      </p>
                    </div>
                  </div>

                  {/* Title Input (only when not auto-saving) */}
                  {!autoSave && previewUrl && (
                    <div className="flex-1 ml-4">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Video title"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Status */}
              {(isUploading || uploadResult) && (
                <div className="border-b border-gray-100">
                  {isUploading ? (
                    <div className="p-6 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Loader
                            className="animate-spin text-blue-600"
                            size={20}
                          />
                          <span className="font-medium text-blue-800">
                            Saving to Cloud...
                          </span>
                        </div>
                        <span className="font-medium text-blue-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    uploadResult && (
                      <div className="p-6 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="text-green-600" size={20} />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800">
                                Saved Successfully!
                              </p>
                              <p className="text-sm text-green-600">
                                Duration:{" "}
                                {formatDuration(uploadResult.duration || 0)} • Size:{" "}
                                {uploadResult.size && !isNaN(uploadResult.size)
                                  ? (uploadResult.size / (1024 * 1024)).toFixed(2)
                                  : recordedBlob
                                  ? (recordedBlob.size / (1024 * 1024)).toFixed(2)
                                  : "0.00"}
                                MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={copyShareLink}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Copy Link
                          </button>
                        </div>
                        {uploadResult.shareUrl && (
                          <p className="mt-3 text-sm text-gray-600 truncate">
                            Link:{" "}
                            <span className="font-mono">
                              {uploadResult.shareUrl}
                            </span>
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Controls & Status */}
              <div className="p-6 md:p-8">
                {/* Recording Status */}
                {isRecording && (
                  <div className={`mb-6 p-4 border rounded-xl ${
                    isPaused 
                      ? "bg-linear-to-r from-yellow-50 to-orange-50 border-yellow-100" 
                      : "bg-linear-to-r from-red-50 to-orange-50 border-red-100"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {isPaused ? (
                            <>
                              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                            </>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${
                            isPaused ? "text-yellow-800" : "text-red-800"
                          }`}>
                            {isPaused ? "Recording Paused" : "Recording Active"}
                          </p>
                          <p className={`text-sm ${
                            isPaused ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {isPaused ? "Paused • Click Resume to continue" : "Screen + Audio • Live"}
                          </p>
                          {autoSave && !isPaused && (
                            <p className="text-sm text-blue-600">
                              Auto-save enabled
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isPaused 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          <span className="font-mono">{formatDuration(recordingDuration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isRecording}
                      className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Play size={20} className="ml-0.5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg">Start Recording</p>
                        <p className="text-sm opacity-90">
                          Screen + Microphone
                        </p>
                      </div>
                    </button>
                  ) : (
                    <>
                      {isPaused ? (
                        <button
                          onClick={resumeRecording}
                          className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Play size={20} className="ml-0.5" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-lg">Resume Recording</p>
                            <p className="text-sm opacity-90">
                              Continue recording
                            </p>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={pauseRecording}
                          className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-yellow-600 to-yellow-700 text-white px-8 py-4 rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Pause size={20} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-lg">Pause Recording</p>
                            <p className="text-sm opacity-90">
                              Temporarily pause
                            </p>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={stopRecording}
                        className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-gray-800 to-gray-900 text-white px-8 py-4 rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Square size={18} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-lg">Stop Recording</p>
                          <p className="text-sm opacity-90">
                            {autoSave ? "Stop & Save to Cloud" : "Stop & Preview"}
                          </p>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Manual Upload Button (when auto-save is off) */}
                  {previewUrl && !autoSave && !isUploading && (
                    <button
                      onClick={manualUpload}
                      className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Upload size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg">Save to Cloud</p>
                        <p className="text-sm opacity-90">Upload manually</p>
                      </div>
                    </button>
                  )}

                  {previewUrl && !isUploading && (
                    <button
                      onClick={downloadRecording}
                      className="flex-1 flex items-center justify-center gap-3 bg-linear-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Download size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg">Download</p>
                        <p className="text-sm opacity-90">WebM format • HD</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Status Information */}
                {previewUrl && !isUploading && !uploadResult && autoSave && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-700 text-center">
                      <span className="font-medium">Auto-save enabled:</span>{" "}
                      Video will be automatically saved to cloud
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Instructions & Features */}
          <div className="space-y-6">
            {/* Instructions Card */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PlayCircle size={20} className="text-blue-600" />
                {autoSave ? "Auto-save Mode" : "Manual Mode"}
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-white border border-blue-200 rounded-full flex items-center justify-center shrink-0 font-semibold text-blue-700">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Start Recording</p>
                    <p className="text-sm text-gray-600">
                      Select screen/window to capture
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-white border border-blue-200 rounded-full flex items-center justify-center shrink-0 font-semibold text-blue-700">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Record Content</p>
                    <p className="text-sm text-gray-600">
                      Screen + microphone audio
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-white border border-blue-200 rounded-full flex items-center justify-center shrink-0 font-semibold text-blue-700">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {autoSave ? "Stop & Auto-save" : "Stop & Preview"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {autoSave
                        ? "Video automatically uploads to cloud"
                        : "Preview then manually upload"}
                    </p>
                  </div>
                </div>
                {autoSave && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white border border-blue-200 rounded-full flex items-center justify-center shrink-0 font-semibold text-blue-700">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Get Share Link
                      </p>
                      <p className="text-sm text-gray-600">
                        Copy link from success notification
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-white/50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Current Mode:</span>{" "}
                  <span
                    className={
                      autoSave
                        ? "text-green-600 font-medium"
                        : "text-blue-600 font-medium"
                    }
                  >
                    {autoSave ? "Auto-save Enabled" : "Manual Upload"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Toggle the switch above the preview to change modes
                </p>
              </div>
            </div>

            {/* Recent Uploads (if any) */}
            {uploadResult && (
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Upload Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Success
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Video ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {uploadResult.videoId?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Share ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {uploadResult.shareId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">
                      {formatDuration(uploadResult.duration)}
                    </span>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} />
                    Copy Shareable Link
                  </button>
                  <button
                    onClick={() => window.open(uploadResult.shareUrl, "_blank")}
                    className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
