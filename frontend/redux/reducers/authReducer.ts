import { createSlice } from "@reduxjs/toolkit";
import {AuthState} from '@/types/authState'

const initialState : AuthState = {
    user : null,
    isAuthenticated : false
}

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        login : (state , action)=>{

            state.user = action.payload
            state.isAuthenticated = true
        },

        logout : (state , action) =>{
            state.user = null
            state.isAuthenticated = false
        },

        updateUser : (state , action) =>{
                state.user = {...state.user , ...action.payload}
        }
    }

})




export const {login , logout , updateUser } = authSlice.actions
export  default authSlice.reducer