"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import styles from "./verify-email.module.css";
import { getRedirectHref } from "@/lib/auth-redirect";
import { useEmailVerification } from "@/hooks/use-auth";

const CODE_LENGTH = 6;

export default function VerifyEmailForm() {

  const  {mutateAsync : verifyEmail , isPending: isSubmitting, isError, error , isSuccess } = useEmailVerification()

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const token = searchParams.get("token");

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [showValidation, setShowValidation] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedLinkToken = useRef<string | null>(null);


  // Verify email links automatically; focus the OTP input only for manual verification.
  useEffect(() => {
    if (token) {
      if (submittedLinkToken.current !== token) {
        submittedLinkToken.current = token;
        void verifyEmail({ verification_token: token }).catch((err: unknown) => {
          console.error("Email link verification failed:", err);
        });
      }
      return;
    }

    inputRefs.current[0]?.focus();
  }, [token, verifyEmail]);

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

    try {
      const code = digits.join("");

      const result = await verifyEmail({ otp: code });
      console.log("Email verification successful:", result);

    } catch (err) {
      console.error("Verification failed:", err);
    }
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
          <Link href={getRedirectHref("/login", redirect)} className="auth-submit-button" style={{ marginTop: 8, maxWidth: 260, textDecoration: "none" }}>
            <span className="font-mono">Continue to Sign In</span>
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
          {isError && (
            <p className="auth-field-error" role="alert" style={{ textAlign: "center", marginTop: 10 }}>
              {error instanceof Error && error.message
                ? error.message
                : "Email verification failed. Please try again."}
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
        <Link
          href={getRedirectHref("/resend-email-verification", redirect)}
          className={styles.authResendButton}
        >
          Resend verification email
        </Link>
      </div>
    </div>
  );
}
