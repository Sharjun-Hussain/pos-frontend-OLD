"use client";

import { ChevronRight, LayoutGrid } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain({ items, label = "Platform" }) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-3">
      <SidebarGroupLabel className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-3 mb-2 opacity-80">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-2">
        {items.map((item) => {
          const isChildActive = item.items?.some((subItem) => pathname === subItem.url);
          const isParentActive = pathname === item.url || isChildActive;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isChildActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    isActive={isParentActive}
                    className={cn(
                      "h-11 px-3 rounded-xl transition-all duration-300 border border-transparent",
                      "hover:bg-zinc-100 hover:text-zinc-900",
                      isParentActive 
                        ? "bg-indigo-50 text-indigo-700 font-bold border-indigo-100 shadow-sm" 
                        : "text-zinc-600 font-bold"
                    )}
                  >
                    {item.icon ? (
                       <item.icon className={cn("size-4.5 transition-transform group-hover/collapsible:scale-110", isParentActive ? "text-indigo-700" : "text-zinc-500")} />
                    ) : (
                       <LayoutGrid className="size-4.5" />
                    )}
                    <span className="text-[13.5px] tracking-tight">{item.title}</span>
                    <ChevronRight className={cn(
                        "ml-auto size-4 transition-transform duration-300 opacity-60 group-data-[state=open]/collapsible:rotate-90",
                        isParentActive ? "text-indigo-700 opacity-100" : "text-zinc-400"
                    )} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="transition-all duration-300 overflow-hidden">
                  <SidebarMenuSub className="ml-4 pl-4 border-l-2 border-zinc-100 mt-2 gap-1.5">
                    {item.items?.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubItemActive} className={cn(
                            "h-9 px-3 rounded-lg transition-all text-[13px] border border-transparent",
                            isSubItemActive 
                              ? "text-indigo-700 font-black bg-indigo-50/70 border-indigo-100/50 translate-x-1" 
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:translate-x-1 font-bold"
                          )}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
