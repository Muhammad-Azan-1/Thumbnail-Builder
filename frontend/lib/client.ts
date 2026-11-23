
import {logout} from '@/redux/reducers/authReducer'
import { store } from "@/redux/store/store";


const REFRESH_ACCESS_TOKEN_URL = "/api/v1/auth/refresh-access-token";


async function refreshAccessToken(): Promise< "refreshed" | "expired"> {
    console.log("CALLED REFRESH ACCESS TOKEN FUNCTION FROM FRONTEND")
    try {
        const refreshRequest = await fetch(REFRESH_ACCESS_TOKEN_URL, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
        })

        console.log("REPONSE RECEIVED FROM  REFRESH ACCESS TOKEN FRONTEND  : " , refreshRequest)

         if (refreshRequest.ok) return "refreshed"

        if (!refreshRequest.ok && refreshRequest.status == 401) return 'expired'
          
          const errorData = await refreshRequest.json()
          throw new Error(errorData.message ?? "Request Failed")
        
    } catch (error) {
          // 5xx responses and other temporary failures don't log the user out.
        throw error instanceof Error ? error : new Error(String(error));

    }

}

async function endSession() {
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


export async function FETCH_API_METHOD<T>(endpoint : string , basePath: string, options? : RequestInit) : Promise<T> {
    console.log("calling fetch API method")
    try {

        const headers = new Headers(options?.headers)
        // setting content type 
        if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
            headers.set("Content-Type", "application/json")
        }

        const url = `${basePath}/${endpoint}`;
        const requestOptions: RequestInit = {
            ...options,
            headers,
            credentials: options?.credentials ?? "include",
        };

        let response = await fetch(url, requestOptions); // main request



        //* for access token error only
        if (!response.ok && response.status === 401) { // if access token get expired then we get status 401

            const errorData =  await response.json();

            if(errorData.name == 'INVALID_ACCESS_TOKEN'){
              
            const refreshed = await refreshAccessToken(); // re generating new acess token from refresh token

            if (refreshed == 'refreshed') { // if access and refresh tokens are generated 
            
                response = await fetch(url, requestOptions); // again calling the API which get blocke due to acess token

              }else{  // if refresh token is also invalid
             
                await endSession() // empty user redux auth state , logged them out ,  send them to login page                       
               throw new Error("Your session expired. Please log in again.");
              }

            }else{
              //* for all other 401 errors
                throw new Error(errorData.message ?? "Request failed"); // This message is displayed by the frontend.
            }
          
        
        }


        if(!response.ok && response.status == 429){

        }


        //* for all other errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message ?? "Request failed"); // This message is displayed by the frontend.
        }
  
        const result = await response.json();
        return result.data as T;
        
      } catch (error: unknown) {
        // 3. ALWAYS re-throw the error! Do not 'return' inside catch!
        throw error instanceof Error ? error : new Error(String(error));
      }

}



  