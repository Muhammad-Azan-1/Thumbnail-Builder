import "./auth.css";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="studio-shell auth-shell">
      <div className="grain" aria-hidden="true" />
      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-mark" aria-hidden="true">
            TB
          </div>
        </div>
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </main>
  );
}
