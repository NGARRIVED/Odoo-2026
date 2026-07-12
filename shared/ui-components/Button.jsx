import React from "react";
import { cn } from "../utils/cn";

export const Button = React.forwardRef(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    const variants = {
      primary: "bg-brand-900 text-white hover:bg-brand-800 shadow-sm",
      secondary: "bg-brand-500 text-white hover:bg-blue-600 shadow-sm",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
      danger: "bg-alert text-white hover:bg-red-600 shadow-sm",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
