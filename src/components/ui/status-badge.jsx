import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Reusable StatusBadge component for consistent UI across the application.
 * 
 * @param {Object} props
 * @param {string|boolean} props.value - The value to determine the status (e.g., true/false, "active", "pending")
 * @param {string} props.className - Additional classes for customization
 * @param {string} props.label - Optional explicit label. If omitted, it will derive from the value.
 */
export function StatusBadge({ value, className, label }) {
  // Normalize value
  const val = String(value).toLowerCase();
  const isTrue = value === true || val === "active" || val === "true" || val === "cleared" || val === "completed" || val === "received" || val === "approved";
  const isPending = val === "pending" || val === "processing";
  const isVoid = val === "void" || val === "cancelled" || val === "bounced" || val === "destructive";
  const isPaid = val === "paid";
  const isSuccess = val === "success" || val === "failed" || val === "failure";

  let badgeStyles = "text-[10px] font-black tracking-widest px-3 py-1 shadow-sm border-none leading-none h-6 flex items-center justify-center";
  let statusLabel = label || (isTrue ? (val === "cleared" ? "Cleared" : val === "completed" ? "Completed" : val === "received" ? "Received" : val === "approved" ? "Approved" : "Active") : "Inactive");

  if (isTrue) {
    badgeStyles = cn(badgeStyles, "bg-emerald-500 hover:bg-emerald-600 text-white");
  } else if (isPending) {
    badgeStyles = cn(badgeStyles, "bg-amber-500 hover:bg-amber-600 text-white");
    statusLabel = label || "Pending";
  } else if (isVoid) {
    badgeStyles = cn(badgeStyles, "bg-red-500 hover:bg-red-600 text-white");
    statusLabel = label || (val === "bounced" ? "Bounced" : "Void");
  } else if (isPaid) {
    badgeStyles = cn(badgeStyles, "bg-blue-500 hover:bg-blue-600 text-white");
    statusLabel = label || "Paid";
  } else if (isSuccess) {
    if (val === "success") {
      badgeStyles = cn(badgeStyles, "bg-emerald-500 hover:bg-emerald-600 text-white");
      statusLabel = label || "Success";
    } else {
      badgeStyles = cn(badgeStyles, "bg-red-500 hover:bg-red-600 text-white");
      statusLabel = label || (val === "failed" ? "Failed" : "Failure");
    }
  } else {
    // Default/Inactive
    badgeStyles = cn(badgeStyles, "bg-slate-400 hover:bg-slate-500 text-white");
    statusLabel = label || "Inactive";
  }

  return (
    <Badge className={cn(badgeStyles, className)}>
      {statusLabel}
    </Badge>
  );
}
