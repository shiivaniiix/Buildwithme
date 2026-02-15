"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Roadmap data structure
interface Roadmap {
  id: string;
  title: string;
  description: string;
  steps: string[];
  icon?: string;
}

// Note data structure
interface Note {
  id: string;
  title: string;
  level: string;
  category: string;
  icon?: string;
}

// Roadmaps - Role-based learning paths
const roadmaps: Roadmap[] = [
  {
    id: "frontend",
    title: "Frontend Developer",
    description: "Build user-facing web applications",
    icon: "🎨",
    steps: [
      "HTML & CSS",
      "JavaScript Basics",
      "Git & Version Control",
      "Modern Frameworks (React)",
      "State Management",
      "Testing",
      "Performance Optimization",
      "Build Projects"
    ]
  },
  {
    id: "backend",
    title: "Backend Developer",
    description: "Build server-side applications and APIs",
    icon: "⚙️",
    steps: [
      "Programming Fundamentals",
      "Server-Side Languages",
      "Databases & SQL",
      "API Design",
      "Authentication & Security",
      "Caching & Performance",
      "Deployment",
      "Build Projects"
    ]
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",
    description: "Master both frontend and backend development",
    icon: "🚀",
    steps: [
      "Frontend Basics",
      "Backend Basics",
      "Database Design",
      "API Integration",
      "Authentication",
      "Deployment",
      "DevOps Basics",
      "Build Full Projects"
    ]
  },
  {
    id: "mobile-android",
    title: "Android Developer",
    description: "Build native Android applications",
    icon: "🤖",
    steps: [
      "Java/Kotlin Basics",
      "Android Studio",
      "UI/UX Design",
      "Activities & Fragments",
      "Data Storage",
      "Networking",
      "Publishing",
      "Build Apps"
    ]
  },
  {
    id: "mobile-ios",
    title: "iOS Developer",
    description: "Build native iOS applications",
    icon: "🍎",
    steps: [
      "Swift Basics",
      "Xcode",
      "UIKit/SwiftUI",
      "Navigation",
      "Data Persistence",
      "Networking",
      "App Store",
      "Build Apps"
    ]
  },
  {
    id: "mobile-cross",
    title: "Cross-platform Developer",
    description: "Build apps for multiple platforms",
    icon: "📱",
    steps: [
      "React Native / Flutter",
      "Platform APIs",
      "State Management",
      "Navigation",
      "Native Modules",
      "Testing",
      "Publishing",
      "Build Apps"
    ]
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    description: "Analyze data to drive business decisions",
    icon: "📊",
    steps: [
      "Excel & Spreadsheets",
      "SQL",
      "Data Visualization",
      "Statistics Basics",
      "Python for Data",
      "Business Intelligence",
      "Reporting",
      "Build Projects"
    ]
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    description: "Extract insights from complex data",
    icon: "🔬",
    steps: [
      "Python/R",
      "Statistics & Math",
      "Data Cleaning",
      "Machine Learning Basics",
      "Deep Learning",
      "Data Visualization",
      "Model Deployment",
      "Build Projects"
    ]
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    description: "Build and deploy ML systems",
    icon: "🤖",
    steps: [
      "Python & Math",
      "ML Algorithms",
      "Deep Learning",
      "MLOps",
      "Model Training",
      "Model Deployment",
      "Production Systems",
      "Build Projects"
    ]
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    description: "Automate and optimize development workflows",
    icon: "🔧",
    steps: [
      "Linux Basics",
      "Scripting",
      "CI/CD",
      "Docker",
      "Kubernetes",
      "Cloud Platforms",
      "Monitoring",
      "Build Infrastructure"
    ]
  },
  {
    id: "cloud-architect",
    title: "Cloud Architect",
    description: "Design scalable cloud solutions",
    icon: "☁️",
    steps: [
      "Cloud Fundamentals",
      "AWS/Azure/GCP",
      "Architecture Patterns",
      "Networking",
      "Security",
      "Cost Optimization",
      "Disaster Recovery",
      "Build Solutions"
    ]
  },
  {
    id: "ethical-hacking",
    title: "Ethical Hacking / Pentesting",
    description: "Find and fix security vulnerabilities",
    icon: "🔓",
    steps: [
      "Networking Basics",
      "Linux",
      "Penetration Testing",
      "Web Security",
      "Network Security",
      "Tools & Techniques",
      "Reporting",
      "Practice Labs"
    ]
  },
  {
    id: "security-analyst",
    title: "Security Analyst",
    description: "Protect systems from threats",
    icon: "🛡️",
    steps: [
      "Security Fundamentals",
      "Threat Analysis",
      "SIEM Tools",
      "Incident Response",
      "Compliance",
      "Risk Assessment",
      "Security Policies",
      "Build Skills"
    ]
  },
  {
    id: "qa",
    title: "Software Testing / QA",
    description: "Ensure software quality and reliability",
    icon: "✅",
    steps: [
      "Testing Fundamentals",
      "Test Planning",
      "Manual Testing",
      "Automation Testing",
      "Test Frameworks",
      "CI/CD Integration",
      "Bug Tracking",
      "Build Test Suites"
    ]
  },
  {
    id: "game-dev",
    title: "Game Developer",
    description: "Create interactive games",
    icon: "🎮",
    steps: [
      "Game Design Basics",
      "Game Engines",
      "Programming",
      "Graphics & Animation",
      "Physics",
      "Audio",
      "Publishing",
      "Build Games"
    ]
  },
  {
    id: "embedded-iot",
    title: "Embedded Systems & IoT",
    description: "Build hardware-software systems",
    icon: "🔌",
    steps: [
      "Electronics Basics",
      "Microcontrollers",
      "C/C++",
      "Sensors & Actuators",
      "Communication Protocols",
      "RTOS",
      "IoT Platforms",
      "Build Projects"
    ]
  },
  {
    id: "web3",
    title: "Web3 / Blockchain Developer",
    description: "Build decentralized applications",
    icon: "⛓️",
    steps: [
      "Blockchain Basics",
      "Cryptography",
      "Smart Contracts",
      "Web3.js / Ethers.js",
      "DeFi Concepts",
      "NFTs",
      "dApp Development",
      "Build Projects"
    ]
  }
];

