import {FETCH_API_METHOD} from "@/lib/client";
import {CooldownStatus} from '@/types/rateLimit'


const COOLDOWN_API = '/api/v1/cooldowntimer'


export async function cooldownTimer() {
    return await FETCH_API_METHOD<CooldownStatus[]>(COOLDOWN_API , "cooldowns"  , {
        method : 'GET'
    } )
}