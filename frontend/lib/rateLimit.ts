
import {RateLimitScope} from '@/types/rateLimit'

export class RateLimitError extends Error {
    constructor(
        public readonly retryAfterSeconds: number | undefined, //* public readonly  parameters are stored as property for the current instance automatically
        public readonly scope: RateLimitScope,
    ) {
        super("Too many requests. Please wait before trying again.");
        this.name = "RateLimitError";
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
    const scope: RateLimitScope =
        scopeHeader === "application" ? "application" : "route";

    return new RateLimitError(
        parseRetryAfter(
            response.headers.get("Retry-After"),
            response.headers.get("X-RateLimit-Reset"),
        ),
        scope,
    );
}
