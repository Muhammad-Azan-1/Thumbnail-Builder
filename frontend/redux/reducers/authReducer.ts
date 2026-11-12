import { createSlice , PayloadAction } from "@reduxjs/toolkit";
import {AuthState} from '@/types/authState'
import {LoginResponse} from '@/types/auth'


const initialState : AuthState = {
    user : null,
    isAuthenticated : false
}

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        login : (state , action: PayloadAction<LoginResponse>)=>{

            state.user = action.payload
            state.isAuthenticated = true
        },

        logout : (state , action: PayloadAction<any>) =>{
            state.user = null
            state.isAuthenticated = false
        },

        updateUser : (state , action: PayloadAction<Partial<LoginResponse>>) =>{
            if (state.user) {
                Object.assign({} ,state.user, action.payload);
            }
        }
    }

})




export const {login , logout , updateUser } = authSlice.actions
export  default authSlice.reducer