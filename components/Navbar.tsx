"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileMenu from "./ProfileMenu";

/**
 * Navbar Component
 * 
 * Site navigation bar with links to main pages.
 * Auth-aware: shows Login or Logout button based on authentication status.
 */
export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status by checking for auth cookie
  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const authCookie = cookies.find((cookie) => cookie.trim().startsWith("auth="));
      const isAuth = authCookie?.split("=")[1] === "true";
      setIsAuthenticated(isAuth);
    };

    checkAuth();
    // Re-check periodically to catch auth changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Buildwithme
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
              <Link href="/learn" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Learn
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
              <Link href="/community" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Community
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
              <Link href="/docs" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Docs
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
              <Link href="/support" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Support
              </Link>
            </motion.div>
            {isAuthenticated ? (
              <ProfileMenu />
            ) : (
              <Link href="/login">
                <motion.button
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
