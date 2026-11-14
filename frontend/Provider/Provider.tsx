'use client'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import {persistor, store} from '@/redux/store/store'
import { PersistGate } from "redux-persist/integration/react";


import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

const TenStackQueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())

  return (
    // redux store provider
  <Provider store={store}>   
      {/* // Redux PersistGate to delay rendering until the persisted state has been retrieved and saved to redux */}
      <PersistGate loading={null} persistor={persistor}>
    {/* // Ten Stack Query Client Provider to provide the query client to the application */}
    <QueryClientProvider client={queryClient}>
      {children}
        {/* React Query Devtools is a set of utilities for debugging and visualizing the state of your React Query cache.
         It provides a user interface that allows you to inspect queries, mutations, and their associated data, */}
        <ReactQueryDevtools initialIsOpen={false} />

    </QueryClientProvider>
    </PersistGate>
    </Provider>

   
  )
}

export default TenStackQueryProvider

//* About ten stack query cache
// There’s no cache persister configured there, such as PersistQueryClientProvider or persistQueryClient. 
// A browser refresh reloads the app and creates a new QueryClient, so the React Query cache is empty.
//  Your app separately restores the jobId from sessionStorage,
//  which is why the enabled query can fetch the job again.

// but if you want to persist the React Query cache across A browser refresh ,
// you can use the persistQueryClient function from @tanstack/react-query-persist-client.


// <QueryClientProvider client={queryClient}> React Query/TanStack Query ka shared context deta hai andar render hone wale saare components ko.

// Is context ke through components aur hooks:

// useQuery() se data fetch karke cache kar sakte hain.
// useMutation() se create/update/delete jaise actions chala sakte hain.
// useQueryClient() se shared cache ko read, update, ya invalidate kar sakte hain.
// queryClient khud API request nahi karta—woh queries, mutations aur unke cached data ko manage karta hai. 
// Aapke Provider.tsx mein children isi provider ke andar hain, isliye unke hooks ko yeh shared client milta hai