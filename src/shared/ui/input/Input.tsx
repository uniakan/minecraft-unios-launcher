import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@shared/lib";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-forest-700 ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={cn(
              "input",
              {
                "border-red-400 focus:ring-red-400 bg-red-50/50": error,
              },
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-xs text-red-500 ml-1 animate-slide-up">{error}</p>
        ) : hint ? (
          <p className="text-xs text-forest-500 ml-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
