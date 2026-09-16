
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

        if (!response.ok){
            const errorBody = await response.text();

            throw new Error(errorBody || `Request Failed with status ${response.status}`)
        }

        return await response.json()


    } catch(error : unknown){
        throw error instanceof Error ? error : new Error(String(error))
    }

}



  