
import {FETCH_API_METHOD} from "@/lib/client";
import {
  EmailVerificationPayload,
  ForgotPasswordFormData,
  LoginFormData,
  ResendEmailVerificationPayload,
  SignupFormData,
  LoginResponse,
  ResetPasswordPayload,
  GoogleAuthPayload
} from "@/types/auth";



const AUTH_API = "/api/v1/auth";


export async function SignupUser(data: SignupFormData) {
  return await FETCH_API_METHOD(AUTH_API, `register`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function LoginUser(data:LoginFormData) : Promise<LoginResponse> {
  return await FETCH_API_METHOD<LoginResponse>(AUTH_API, `login`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}


export async function EmailVerification(payload: EmailVerificationPayload) {
  return await FETCH_API_METHOD(AUTH_API, `verify-email`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function ResendVerificationEmail(payload: ResendEmailVerificationPayload) {
  return await FETCH_API_METHOD(AUTH_API, `resend-email-verification`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function forgotPassword( data : ForgotPasswordFormData) {
  return await FETCH_API_METHOD(AUTH_API, 'forgot-password-verfication', {
    method : "POST",
    body : JSON.stringify(data)
  })
}

export async function resetPassword(data: ResetPasswordPayload) {
  return await FETCH_API_METHOD(AUTH_API, 'reset-password', {
    method : "POST",
    body : JSON.stringify(data)
  })
}


export async function logoutUser(){
  return await FETCH_API_METHOD(AUTH_API, 'logout', {
    method : "POST",
  })
}


export async function googleAuth(data : GoogleAuthPayload): Promise<LoginResponse>{
    return await FETCH_API_METHOD<LoginResponse>(AUTH_API, 'google-auth', {
      method : 'POST',
      body : JSON.stringify(data)
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

