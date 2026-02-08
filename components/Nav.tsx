"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const protectedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/add", label: "Add Card" },
  { href: "/analytics", label: "Analytics" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav
      className="bg-pokemon-dark text-white shadow-card border-b border-pokemon-dark-muted"
      role="navigation"
      aria-label="Main"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16 min-h-[44px]">
          <Link
            href="/"
            className="font-brand font-semibold text-xl tracking-tight text-pokemon-yellow hover:text-pokemon-yellow-light transition-colors focus-ring rounded-button py-2 px-1 shrink-0"
          >
            PokeBean
          </Link>
          <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
            {status === "loading" ? (
              <li className="text-stone-400 text-sm">Loading…</li>
            ) : session ? (
              <>
                {protectedLinks.map(({ href, label }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={`
                          block min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-3 rounded-button text-sm font-medium transition-colors
                          focus-ring
                          ${
                            isActive
                              ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold"
                              : "text-stone-200 hover:text-pokemon-yellow hover:bg-white/5"
                          }
                        `}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
                <li className="flex items-center gap-2 pl-2 border-l border-stone-600">
                  <span className="text-stone-300 text-sm max-w-[140px] truncate" title={session.user?.email ?? undefined}>
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 rounded-button text-sm font-medium text-stone-200 hover:text-pokemon-yellow hover:bg-white/5 focus-ring"
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    aria-current={pathname === "/login" ? "page" : undefined}
                    className={`
                      block min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-3 rounded-button text-sm font-medium transition-colors focus-ring
                      ${pathname === "/login" ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold" : "text-stone-200 hover:text-pokemon-yellow hover:bg-white/5"}
                    `}
                  >
                    Log in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    aria-current={pathname === "/register" ? "page" : undefined}
                    className={`
                      block min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-3 rounded-button text-sm font-medium transition-colors focus-ring
                      ${pathname === "/register" ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold" : "text-stone-200 hover:text-pokemon-yellow hover:bg-white/5"}
                    `}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
