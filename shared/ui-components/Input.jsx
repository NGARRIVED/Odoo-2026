import React from "react";
import { cn } from "../utils/cn";

export const Input = React.forwardRef(
  ({ className, type = "text", label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Icon size={16} />
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
              Icon && "pl-10",
              error && "border-alert focus:ring-alert",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-alert">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
