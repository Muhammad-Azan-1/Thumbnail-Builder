
export type RateLimitScope = "application" | "route";

export type CooldownStatus = {
    scope: "application" | "route";
    action: string;
    expires_at: string;
};


export type CooldownTimerState = {
  isActive: boolean;
  // secondsRemaining: number;
  // isApplicationCooldownActive: boolean;
};

export type UseCooldownTimerProps = {
  action: string | readonly string[];
  isRateLimited: boolean;
  retryAfterExpiresAt: number | undefined;
  onCooldownChange: (state: CooldownTimerState) => void;
};
