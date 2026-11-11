import Link from "next/link";
import type { ReactNode } from "react";

import { contentSource } from "@/lib/posts";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <div className="site-shell">
        <header className="site-header">
          <Link href="/" className="brand">
            Field Notes
          </Link>
          <span className="source">content: {contentSource}</span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
