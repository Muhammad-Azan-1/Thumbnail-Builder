
import {createRateLimitError} from './rateLimit'
import { endSession , refreshAccessToken } from './refreshAccessToken'


//* Main API caller function
export async function FETCH_API_METHOD<T>(basePath: string, endpoint: string, options?: RequestInit): Promise<T> {
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


        if (response.status === 429) {
            throw createRateLimitError(response);
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



  