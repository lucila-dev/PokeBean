"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Card, CardTitle } from "@/components/ui/Card";

export function ProfileAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardTitle>Appearance</CardTitle>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
        Choose how PokeBean looks for you.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex-1 py-2.5 px-4 rounded-button text-sm font-medium border-2 transition-colors focus-ring ${
            theme === "light"
              ? "border-pokemon-blue bg-pokemon-blue-muted/50 dark:bg-pokemon-blue/20 text-pokemon-dark dark:text-stone-100"
              : "border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex-1 py-2.5 px-4 rounded-button text-sm font-medium border-2 transition-colors focus-ring ${
            theme === "dark"
              ? "border-pokemon-blue bg-pokemon-blue-muted/50 dark:bg-pokemon-blue/20 text-pokemon-dark dark:text-stone-100"
              : "border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500"
          }`}
        >
          Dark
        </button>
      </div>
    </Card>
  );
}
