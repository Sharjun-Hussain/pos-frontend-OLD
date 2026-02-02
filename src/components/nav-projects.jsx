"use client";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavProjects({ projects, label, type }) {
  const { isMobile, state } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-3 group-data-[collapsible=icon]:hidden">
      {label && (
        <SidebarGroupLabel className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-3 mb-2 opacity-80">
            {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="gap-2">
        {projects.map((item) => {
          const isActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive}
                className={cn(
                    "h-11 px-3 rounded-xl transition-all duration-300 group border border-transparent",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 font-bold border-indigo-100 shadow-sm" 
                      : "text-zinc-600 font-bold hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Link
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 w-full"
                  )}
                >
                  <item.icon className={cn("size-4.5 transition-transform group-hover:scale-110", isActive ? "text-indigo-700" : "text-zinc-500")} />
                  <span className="text-[13.5px] tracking-tight">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