// Notes - Topic-based reference materials
const notes: Note[] = [
  // Web / Programming
  {
    id: "html-css",
    title: "HTML & CSS",
    level: "Beginner",
    category: "Web / Programming",
    icon: "🌐"
  },
  {
    id: "javascript",
    title: "JavaScript",
    level: "Beginner",
    category: "Web / Programming",
    icon: "📜"
  },
  {
    id: "react",
    title: "React",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "⚛️"
  },
  {
    id: "typescript",
    title: "TypeScript",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "📘"
  },
  {
    id: "nodejs",
    title: "Node.js",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "🟢"
  },
  {
    id: "python",
    title: "Python",
    level: "Beginner",
    category: "Web / Programming",
    icon: "🐍"
  },
  {
    id: "django-flask",
    title: "Django / Flask",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "🐍"
  },
  // Data / AI
  {
    id: "sql",
    title: "SQL",
    level: "Beginner",
    category: "Data / AI",
    icon: "🗄️"
  },
  {
    id: "data-science-basics",
    title: "Data Science Basics",
    level: "Beginner",
    category: "Data / AI",
    icon: "📊"
  },
  {
    id: "ml-basics",
    title: "Machine Learning Basics",
    level: "Intermediate",
    category: "Data / AI",
    icon: "🤖"
  },
  // DevOps / Systems
  {
    id: "git-github",
    title: "Git & GitHub",
    level: "Beginner",
    category: "DevOps / Systems",
    icon: "📦"
  },
  {
    id: "linux-basics",
    title: "Linux Basics",
    level: "Beginner",
    category: "DevOps / Systems",
    icon: "🐧"
  },
  {
    id: "docker-basics",
    title: "Docker Basics",
    level: "Intermediate",
    category: "DevOps / Systems",
    icon: "🐳"
  }
];

export default function LearnPage() {
  // Group notes by category
  const notesByCategory = notes.reduce((acc, note) => {
    if (!acc[note.category]) {
      acc[note.category] = [];
    }
    acc[note.category].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Learn
          </h1>
          <p className="text-gray-400 text-lg">
            Role-based roadmaps and topic-based notes to guide your learning
          </p>
        </header>

        {/* Roadmaps Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Roadmaps</h2>
            <p className="text-gray-400 text-sm">What to learn & in what order</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <Link
                key={roadmap.id}
                href={`/learn/roadmaps/${roadmap.id}`}
                className="glass-strong rounded-2xl p-6 shadow-soft-xl border border-gray-700 hover:border-cyan-400 transition-all hover:shadow-cyan-500/20 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  {roadmap.icon && (
                    <div className="text-4xl flex-shrink-0">{roadmap.icon}</div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                      {roadmap.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{roadmap.description}</p>
                  </div>
                </div>
                
                {/* Steps Preview */}
                <div className="space-y-2">
                  {roadmap.steps.slice(0, 4).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <span className="text-gray-300 text-sm">{step}</span>
                    </div>
                  ))}
                  {roadmap.steps.length > 4 && (
                    <div className="text-gray-500 text-xs ml-7">
                      +{roadmap.steps.length - 4} more steps
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Notes</h2>
            <p className="text-gray-400 text-sm">Quick reference and study materials</p>
          </div>

          {Object.entries(notesByCategory).map(([category, categoryNotes]) => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-300 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/learn/notes/${note.id}`}
                    className="glass rounded-xl p-5 border border-gray-700 hover:border-cyan-400 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {note.icon && (
                        <div className="text-2xl flex-shrink-0">{note.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors mb-1">
                          {note.title}
                        </h4>
                        <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                          {note.level}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <Footer />
    </main>
  );
}
