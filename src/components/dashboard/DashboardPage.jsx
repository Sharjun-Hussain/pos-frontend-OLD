"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import Header from "./Header"; // Assuming you have this
import StatsGrid from "./StatsGrid";
import QuickActions from "./QuickAction";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const containerRef = useRef(null);

  useGSAP(() => {
    // Stagger entrance of all child elements with the class 'dashboard-item'
    gsap.from(".dashboard-item", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  return (
    <div className="relative" ref={containerRef}>
      <Header
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="p-8">
        {activeSection === "dashboard" && (
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* 1. Stats Section */}
            <div className="dashboard-item">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Overview</h2>
                <span className="text-sm text-muted-foreground bg-card px-3 py-1 rounded-full border border-border shadow-sm transition-colors duration-500">
                  Last updated: Just now
                </span>
              </div>
              <StatsGrid />
            </div>

            {/* 2. Quick Actions Section */}
            <div className="dashboard-item">
               <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Quick Access</h2>
              <QuickActions />
            </div>

            {/* 3. Placeholder for Activity (Example of Grid Layout) */}
            {/* <div className="dashboard-item grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
            </div> */}

          </div>
        )}
      </main>
    </div>
  );
}