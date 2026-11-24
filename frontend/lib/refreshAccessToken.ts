
import {logout} from '@/redux/reducers/authReducer'
import { store } from "@/redux/store/store";

const REFRESH_ACCESS_TOKEN_URL = "/api/v1/auth/refresh-access-token";


//* This function is used to generate new access token using refresh when user access token got expired
export async function refreshAccessToken(): Promise< "refreshed" | "expired"> {
    try {
        const refreshRequest = await fetch(REFRESH_ACCESS_TOKEN_URL, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
        })

        console.log("REPONSE RECEIVED FROM  REFRESH ACCESS TOKEN FRONTEND  : " , refreshRequest)

         if (refreshRequest.ok) return "refreshed"

        if (!refreshRequest.ok && refreshRequest.status == 401) return 'expired'

        if (refreshRequest.status === 429) {
            // throw createRateLimitError(refreshRequest);
        }
          
          const errorData = await refreshRequest.json()
          throw new Error(errorData.message ?? "Request Failed")
        
    } catch (error) {
          // 5xx responses and other temporary failures don't log the user out.
        throw error instanceof Error ? error : new Error(String(error));

    }

}


//* if access and refresh token expires this function logout user and send to login
export async function endSession() {
  store.dispatch(logout());

  try {
    const response = await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Backend could not clear the session cookies.");
    }
  } catch (error) {
    console.error("Could not reach the logout endpoint:", error);
  }

const returnTo = `${window.location.pathname}${window.location.search}`;
console.log("User Current page" , returnTo)
const loginUrl = new URL("/login", window.location.origin);


loginUrl.searchParams.set("reason", "session-expired");
loginUrl.searchParams.set("redirect", returnTo);

window.location.replace(`${loginUrl.pathname}${loginUrl.search}`);
}
