
export class RateLimitError extends Error {
    // public readonly retryAfterExpiresAt: number | undefined;

    constructor(
        public readonly action: string | undefined,
        public readonly coolDownStatus : string | undefined, 
        public readonly retryAfterSeconds: number | undefined, //* public readonly  parameters are stored as property for the current instance automatically
        public readonly scope: any,
    ) {
        super("Too many requests. Please wait before trying again.");
        this.name = "RateLimitError";
        // this.retryAfterExpiresAt =
        //     retryAfterSeconds === undefined
        //         ? undefined
        //         : Date.now() + retryAfterSeconds * 1000;
    }
}



console.log(new RateLimitError("/login" , "stored" , 10 , "route"))