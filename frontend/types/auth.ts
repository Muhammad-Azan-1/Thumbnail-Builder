import { type ChangeEvent} from 'react'

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
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
