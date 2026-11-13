"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, Check, X, CheckCircle2 } from "lucide-react";
import PasswordInput from "../password-input/password-input";
import { getRedirectHref } from "@/lib/auth-redirect";
import { PASSWORD_REQUIREMENTS, getStrength } from "@/lib/auth";
import { useResetPassword } from "@/hooks/use-auth";

export default function ResetPasswordForm() {
  
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const {
    mutateAsync: resetPassword,
    isPending: isSubmitting,
    isError,
    error,
    isSuccess,
  } = useResetPassword();

  const reqResults = PASSWORD_REQUIREMENTS.map((r) => ({
    ...r,
    met: r.test(password),
  }));
  const metCount = reqResults.filter((r) => r.met).length;
  const strength = getStrength(metCount);

  function getPasswordError(): string {
    if (!password) return "Password is required";
    if (metCount < 5) return "Password does not meet all requirements";
    return "";
  }

  function getConfirmError(): string {
    if (!confirmPassword) return "Please confirm your new password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }

  function getTokenError(): string {
    if (!token) return "Invalid or missing reset token. Please request a new reset link.";
    return "";
  }

  const passwordError = getPasswordError();
  const confirmError = getConfirmError();
  const tokenError = getTokenError();
  const isFormValid = !passwordError && !confirmError && !tokenError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (!isFormValid) return;

    try {
      await resetPassword({ token: token!, new_password : password });
    } catch (err) {
      console.error("Reset password failed:", err);
    }
  }

  if (isSuccess) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 aria-hidden="true" />
          </div>
          <h2>Password Reset!</h2>
          <p>Your password has been updated successfully. You can now sign in with your new password.</p>
          <Link href={getRedirectHref("/login", redirect)} className="auth-submit-button" style={{ marginTop: 8, maxWidth: 260, textDecoration: "none" }}>
            <span className="font-mono">Sign In</span>
            <ArrowRight className="button-arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow font-mono">RESET PASSWORD</p>
        <h1>Set New Password</h1>
        <p className="font-mono subtitle">Choose a strong password for your account</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="reset-password">
            New Password <b>*</b>
          </label>
          <PasswordInput
            id="reset-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="Create a strong password"
            disabled={isSubmitting}
            invalid={showValidation && !!passwordError}
            autoComplete="new-password"
          />

          {password.length > 0 && (
            <div className="auth-strength-wrap">
              <div className="auth-strength-bar">
                <div
                  className="auth-strength-fill"
                  style={{ width: `${strength.percent}%`, background: strength.color }}
                />
              </div>
              <p className="auth-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}

          {password.length > 0 && (
            <ul className="auth-requirements" aria-label="Password requirements">
              {reqResults.map((req) => (
                <li key={req.label} className={`auth-requirement ${req.met ? "met" : ""}`}>
                  {req.met ? (
                    <Check className="auth-requirement-icon" aria-hidden="true" />
                  ) : (
                    <X className="auth-requirement-icon" aria-hidden="true" />
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
          )}

          {showValidation && passwordError && password.length === 0 && (
            <p className="auth-field-error" role="alert">{passwordError}</p>
          )}
        </div>

        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="reset-confirm">
            Confirm New Password <b>*</b>
          </label>
          <PasswordInput
            id="reset-confirm"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            placeholder="Re-enter your new password"
            disabled={isSubmitting}
            invalid={showValidation && !!confirmError}
            autoComplete="new-password"
          />
          {showValidation && confirmError && (
            <p className="auth-field-error" role="alert">{confirmError}</p>
          )}
        </div>

        {showValidation && tokenError && (
          <p className="auth-field-error" role="alert">{tokenError}</p>
        )}

        {isError && (
          <p className="auth-field-error" role="alert">
            {error instanceof Error && error.message
              ? error.message
              : "Could not reset your password. Please try again."}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          <span className="font-mono">
            {isSubmitting ? "Resetting password..." : "Reset Password"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
