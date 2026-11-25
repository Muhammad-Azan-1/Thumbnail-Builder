
import {cooldownTimer } from "@/lib/cooldown";
import { useQuery } from "@tanstack/react-query";

export function useCooldown(){
    return useQuery({
        queryKey: ['cooldown'],
        queryFn: cooldownTimer,
        retry: false,
        refetchOnWindowFocus: false,
    })
}