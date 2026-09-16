import { useMutation } from '@tanstack/react-query'
import { uploadHeadShot } from '@/lib/upload'


// ten stack query used for testing in this project only !

export function useUploadHeadshot() {
  return useMutation({
    mutationFn: (file: File) => uploadHeadShot(file),
  })
}



//? Types of hooks

//* useQuery → for anything that reads data without changing it (GET requests). Fetching thumbnails, 
//* fetching a job's status — you're asking "what's out there?" and nothing changes as a result.

//* useMutation → for anything that changes data (POST, PUT, PATCH, DELETE). Creating a job, uploading a headshot,
//*  deleting a thumbnail — you're saying "make something different happen on the server."

//? Summary

// user query hook jab use krte hay jab server se data lena (read krna ) huta hay
// or use mutation hook jab use krte hay jab server per data bhejna (create krna)  huta hay


//? Line-by-Line Breakdown


//* 1. import { useMutation } from '@tanstack/react-query'
// useMutation is TanStack Query's hook for actions that change data on the server (like POST, PUT, DELETE, or uploading files). 


//* 2. mutationFn: (file: File) => uploadHeadShot(file)
// This tells TanStack Query: "When someone calls this mutation, run uploadHeadShot(file) as the actual background API job."    


//* 3. What TanStack Query Automatically Does For You
  
  // When you call useUploadHeadshot() inside any UI component:
  
    // const { mutate or mutateAsync , isPending, isError, error, data } = useUploadHeadshot()
  
  // TanStack Query automatically tracks 4 things behind the scenes:
  
  // 1. isPending (boolean): Starts as false. The moment you call mutate(file), TanStack Query automatically turns isPending to    
  // true. When the upload finishes, it turns back to false. (No need for setLoading(true)!)

  // 2. data: Holds whatever uploadHeadShot(file) returned (e.g. { headshot_url: "https://..." }).

  // 3. isError & error: If the server crashes or network fails, TanStack Query catches the error, sets isError = true, and places 
  // the error message in error.

  // 4. mutate(file) or mutateAsync(file): A trigger function you call whenever the user selects a file.

  // 5. mutate function call this mutationFn: (file: File) => uploadHeadShot(file),

