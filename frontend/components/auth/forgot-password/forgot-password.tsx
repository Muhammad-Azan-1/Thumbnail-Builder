"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { getRedirectHref } from "@/lib/auth-redirect";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function getEmailError(): string {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    return "";
  }

  const emailError = getEmailError();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (emailError) return;

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log("Forgot password submitted:", { email });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      console.error("Forgot password failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 aria-hidden="true" />
          </div>
          <h2>Check Your Inbox</h2>
          <p>
            We&apos;ve sent a password reset link to <strong style={{ color: "#f7f3ec" }}>{email}</strong>. 
            Check your email and follow the instructions.
          </p>
          <div className="auth-info-box" style={{ marginTop: 4, textAlign: "left" }}>
            <Mail aria-hidden="true" />
            <span>The link will expire in 15 minutes. Check your spam folder if you don&apos;t see it.</span>
          </div>
          <Link href={getRedirectHref("/login", redirect)} className="auth-submit-button" style={{ marginTop: 8, maxWidth: 260, textDecoration: "none" }}>
            <span className="font-mono">Back to Sign In</span>
            <ArrowRight className="button-arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <Link href={getRedirectHref("/login", redirect)} className="auth-back-link">
        <ArrowLeft aria-hidden="true" />
        Back to sign in
      </Link>

      <div className="auth-card-header">
        <p className="eyebrow font-mono">ACCOUNT RECOVERY</p>
        <h1>Forgot Password?</h1>
        <p className="font-mono subtitle">We&apos;ll send you a reset link</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="forgot-email">
            Email Address <b>*</b>
          </label>
          <input
            id="forgot-email"
            type="email"
            className={`auth-input font-mono ${showValidation && emailError ? "input-invalid" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
          {showValidation && emailError && (
            <p className="auth-field-error" role="alert">{emailError}</p>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          <span className="font-mono">
            {isSubmitting ? "Sending link..." : "Send Reset Link"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password?{" "}
        <Link href={getRedirectHref("/login", redirect)} className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
