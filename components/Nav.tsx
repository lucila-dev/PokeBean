"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PokeballIcon } from "@/components/PokeballIcon";
import { useTheme } from "@/components/ThemeProvider";

const protectedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/add", label: "Add Card" },
  { href: "/analytics", label: "Analytics" },
];

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

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
            className="flex items-center gap-2 font-brand font-semibold text-2xl sm:text-3xl tracking-tight text-pokemon-yellow hover:text-pokemon-yellow-light transition-colors focus-ring rounded-button py-2 px-1 shrink-0"
          >
            <PokeballIcon size={28} className="shrink-0" />
            <span>PokeBean</span>
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
                <li className="flex items-center gap-1 pl-2 border-l border-stone-600">
                  <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-button text-stone-200 hover:text-pokemon-yellow hover:bg-white/5 focus-ring"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  </button>
                  <Link
                    href="/profile"
                    aria-current={pathname === "/profile" ? "page" : undefined}
                    className={`flex items-center gap-2 min-h-[44px] py-2 pr-2 rounded-button focus-ring ${
                      pathname === "/profile"
                        ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold"
                        : "text-stone-200 hover:text-pokemon-yellow hover:bg-white/5"
                    }`}
                    title="Profile"
                  >
                    {session.user?.image ? (
                      <span className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-500 shrink-0">
                        <Image
                          src={session.user.image}
                          alt=""
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center text-pokemon-yellow text-sm font-semibold shrink-0">
                        {(session.user?.name || session.user?.email || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="text-sm max-w-[120px] truncate hidden sm:inline" title={session.user?.email ?? undefined}>
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
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
