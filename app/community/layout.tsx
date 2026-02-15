"use client";

import CommunityNav from "@/components/CommunityNav";
import CommunityHeader from "@/components/CommunityHeader";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen code-pattern relative">
      <CommunityHeader />
      <CommunityNav />
      <div className="ml-16 pt-14">
        {children}
      </div>
    </div>
  );
}

