"use client";

import { useEffect, useState } from "react";
import { Studio } from "@/components/Studio";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="font-mono text-[11px] text-[var(--fg-subtle)]">Loading Splicer Studio...</span>
        </div>
      </div>
    );
  }

  return <Studio />;
}
