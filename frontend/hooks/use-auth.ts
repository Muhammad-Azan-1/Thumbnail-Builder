import { useMutation } from "@tanstack/react-query";
import { SignupFormData , LoginFormData, ForgotPasswordFormData } from "@/types/auth";
import { SignupUser , LoginUser, ResendVerificationEmail, forgotPassword, resetPassword, logoutUser, EmailVerification} from "@/lib/auth";


export function useSignupUser(){
    return useMutation({
        mutationFn : (data: SignupFormData) => SignupUser(data)
    })
}


export function useLoginUser(){
    return useMutation({
        mutationFn : (data: LoginFormData) => LoginUser(data)
    })
}



export function useEmailVerification(){
    return useMutation({
        mutationFn : (token: string) => EmailVerification(token)
    })
}  

export function useResendVerificationEmail(){
    return useMutation({
        mutationFn : (email: string) =>   ResendVerificationEmail(email)
    })
}   


export function useForgotPassword(){
    return useMutation({
        mutationFn : (data: ForgotPasswordFormData) => forgotPassword(data)
    })

}
    
export function useResetPassword(){
    return useMutation({
        mutationFn : ({token , newPassword} : {token : string , newPassword : string}) => 
            resetPassword(token , newPassword)
    })
}


export function useLogoutUser(){
    return useMutation({
        mutationFn : () => logoutUser()
    })
}