"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Check, X, CheckCircle2 } from "lucide-react";
import PasswordInput from "../ui/password-input";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(p) },
];

function getStrength(metCount: number) {
  if (metCount <= 1) return { label: "Weak", color: "#ef4444", percent: 20 };
  if (metCount <= 2) return { label: "Fair", color: "#f36b45", percent: 40 };
  if (metCount <= 3) return { label: "Medium", color: "#f2c94c", percent: 60 };
  if (metCount <= 4) return { label: "Strong", color: "#a8d86e", percent: 80 };
  return { label: "Very strong", color: "#71bd7b", percent: 100 };
}

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const passwordError = getPasswordError();
  const confirmError = getConfirmError();
  const isFormValid = !passwordError && !confirmError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call (include token from URL params)
      console.log("Reset password submitted:", { password });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      console.error("Reset password failed:", err);
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
          <h2>Password Reset!</h2>
          <p>Your password has been updated successfully. You can now sign in with your new password.</p>
          <Link href="/login" className="auth-submit-button" style={{ marginTop: 8, maxWidth: 260, textDecoration: "none" }}>
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
            value={password}
            onChange={setPassword}
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
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
            disabled={isSubmitting}
            invalid={showValidation && !!confirmError}
            autoComplete="new-password"
          />
          {showValidation && confirmError && (
            <p className="auth-field-error" role="alert">{confirmError}</p>
          )}
        </div>

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
