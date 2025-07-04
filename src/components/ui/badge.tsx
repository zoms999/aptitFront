import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800", 
    outline: "border border-gray-300 text-gray-700 bg-white"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export { Badge }; 