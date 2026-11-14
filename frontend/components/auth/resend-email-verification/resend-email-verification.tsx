"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, LoaderCircle } from "lucide-react";
import { useResendVerificationEmail } from "@/hooks/use-auth";
import { getRedirectHref } from "@/lib/auth-redirect";

export default function ResendEmailVerificationForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const {
    mutateAsync: resendVerificationEmail,
    isPending: isSubmitting,
    isError,
    error,
    isSuccess,
  } = useResendVerificationEmail();

  const emailError = !email.trim()
    ? "Email is required"
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? ""
      : "Enter a valid email address";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (emailError) return;

    try {
      await resendVerificationEmail({
        email: email.trim(),
        ...(redirect ? { redirect } : {}),
      });
    } catch (submitError) {
      console.error("Resending verification email failed:", submitError);
    }
  }

  return (
    <div className="auth-card">
      <Link href={getRedirectHref("/email-verification", redirect)} className="auth-back-link">
        <ArrowLeft aria-hidden="true" />
        Back to email verification
      </Link>

      <div className="auth-card-header">
        <p className="eyebrow font-mono">EMAIL VERIFICATION</p>
        <h1>Resend Verification Email</h1>
        <p className="font-mono subtitle">Enter your email and we&apos;ll send you a new code</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="resend-verification-email">
            Email Address <b>*</b>
          </label>
          <input
            id="resend-verification-email"
            type="email"
            className={`auth-input font-mono ${showValidation && emailError ? "input-invalid" : ""}`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
          {showValidation && emailError && (
            <p className="auth-field-error" role="alert">{emailError}</p>
          )}
        </div>

        {isError && (
          <p className="auth-field-error" role="alert">
            {error instanceof Error && error.message
              ? error.message
              : "Could not resend the verification email. Please try again."}
          </p>
        )}

        <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
          <span className="font-mono">
            {isSubmitting ? "Sending email..." : "Resend Verification Email"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>
        
        {isSuccess && (
          <p
            className="auth-field-hint"
            role="status"
            style={{ color: "var(--orange)", fontSize: "var(--text-sm)" }}
          >
            If an unverified account exists for this email, we&apos;ve sent a
            verification code. Please check your inbox.
          </p>
        )}
      </form>
    </div>
  );
}
