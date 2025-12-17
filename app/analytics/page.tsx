import { getOverallAnalytics } from "@/lib/helperFn";
import Link from "next/link";
import { Eye, Clock, Target, CheckCircle, Video, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  const analytics = await getOverallAnalytics();

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Track performance and engagement across all your videos
        </p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Views</p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.overall.totalViews.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Watch Time</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatDuration(analytics.overall.totalWatchTime)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg. Completion</p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.overall.avgCompletion}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Completed Views</p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.overall.completedViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Video Analytics Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Video size={20} />
              Video Performance
            </h2>
            <span className="text-sm text-gray-500">
              {analytics.overall.totalVideos} video{analytics.overall.totalVideos !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {analytics.byVideo.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600 font-medium mb-1">No analytics data yet</p>
            <p className="text-sm text-gray-500">
              Analytics will appear here once your videos are viewed
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Watch Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Completion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.byVideo.map((video) => (
                  <tr key={video.videoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {video.shareId.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {video.totalViews.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(video.totalWatchTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${video.avgCompletion}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 font-medium">
                          {video.avgCompletion}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {video.completedViews}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(video.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/library/${video.videoId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {analytics.overall.totalViews > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-900">
              {analytics.overall.totalViews > 0
                ? Math.round(
                    (analytics.overall.completedViews / analytics.overall.totalViews) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {analytics.overall.completedViews} of {analytics.overall.totalViews} views completed
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-2">Avg. Watch Time</p>
            <p className="text-2xl font-bold text-green-900">
              {analytics.overall.totalViews > 0
                ? formatDuration(
                    Math.round(analytics.overall.totalWatchTime / analytics.overall.totalViews)
                  )
                : "0s"}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Per view average
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <p className="text-sm text-purple-700 font-medium mb-2">Engagement Score</p>
            <p className="text-2xl font-bold text-purple-900">
              {analytics.overall.avgCompletion}%
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Average completion percentage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
