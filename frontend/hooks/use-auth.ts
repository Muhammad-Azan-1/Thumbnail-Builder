import { useMutation } from "@tanstack/react-query";
import {
  EmailVerificationPayload,
  ForgotPasswordFormData,
  LoginFormData,
  LoginResponse,
  ResendEmailVerificationPayload,
  ResetPasswordPayload,
  SignupFormData,
} from "@/types/auth";
import { SignupUser , LoginUser, ResendVerificationEmail, forgotPassword, resetPassword, logoutUser, EmailVerification} from "@/lib/auth";


export function useSignupUser(){
    return useMutation({
        mutationFn : (data: SignupFormData) => SignupUser(data)
    })
}


export function useLoginUser(){
    return useMutation<LoginResponse, Error , LoginFormData>({
        mutationFn : (data: LoginFormData) => LoginUser(data)
        
    })
}



export function useEmailVerification(){
    return useMutation({
        mutationFn : (payload: EmailVerificationPayload) => EmailVerification(payload)
    })
}  

export function useResendVerificationEmail(){
    return useMutation({
        mutationFn : (payload: ResendEmailVerificationPayload) => ResendVerificationEmail(payload)
    })
}   


export function useForgotPassword(){
    return useMutation({
        mutationFn : (data: ForgotPasswordFormData) => forgotPassword(data)
    })

}
    
export function useResetPassword(){
    return useMutation({
        mutationFn : (data: ResetPasswordPayload) => resetPassword(data)
    })
}


export function useLogoutUser(){
    return useMutation({
        mutationFn : () => logoutUser()
    })
}


// In useMutation<LoginResponse, Error, LoginFormData>, the three types describe:

// LoginResponse — what the mutation returns when it succeeds.
// Error — the error type if it fails.
// LoginFormData — the input you pass to mutate or mutateAsync.
