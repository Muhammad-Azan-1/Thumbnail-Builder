
export type RateLimitScope = "application" | "route";

export type CooldownStatus = {
    scope: "application" | "route";
    action: string;
    expires_at: string;
};
