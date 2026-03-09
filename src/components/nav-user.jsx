"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  ShieldCheck,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils"

export function NavUser({
  user
}) {
  const { isMobile, state } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "h-12 w-12 p-0 flex items-center justify-center transition-all duration-300 rounded-full mx-auto",
                  "hover:bg-white/10",
                  "data-[state=open]:bg-white/10"
                )}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 rounded-full border-none shadow-none group-hover:scale-105 transition-transform duration-300 overflow-hidden bg-zinc-800">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-zinc-800 text-[11px] font-bold text-white uppercase">
                      {(user.name || "U").substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#10b981] border-2 border-[#0B1521]" />
                </div>
                
                {state !== "collapsed" && (
                  <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                    <span className="truncate text-[13.5px] font-black text-white tracking-tight">
                      {user.name}
                    </span>
                    <span className="truncate text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none mt-1">
                      Security Session
                    </span>
                  </div>
                )}
                
                {state !== "collapsed" && (
                  <Settings className="ml-auto size-4 text-zinc-400 group-hover:text-white transition-colors" />
                )}
              </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-2xl bg-white border-zinc-200 p-2 shadow-2xl shadow-zinc-300/50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-4 bg-zinc-50 rounded-xl mb-1 border border-zinc-100/50">
                <Avatar className="h-11 w-11 rounded-xl border-2 border-white shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-zinc-900 text-white font-bold">
                    {(user.name || "U").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-black text-zinc-900 text-[14px]">{user.name}</span>
                  <span className="truncate text-[11px] text-zinc-600 font-bold underline decoration-zinc-200">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 mx-1 mb-1" />
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem className="gap-3 p-3 rounded-xl focus:bg-zinc-50 focus:text-zinc-900 transition-all group">
                <ShieldCheck className="size-4.5 text-zinc-500 group-focus:text-indigo-600" />
                <span className="text-[13.5px] font-black">Privacy Control</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 p-3 rounded-xl focus:bg-zinc-50 focus:text-zinc-900 transition-all group">
                <BadgeCheck className="size-4.5 text-zinc-500 group-focus:text-indigo-600" />
                <span className="text-[13.5px] font-black">License Tiers</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-100 mx-1 mt-1" />
            <DropdownMenuItem 
              className="gap-3 p-3 rounded-xl focus:bg-red-50 focus:text-red-700 text-red-600 transition-all font-black mt-1"
              onClick={() => signOut()}
            >
              <LogOut className="size-4.5" />
              <span className="text-[13px] uppercase tracking-widest">Terminate Access</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
