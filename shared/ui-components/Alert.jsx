import React from "react";
import { cn } from "../utils/cn";
import { Info } from "lucide-react";

export function Alert({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700",
        className
      )}
      {...props}
    >
      <Info className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}
