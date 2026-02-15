"use client";

/**
 * Chat Page
 * 
 * Page for community chat functionality.
 */
export default function ChatPage() {
  return (
    <div className="min-h-screen">
      {/* Main Content - Two Column Layout */}
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left: User List */}
        <div className="w-80 glass border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white mb-2">Messages</h2>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">U{i}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      User {i}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Last message preview...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 glass p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="text-center text-gray-500 text-sm py-8">
                Select a conversation to start chatting
              </div>
            </div>
          </div>
          <div className="glass border-t border-gray-800 p-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

