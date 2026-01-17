import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@shared/lib";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "btn font-medium transition-all duration-300 relative overflow-hidden active:scale-95",
          {
            // Primary: Fairy Green (숲의 생명력)
            "bg-gradient-to-r from-fairy-400 to-fairy-500 text-white hover:from-fairy-500 hover:to-fairy-600 shadow-lg shadow-fairy-400/30 hover:shadow-fairy-400/50 border border-transparent":
              variant === "primary",

            // Secondary: White/Glass (맑은 이슬)
            "bg-white/80 text-forest-700 hover:bg-white border border-white/60 hover:border-fairy-200 shadow-sm":
              variant === "secondary",

            // Outline
            "border-2 border-fairy-400 text-fairy-600 hover:bg-fairy-50":
              variant === "outline",

            // Ghost
            "hover:bg-fairy-100/50 text-forest-600 hover:text-forest-900":
              variant === "ghost",

            // Danger (Soft Red)
            "bg-red-100 text-red-600 hover:bg-red-200 border border-red-200":
              variant === "danger",

            "h-8 px-3 text-xs rounded-md": size === "sm",
            "h-10 px-4 py-2 text-sm rounded-lg": size === "md",
            "h-12 px-8 text-base rounded-xl": size === "lg",
            "opacity-70 cursor-not-allowed": disabled || isLoading,
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
        <span
          className={cn("flex items-center gap-2", { "opacity-0": isLoading })}
        >
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
