"use client";

import { Search, Bell, User, Settings, Sun, Moon, LogOut, UserCircle, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const [notifications] = useState(3);
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all duration-500">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Dashboard Title */}
          <div className="flex items-center space-x-8">
            <h2 className="text-xl font-black text-foreground uppercase tracking-widest transition-colors duration-500">
              Dashboard
            </h2>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all duration-300">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-2 right-2 bg-[#10b981] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-card">
                  {notifications}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all duration-300 group"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
              ) : (
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all duration-300">
              <Settings className="w-5 h-5" />
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-border mx-2" />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 p-1 rounded-2xl hover:bg-sidebar-accent/50 transition-all duration-300 outline-none group">
                  <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-[#10b981]/50 transition-all">
                    <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                    <AvatarFallback className="bg-[#10b981]/10 text-[#10b981] text-xs font-bold">
                      {getUserInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left pr-2">
                    <div className="text-sm font-black text-foreground uppercase tracking-wider leading-tight">
                      {session?.user?.name || "User"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {session?.user?.roles?.[0]?.name || "ADMIN"}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-card border border-border shadow-2xl transition-all duration-500">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session?.user?.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent transition-colors">
                  <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent transition-colors">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-xl p-3 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-bold">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
