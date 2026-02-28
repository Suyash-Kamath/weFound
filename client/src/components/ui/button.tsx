import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "hero" | "ghost" | "link" | "accent" | "destructive";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  asChild?: boolean;
}

const variantMap: Record<string, string> = {
  default: "btn-default",
  outline: "btn-outline",
  hero: "btn-hero",
  ghost: "btn-ghost",
  link: "btn-link",
  accent: "btn-accent",
  destructive: "btn-destructive",
};

const sizeMap: Record<string, string> = {
  default: "btn-md",
  sm: "btn-sm",
  lg: "btn-lg",
  xl: "btn-xl",
  icon: "btn-icon",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp: any = asChild ? Slot : "button";
  const classes = cn("btn", variantMap[variant] || variantMap.default, sizeMap[size] || sizeMap.default, className);
  return <Comp ref={ref} className={classes} {...props} />;
});

Button.displayName = "Button";

export { Button };

// compatibility helper for components that previously used `buttonVariants` (CVA)
export function buttonVariants(opts?: { variant?: string; size?: string; className?: string }) {
  const { variant = "default", size = "default", className = "" } = opts || {};
  return cn("btn", variantMap[variant] || variantMap.default, sizeMap[size] || sizeMap.default, className);
}

// ButtonProps already exported above as interface
