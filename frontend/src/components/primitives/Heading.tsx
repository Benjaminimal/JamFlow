import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeadingProps = {
  children: ReactNode;
  className?: string;
};

export function H1({ children, className }: HeadingProps) {
  return (
    <h1 className={cn("text-2xl font-bold lg:text-4xl", className)}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: HeadingProps) {
  return (
    <h2 className={cn("text-xl font-semibold lg:text-3xl", className)}>
      {children}
    </h2>
  );
}

export function H3({ children, className }: HeadingProps) {
  return (
    <h3 className={cn("text-lg font-medium lg:text-2xl", className)}>
      {children}
    </h3>
  );
}
