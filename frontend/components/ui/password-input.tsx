"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { type ChangeEvent} from 'react'
import {PasswordInputProps} from '@/types/auth'



export default function PasswordInput({
  id,
  value,
  name,
  onChange,
  placeholder = "Enter your password",
  disabled = false,
  invalid = false,
  autoComplete = "current-password",
}: PasswordInputProps) {
  
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-input-wrap">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        className={`auth-input font-mono ${invalid ? "input-invalid" : ""}`}
        value={value}
        name={name}
        onChange={(e) => onChange(e)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShowPassword((s) => !s)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff aria-hidden="true" />
        ) : (
          <Eye aria-hidden="true" />
        )}
      </button>
      
    </div>
  );
}
