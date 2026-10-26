
export const BASE_API = "/api/v1/thumbnails"

export async function FETCH_API_METHOD<T>(endpoint : string , options? : RequestInit) : Promise<T> {
    try {

        const headers = new Headers(options?.headers)
        // setting content type 
        if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
            headers.set("Content-Type", "application/json")
        }

        const response = await fetch(`${BASE_API}/${endpoint}`,
        {
          ...options,
            headers 
        })

      if (!response.ok) {                                                                                                                                                      
          // 1. Try to read JSON error message from backend                                                                                                                      
          let errorMessage = `Request failed with status ${response.status}`;                                                                                                    
          try {
            const errorData = await response.json();
            console.log("errorData : ", errorData)
            errorMessage = errorData.message 
          } catch {
            const text = await response.text();
            if (text) errorMessage = text;
          }
  
          // 2. THROW the error so callers know it failed
          throw new Error(errorMessage);
        }
  
        const result = await response.json();
        return result.data as T;
        
      } catch (error: unknown) {
        // 3. ALWAYS re-throw the error! Do not 'return' inside catch!
        throw error instanceof Error ? error : new Error(String(error));
      }

}



  