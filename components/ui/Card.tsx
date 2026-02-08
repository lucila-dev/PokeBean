import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-card shadow-card border border-stone-200/80 p-6 ${className}`}
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
      className={`font-display font-semibold text-pokemon-dark text-lg mb-4 ${className}`}
    >
      {children}
    </h2>
  );
}
