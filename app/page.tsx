import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Video Recording MVP
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Record, trim, and share videos instantly
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/record"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Record Video
          </Link>
          <Link
            href="/trim"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Trim Video
          </Link>
        </div>
      </div>
    </div>
  );
}