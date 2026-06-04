import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-graphite-100 text-graphite-700",
  gold: "bg-gold-100 text-gold-700",
  green: "bg-moss/15 text-moss",
  red: "bg-clay/15 text-clay",
  dark: "bg-graphite-900 text-white"
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
