"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Check, X } from "lucide-react";
import GoogleAuthButton from "./google-auth";
import PasswordInput from "../ui/password-input";
import {SignupFormData , SignupErrors} from '@/types/auth'
import {PASSWORD_REQUIREMENTS , getStrength} from '@/lib/auth'


export default function SignupForm() {


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);


  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });


  function handleChange(e: ChangeEvent<HTMLInputElement>) {
  
    const { name, value } = e.currentTarget;
    if (
      name === "fullName" ||
      name === "email" ||
      name === "password" ||
      name === "confirmPassword"
    ) {
      setFormData((previous) => ({ ...previous, [name]: value }));
    }
  }


  // Live password analysis (always computed, not gated by showValidation)
  const reqResults = PASSWORD_REQUIREMENTS.map((r) => ({
    ...r,
    met: r.test(formData.password),
  }));

  const metCount = reqResults.filter((r) => r.met).length;
  const strength = getStrength(metCount);



 function validateForm(data : SignupFormData){

     const errors :  Partial<Record<keyof SignupErrors, string>> = {
     
     };

     if (!data.fullName.trim()) errors.nameError = "Full name is required";

  if (!data.email.trim()) {
    errors.emailError = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.emailError = "Enter a valid email address";
  }

  if (!data.password) {
    errors.passwordError = "Password is required";
  } 
  // else if (/* password requirements aren't all met */) {
  //   errors.password = "Password does not meet all requirements";
  // }

  if (!data.confirmPassword) {
    errors.confirmPasswordError = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPasswordError = "Passwords do not match";
  }

  return errors;

  }
const errors = validateForm(formData);
const isFormValid = Object.keys(errors).length === 0;


  async function handleSubmit(e: FormEvent) {

    e.preventDefault();
    setShowValidation(true);
    if (!isFormValid) return;


    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log("Signup submitted:", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (err) {
      console.error("Signup failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleAuth() {
    // TODO: Implement Google OAuth flow
    console.log("Google auth signup triggered");
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow font-mono">GET STARTED</p>
        <h1>Create Account</h1>
        <p className="font-mono subtitle">Start building stunning thumbnails</p>
      </div>

     
      <form className="auth-form" onSubmit={handleSubmit} noValidate>

        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="signup-name">
            Full Name <b>*</b>
          </label>
          <input
            id="signup-name"
            name="fullName"
            type="text"
            className={`auth-input font-mono ${showValidation && errors.nameError ? "input-invalid" : ""}`}
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={isSubmitting}
            autoComplete="name"
          />
          {showValidation && errors.nameError && (
            <p className="auth-field-error" role="alert">{errors.nameError}</p>
          )}
        </div>

        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="signup-email">
            Email <b>*</b>
          </label>
          <input
            id="signup-email"
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
          <label className="field-label font-mono" htmlFor="signup-password">
            Password <b>*</b>
          </label>
          <PasswordInput
            id="signup-password"
            value={formData.password}
            onChange={handleChange}
            name="password"
            placeholder="Create a strong password"
            disabled={isSubmitting}
            invalid={showValidation && !!errors.passwordError}
            autoComplete="new-password"
          />

          {/* Live password strength bar — shown when user starts typing */}
          {formData.password.length > 0 && (
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

          {/* Live requirements checklist — shown when user starts typing */}
          {formData.password.length > 0 && (
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

          {showValidation && errors.passwordError && formData.password.length === 0 && (
            <p className="auth-field-error" role="alert">{errors.passwordError}</p>
          )}
        </div>


        <div className="auth-field">
          <label className="field-label font-mono" htmlFor="signup-confirm">
            Confirm Password <b>*</b>
          </label>
          <PasswordInput
            id="signup-confirm"
            value={formData.confirmPassword}
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Re-enter your password"
            disabled={isSubmitting}
            invalid={showValidation && !!errors.confirmPasswordError}
            autoComplete="new-password"
          />
          {showValidation && errors.confirmPasswordError && (
            <p className="auth-field-error" role="alert">{errors.confirmPasswordError}</p>
          )}
        </div>




        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          <span className="sparkle" aria-hidden="true">✦</span>
          <span className="font-mono">
            {isSubmitting ? "Creating account..." : "Create Account"}
          </span>
          {isSubmitting ? (
            <LoaderCircle className="button-loader" aria-hidden="true" />
          ) : (
            <ArrowRight className="button-arrow" aria-hidden="true" />
          )}
        </button>




      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>


       <GoogleAuthButton onClick={handleGoogleAuth} disabled={isSubmitting} label="Sign up with Google" />


      <p className="auth-footer">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
