
import {RateLimitScope} from '@/types/rateLimit'

export class RateLimitError extends Error {
    public readonly retryAfterExpiresAt: number | undefined;

    constructor(
        public readonly action: string | undefined,
        public readonly coolDownStatus : string | undefined, 
        public readonly retryAfterSeconds: number | undefined, //* public readonly  parameters are stored as property for the current instance automatically
        public readonly scope: RateLimitScope,
    ) {
        super("Too many requests. Please wait before trying again.");
        this.name = "RateLimitError";
        this.retryAfterExpiresAt =
            retryAfterSeconds === undefined
                ? undefined
                : Date.now() +  retryAfterSeconds * 1000;
    }
}

//* this function will return the remaning timer for the rate limit
function parseRetryAfter(
    retryAfter: string | null,
    resetAt: string | null,
): number | undefined {

    if (retryAfter !== null) {
        const seconds = Number(retryAfter);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.ceil(seconds);
        }

        const retryDate = Date.parse(retryAfter);
        if (!Number.isNaN(retryDate)) {
            return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
        }
    }

    // SlowAPI's reset header is an absolute Unix timestamp; use it if Retry-After is absent.
    if (resetAt !== null) {
        const resetTimestamp = Number(resetAt);
        if (Number.isFinite(resetTimestamp)) {
            return Math.max(0, Math.ceil(resetTimestamp - Date.now() / 1000));
        }
    }

    return undefined;
}

export function createRateLimitError(response: Response): RateLimitError {

    const scopeHeader = response.headers.get("X-RateLimit-Scope");
    const actionHeader = response.headers.get("X-RateLimit-Action")
    const coolDownStatus = response.headers.get("X-Cooldown-Status")

    const scope: RateLimitScope =
        scopeHeader === "application" ? "application" : "route";

    return new RateLimitError(
        actionHeader || undefined,
        coolDownStatus || undefined,
        parseRetryAfter(
            response.headers.get("Retry-After"),
            response.headers.get("X-RateLimit-Reset"),
        ),
        scope,
    );
}



// retryAfterSeconds is the wait duration parsed from the rate-limit response. retryAfterExpiresAt is the absolute time when that wait ends, calculated as Date.now() + retryAfterSeconds * 1000.

// For example, if the server says “wait 30 seconds,” retryAfterSeconds is 30, and retryAfterExpiresAt is a timestamp 30 seconds in the future, in milliseconds. The timer uses the fixed expiry so rerendering doesn’t restart the full 30-second countdown.