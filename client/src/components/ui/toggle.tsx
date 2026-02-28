import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Keep CVA-based API for compatibility but emit semantic classnames
const toggleVariants = cva("ui-toggle", {
  variants: {
    variant: {
      default: "ui-toggle--default",
      outline: "ui-toggle--outline",
    },
    size: {
      default: "ui-toggle--md",
      sm: "ui-toggle--sm",
      lg: "ui-toggle--lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size }), className)} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
