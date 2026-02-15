"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Roadmap {
  id: string;
  title: string;
  description: string;
  steps: string[];
  icon?: string;
}

const roadmaps: Record<string, Roadmap> = {
  frontend: {
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
  backend: {
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
  fullstack: {
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
  "mobile-android": {
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
  "mobile-ios": {
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
  "mobile-cross": {
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
  "data-analyst": {
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
  "data-scientist": {
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
  "ml-engineer": {
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
  devops: {
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
  "cloud-architect": {
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
  "ethical-hacking": {
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
  "security-analyst": {
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
  qa: {
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
  "game-dev": {
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
  "embedded-iot": {
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
  web3: {
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
};

export default function RoadmapPage({
  params,
}: {
  params: { id: string };
}) {
  const roadmap = roadmaps[params.id];

  if (!roadmap) {
    return (
      <main className="min-h-screen code-pattern relative">
        <Navbar />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Roadmap Not Found</h1>
            <p className="text-gray-400 mb-6">The roadmap "{params.id}" does not exist.</p>
            <Link
              href="/learn"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              ← Back to Learn
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Learn</span>
          </Link>
          
          <div className="flex items-start gap-4 mb-4">
            {roadmap.icon && (
              <div className="text-5xl flex-shrink-0">{roadmap.icon}</div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {roadmap.title}
              </h1>
              <p className="text-gray-400 text-lg">{roadmap.description}</p>
            </div>
          </div>
        </header>

        {/* Roadmap Steps */}
        <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
          <h2 className="text-2xl font-bold mb-6 text-white">Learning Path</h2>
          
          <div className="space-y-4">
            {roadmap.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 glass rounded-xl p-5 border border-gray-700 hover:border-cyan-400/50 transition-colors"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-lg font-semibold text-white mb-1">{step}</h3>
                </div>
                
                {/* Connector Line (except last) */}
                {index < roadmap.steps.length - 1 && (
                  <div className="absolute left-[29px] top-[58px] w-0.5 h-12 bg-gradient-to-b from-cyan-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">Ready to start your learning journey?</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Start Building Projects
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}





