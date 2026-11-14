"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import GoogleAuthButton from "../google-auth/google-auth";
import PasswordInput from "../password-input/password-input";
import styles from "./login.module.css";
import { LoginErrors, LoginFormData } from "@/types/auth";
import { useLoginUser } from "@/hooks/use-auth";
import { getRedirectHref, getSafeRedirectPath } from "@/lib/auth-redirect";
import {useDispatch} from 'react-redux'
import {AppDispatch } from '@/redux/store/store'
import {login} from '@/redux/reducers/authReducer'

export default function LoginForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const { mutateAsync: loginUser, isPending: isSubmitting, isError, error , data } = useLoginUser();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showValidation, setShowValidation] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, checked } = e.currentTarget;
  if (name === "email" || name === "password") {
      setFormData((previous) => ({ ...previous, [name]: value }));
    } else if (name === "rememberMe") {
      setFormData((previous) => ({ ...previous, rememberMe: checked }));
    }

  }

  function validateForm(data: LoginFormData): LoginErrors {
  const errors: LoginErrors = {};

  if (!data.email.trim()) {
    errors.emailError = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.emailError = "Enter a valid email address";
  }

  if (!data.password) {
    errors.passwordError = "Password is required";
  } else if (data.password.length < 5) {
    errors.passwordError = "Password must be at least 8 characters";
  }

  return errors;
}

  const errors = validateForm(formData);
  const isFormValid = Object.keys(errors).length === 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (!isFormValid) return;

    try {
      await loginUser(formData);
      console.log("Login successful:", data);
      dispatch(login(data || null))
  

      router.replace(getSafeRedirectPath(redirect) ?? "/");
    } catch (err) {
      console.error("Login failed:", err);
    }
  }
  //* router.replace(...) navigates there without a full page reload and 
  //* replaces the login page in browser history. So pressing Back won’t 
  //* take the user straight back to the login page.

  function handleGoogleAuth() {
    // TODO: Implement Google OAuth flow
    console.log("Google auth triggered");
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow font-mono">WELCOME BACK</p>
        <h1>Sign In</h1>
        <p className="font-mono subtitle">Access your creative studio</p>
      </div>

  
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="login-email">
            Email <b>*</b>
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            className={`auth-input font-mono ${showValidation && errors.emailError ? "input-invalid" : ""}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
          {showValidation && errors.emailError && (
            <p className="auth-field-error" role="alert">{errors.emailError}</p>
          )}
        </div>

        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="login-password">
            Password <b>*</b>
          </label>
          <PasswordInput
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={isSubmitting}
            invalid={showValidation && !!errors.passwordError}
          />
          {showValidation && errors.passwordError && (
            <p className="auth-field-error" role="alert">{errors.passwordError}</p>
          )}
        </div>

        <div className={styles.authRow}>
          <label className={styles.authCheckboxLabel}>
            <input
              type="checkbox"
              name="rememberMe"
              className={styles.authCheckbox}
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            Remember me
          </label>
          <Link href={getRedirectHref("/forgot-password", redirect)} className="auth-link">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          <span className="font-mono">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>

        {isError && (
          <p className="auth-field-error" role="alert">
            {error instanceof Error ? error.message : "Login failed. Please try again."}
          </p>
        )}

      </form>

        <div className="auth-divider">
        <span>or</span>
      </div>


        <GoogleAuthButton onClick={handleGoogleAuth} disabled={isSubmitting} />

    

      <p className="auth-footer">
        Don&apos;t have an account?{" "}
        <Link href={getRedirectHref("/signup", redirect)} className="auth-link">
          Create one
        </Link>
      </p>

    
    </div>
  );
}



// agy --conversation=07895a77-6469-4992-95db-2011a36ce4d3
