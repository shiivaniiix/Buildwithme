import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Docs Page
 * 
 * Structured documentation for Buildwithme platform.
 */
export default function DocsPage() {
  return (
    <main className="min-h-screen code-pattern relative">
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-xl text-gray-300">
            Complete guide to using Buildwithme - your AI-powered pair programming platform.
          </p>
        </header>

        {/* Introduction Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Introduction</h2>
          <div className="glass rounded-xl p-8 shadow-soft-lg space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Buildwithme is an AI-powered pair programming platform designed to help developers of all skill levels learn by building real projects. Our intelligent AI assistant provides real-time code suggestions, detailed explanations, and step-by-step guidance as you work.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Whether you're a complete beginner or an experienced developer looking to learn new technologies, Buildwithme adapts to your skill level and provides personalized assistance throughout your coding journey.
            </p>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Getting Started</h2>
          <div className="glass rounded-xl p-8 shadow-soft-lg space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">1. Create Your Account</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Sign up for a free Buildwithme account to get started. You can begin coding immediately with our free tier, which includes access to basic features and project templates.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">2. Choose a Project</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Browse our collection of project templates or start from scratch. Projects range from simple web applications to complex full-stack applications.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Web Applications (React, Next.js, Vue)</li>
                <li>Backend APIs (Node.js, Python, Express)</li>
                <li>Mobile Apps (React Native)</li>
                <li>Data Science Projects (Python, Jupyter)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">3. Start Coding with AI</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Once you've selected a project, our AI pair programmer will guide you through each step. The AI will:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Suggest code as you type</li>
                <li>Explain concepts and best practices</li>
                <li>Help debug errors with detailed explanations</li>
                <li>Provide learning resources tailored to your needs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Core Concepts Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Core Concepts</h2>
          <div className="glass rounded-xl p-8 shadow-soft-lg space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">AI Pair Programmer</h3>
              <p className="text-gray-300 leading-relaxed">
                Our AI assistant acts as your coding partner, understanding context and providing relevant suggestions. It analyzes your code in real-time and offers improvements, explanations, and alternative approaches.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Learn by Building</h3>
              <p className="text-gray-300 leading-relaxed">
                Instead of just reading tutorials, you'll build actual projects that you can showcase in your portfolio. Each project teaches you practical skills that are directly applicable to real-world development.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Step-by-Step Guidance</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Never get stuck. Our AI provides detailed explanations for every concept, helping you understand not just what to do, but why you're doing it. Example:
              </p>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-green-400 border border-gray-700">
                <code>{`// The AI explains why we use async/await
async function fetchUserData() {
  // async allows non-blocking operations
  const response = await fetch('/api/user');
  // await pauses until promise resolves
  return response.json();
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Interactive Debugging</h3>
              <p className="text-gray-300 leading-relaxed">
                When you encounter errors, the AI doesn't just tell you what's wrong—it explains the root cause, shows you how to fix it, and helps you understand how to prevent similar issues in the future.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
          <div className="glass rounded-xl p-8 shadow-soft-lg space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">What programming languages are supported?</h3>
              <p className="text-gray-300 leading-relaxed">
                Buildwithme supports JavaScript, TypeScript, Python, React, Node.js, and many other popular languages and frameworks. We're constantly adding support for new technologies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Do I need prior coding experience?</h3>
              <p className="text-gray-300 leading-relaxed">
                No! Buildwithme is designed for developers of all levels. Our AI adapts to your skill level, providing more detailed explanations for beginners and advanced tips for experienced developers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">How does the AI code review work?</h3>
              <p className="text-gray-300 leading-relaxed">
                The AI analyzes your code for best practices, potential bugs, performance issues, and code quality. It provides actionable feedback to help you write cleaner, more maintainable code.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Can I use my own projects?</h3>
              <p className="text-gray-300 leading-relaxed">
                Yes! You can import your existing projects or start new ones from scratch. The AI will assist you regardless of where your code comes from.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Is my code private and secure?</h3>
              <p className="text-gray-300 leading-relaxed">
                Absolutely. Your code is encrypted and stored securely. We never share your code with third parties, and you maintain full ownership of everything you create.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-gray-300 leading-relaxed">
                Have more questions? Visit our <Link href="/support" className="text-cyan-400 hover:text-cyan-300 underline">Support page</Link> for additional help and contact information.
              </p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-center">
          <Link 
            href="/"
            className="px-6 py-3 glass text-white font-semibold rounded-xl border border-gray-600 hover:border-cyan-400 transition-colors"
          >
            Back to Home
          </Link>
          <Link 
            href="/support"
            className="px-6 py-3 glass text-white font-semibold rounded-xl border border-gray-600 hover:border-cyan-400 transition-colors"
          >
            Get Support
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}

