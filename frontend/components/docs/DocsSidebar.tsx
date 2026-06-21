"use client";

import { docsNavigation } from "@/lib/docs/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-8">
      {docsNavigation.map((section) => (
        <div key={section.title}>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#555]">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`group relative block rounded-r py-2 pl-4 pr-3 font-mono text-sm transition ${
                      active
                        ? "border-l-2 border-[#c8f135] bg-[#c8f135]/8 text-[#f5f5f5]"
                        : "border-l-2 border-transparent text-[#777] hover:border-[#333] hover:bg-white/[0.03] hover:text-[#ccc]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}