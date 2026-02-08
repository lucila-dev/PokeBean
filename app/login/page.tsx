import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto text-center py-12 text-stone-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
