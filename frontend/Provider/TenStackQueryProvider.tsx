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