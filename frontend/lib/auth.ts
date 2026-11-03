
import {FETCH_API_METHOD} from "@/lib/client";
import { ForgotPasswordFormData, LoginFormData, SignupFormData } from "@/types/auth";

const AUTH_API = "/api/v1/auth";


export async function SignupUser(data: SignupFormData) {
  return await FETCH_API_METHOD(`signup`, AUTH_API  , {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function LoginUser(data:LoginFormData) {
  return await FETCH_API_METHOD(`login`, AUTH_API  , {
    method: "POST",
    body: JSON.stringify(data),
  });
}


export async function EmailVerification(token: string) {
  return await FETCH_API_METHOD(`verify-email/${token}`, AUTH_API  , {
    method: "GET",
  });
}


export async function ResendVerificationEmail(email: string) {
  return await FETCH_API_METHOD(`resend-verification-email`, AUTH_API  , {
    method: "POST",
    body: JSON.stringify({email}),
  });
}


export async function forgotPassword( data : ForgotPasswordFormData) {
  return await FETCH_API_METHOD('forgot-password-verfication', AUTH_API , {
    method : "POST",
    body : JSON.stringify(data)
  })
}

export async function resetPassword(token:string , newPassword:string){
  return await FETCH_API_METHOD('reset-password', AUTH_API , {
    method : "POST",
    body : JSON.stringify({token , newPassword})
  })
}


export async function logoutUser(){
  return await FETCH_API_METHOD('logout', AUTH_API , {
    method : "POST",
  })
}

//* helper function for password strength check

export const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(p) },
];

export function getStrength(metCount: number) {
  if (metCount <= 1) return { label: "Weak", color: "#ef4444", percent: 20 };
  if (metCount <= 2) return { label: "Fair", color: "#f36b45", percent: 40 };
  if (metCount <= 3) return { label: "Medium", color: "#f2c94c", percent: 60 };
  if (metCount <= 4) return { label: "Strong", color: "#a8d86e", percent: 80 };
  return { label: "Very strong", color: "#71bd7b", percent: 100 };
}



