import { ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning";

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
  role?: "alert" | "status";
  className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
  error:
    "bg-semantic-error-light border-semantic-error text-semantic-error [&_strong]:text-semantic-error",
  success:
    "bg-semantic-success-light border-semantic-success text-green-800 [&_strong]:text-green-900",
  warning:
    "bg-semantic-warning-light border-semantic-warning text-amber-800 [&_strong]:text-amber-900",
};

export function Alert({
  children,
  variant = "error",
  role = "alert",
  className = "",
}: AlertProps) {
  return (
    <div
      role={role}
      className={`rounded-card border-l-4 py-4 px-4 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
