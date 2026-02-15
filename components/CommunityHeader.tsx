"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileMenu from "./ProfileMenu";

/**
 * Community Header Component
 * 
 * Consistent header for all /community/* pages.
 * Shows Buildwithme logo, Back button, context (project name or "Community"), and Logout.
 */
export default function CommunityHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string>("/dashboard");

  useEffect(() => {
    // Check if user came from a project page
    // We'll check URL params, sessionStorage, or referrer
    const checkProjectContext = () => {
      // Check sessionStorage for project context (set when navigating from project page)
      const storedProjectId = sessionStorage.getItem("lastProjectId");
      const storedProjectName = sessionStorage.getItem("lastProjectName");
      
      if (storedProjectId && storedProjectName) {
        setProjectName(storedProjectName);
        setBackUrl(`/dashboard/projects/${storedProjectId}`);
      } else {
        // Check referrer
        const referrer = document.referrer;
        const projectMatch = referrer.match(/\/dashboard\/projects\/([^\/]+)/);
        if (projectMatch) {
          const projectId = projectMatch[1];
          // Try to get project name from localStorage or fetch it
          const projects = JSON.parse(localStorage.getItem("projects") || "[]");
          const project = projects.find((p: any) => p.id === projectId);
          if (project) {
            setProjectName(project.name);
            setBackUrl(`/dashboard/projects/${projectId}`);
          }
        }
      }
    };

    checkProjectContext();
  }, []);

  const handleBack = () => {
    // Use browser history if available, otherwise use computed backUrl
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(backUrl);
    }
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-800 h-14 flex items-center">
      <div className="w-full px-4 md:px-6 flex items-center justify-between">
        {/* Left: Logo + Back Button + Context */}
        <div className="flex items-center gap-3">
          {/* Buildwithme Logo */}
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
          >
            Buildwithme
          </Link>
          
          <div className="h-5 w-px bg-gray-700"></div>
          
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-800/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          
          {/* Context: Project Name or "Community" */}
          {projectName ? (
            <>
              <div className="h-5 w-px bg-gray-700"></div>
              <h1 className="text-lg md:text-xl font-semibold text-white truncate max-w-md">
                {projectName}
              </h1>
            </>
          ) : (
            <>
              <div className="h-5 w-px bg-gray-700"></div>
              <h1 className="text-lg md:text-xl font-semibold text-white truncate max-w-md">
                Community
              </h1>
            </>
          )}
        </div>

        {/* Right: Profile Menu */}
        <div className="flex items-center">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

