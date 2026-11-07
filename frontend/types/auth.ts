import { type ChangeEvent} from 'react'

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  redirect?: string;
}


export interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  autoComplete?: string;
  name : string
}

export interface SignupErrors{
    nameError : string ;
    emailError : string;
    passwordError : string;
    confirmPasswordError : string; 
}


export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginErrors {
  emailError?: string;
  passwordError?: string;
}


export interface ForgotPasswordFormData {
  email: string;
  redirect?: string;
}



export interface LoginResponse {
  id: string;                                                                         
  full_name: string;                                                              
  email: string;                                                             
  avatar_url: string;                                          
  is_verified: boolean                                                              
  created_at: string
  access_token : string

}