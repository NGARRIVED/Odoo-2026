import React from "react";
import { cn } from "../utils/cn";
import { ChevronDown } from "lucide-react";

export const Select = React.forwardRef(
  ({ className, label, error, options = [], ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            className={cn(
              "flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-alert focus:ring-alert",
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <span className="text-xs text-alert">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
