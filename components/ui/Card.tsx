import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  const hasPadding = /\bp-/.test(className);
  return (
    <div
      className={`bg-white dark:bg-stone-900 rounded-card shadow-card border border-stone-200/80 dark:border-stone-700 ${
        hasPadding ? "" : "p-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h2
      className={`font-display font-semibold text-pokemon-dark dark:text-stone-100 text-lg mb-4 ${className}`}
    >
      {children}
    </h2>
  );
}
