import React from "react";
import { cn } from "../utils/cn";

export function Badge({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    brand: "bg-brand-100 text-brand-800 border-brand-200"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
