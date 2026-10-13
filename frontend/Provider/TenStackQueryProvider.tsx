'use client'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

const TenStackQueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
        <ReactQueryDevtools initialIsOpen={false} />

    </QueryClientProvider>
  )
}

export default TenStackQueryProvider


// There’s no cache persister configured there, such as PersistQueryClientProvider or persistQueryClient. A browser refresh reloads the app and creates a new QueryClient, so the React Query cache is empty. Your app separately restores the jobId from sessionStorage, which is why the enabled query can fetch the job again.