
import { LoginResponse } from "./auth"


export interface AuthState {
    user : LoginResponse | null ,
    isAuthenticated : boolean 
}