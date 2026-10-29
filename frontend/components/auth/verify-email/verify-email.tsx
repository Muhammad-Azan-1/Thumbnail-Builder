"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import styles from "./verify-email.module.css";

const CODE_LENGTH = 6;

export default function VerifyEmailForm() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  function handleDigitChange(index: number, value: string) {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setShowValidation(false);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    setShowValidation(false);

    // Focus the next empty input or the last one
    const nextEmpty = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  }

  function getCodeError(): string {
    if (digits.some((d) => !d)) return "Please enter all 6 digits";
    return "";
  }

  const codeError = getCodeError();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (codeError) return;

    setIsSubmitting(true);
    try {
      const code = digits.join("");
      // TODO: Replace with actual API call
      console.log("Verification code submitted:", code);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResend() {
    // TODO: Replace with actual API call
    console.log("Resend verification code");
    setResendCountdown(60);
    setDigits(Array(CODE_LENGTH).fill(""));
    setShowValidation(false);
    inputRefs.current[0]?.focus();
  }

  if (isSuccess) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <div className="auth-success-icon">
            <CheckCircle2 aria-hidden="true" />
          </div>
          <h2>Email Verified!</h2>
          <p>Your email has been verified successfully. You can now access all features.</p>
          <Link href="/login" className="auth-submit-button" style={{ marginTop: 8, maxWidth: 260, textDecoration: "none" }}>
            <span className="font-mono">Continue to Sign In</span>
            <ArrowRight className="button-arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <Link href="/login" className="auth-back-link">
        <ArrowLeft aria-hidden="true" />
        Back to sign in
      </Link>

      <div className="auth-card-header">
        <p className="eyebrow font-mono">VERIFICATION</p>
        <h1>Check Your Email</h1>
        <p className="font-mono subtitle">Enter the code we sent you</p>
      </div>

      <div className="auth-info-box" style={{ marginBottom: 22 }}>
        <Mail aria-hidden="true" />
        <span>We&apos;ve sent a 6-digit verification code to your email address. It may take a moment to arrive.</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="field-label font-mono" id="otp-label">
            Verification Code <b>*</b>
          </label>
          <div className={styles.authOtpWrap} aria-labelledby="otp-label">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`${styles.authOtpInput} font-mono ${digit ? styles.filled : ""} ${showValidation && !digit ? "input-invalid" : ""}`}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={isSubmitting}
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          {showValidation && codeError && (
            <p className="auth-field-error" role="alert" style={{ textAlign: "center", marginTop: 10 }}>
              {codeError}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          <span className="font-mono">
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>
      </form>

      <div className={styles.authResendWrap}>
        <span>Didn&apos;t receive a code?</span>
        <button
          type="button"
          className={styles.authResendButton}
          onClick={handleResend}
          disabled={resendCountdown > 0 || isSubmitting}
        >
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
