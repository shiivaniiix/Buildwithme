"use client";

interface EmptyStateProps {
  onCreateFile?: () => void;
}

export default function EmptyState({ onCreateFile }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
      <div className="mb-6">
        <svg
          className="w-16 h-16 mx-auto text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">No files yet.</h3>
      <p className="text-sm text-gray-500 mb-6">
        Create your first file to get started.
      </p>
      {onCreateFile && (
        <button
          onClick={onCreateFile}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          Create File
        </button>
      )}
    </div>
  );
}

