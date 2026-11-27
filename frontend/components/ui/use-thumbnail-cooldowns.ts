import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RATE_LIMIT_ACTIONS } from "@/constants";
import { useCooldown } from "@/hooks/use-cooldown";
import type { CooldownStatus } from "@/types/rateLimit";
import type {
  ThumbnailCooldownKey,
  ThumbnailCooldowns,
  ThumbnailRateLimitErrors,
} from "@/types/props";

const EMPTY_COOLDOWNS: CooldownStatus[] = [];

const COOLDOWN_ACTIONS: Record<ThumbnailCooldownKey, string> = {
  retrySingle: RATE_LIMIT_ACTIONS.thumbnails.retryThumbnail,
  retryAll: RATE_LIMIT_ACTIONS.thumbnails.retryJob,
  deleteSingle: RATE_LIMIT_ACTIONS.thumbnails.deleteThumbnail,
  deleteAll: RATE_LIMIT_ACTIONS.thumbnails.deleteJob,
};

export function useThumbnailCooldowns(
  rateLimitErrors: ThumbnailRateLimitErrors,
) {
  const queryClient = useQueryClient();
  const { data: records = EMPTY_COOLDOWNS } = useCooldown();
  const [now, setNow] = useState(() => Date.now());

  const applicationExpiry = Math.max(
    0,
    ...records
      .filter((record) => record.scope === "application")
      .map((record) => Date.parse(record.expires_at))
      .filter(Number.isFinite),
  );

  const expiryByAction = Object.fromEntries(
    (Object.keys(COOLDOWN_ACTIONS) as ThumbnailCooldownKey[]).map((key) => {
      const routeExpiry = Math.max(
        0,
        ...records
          .filter(
            (record) =>
              record.scope === "route" &&
              record.action === COOLDOWN_ACTIONS[key],
          )
          .map((record) => Date.parse(record.expires_at))
          .filter(Number.isFinite),
      );

      return [
        key,
        Math.max(
          applicationExpiry,
          routeExpiry,
          rateLimitErrors[key]?.retryAfterExpiresAt ?? 0,
        ),
      ];
    }),
  ) as Record<ThumbnailCooldownKey, number>;

  const cooldowns = Object.fromEntries(
    (Object.keys(COOLDOWN_ACTIONS) as ThumbnailCooldownKey[]).map((key) => [
      key,
      { isActive: expiryByAction[key] > now },
    ]),
  ) as ThumbnailCooldowns;

  const activeCooldownKeys = Object.entries(cooldowns)
    .filter(([, cooldown]) => cooldown.isActive)
    .map(([key]) => key)
    .join("|");


  const latestExpiry = Math.max(0, ...Object.values(expiryByAction));
  const hasUnexpiredRateLimitError = Object.values(rateLimitErrors).some(
    (error) =>
      error !== undefined &&
      (error.retryAfterExpiresAt === undefined ||
        error.retryAfterExpiresAt > now),
  );
  const isActive = latestExpiry > now;

  useEffect(() => {
    if (!isActive) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [isActive]);



  //*
  useEffect(() => {
    // Remove expired records while preserving cooldowns still active elsewhere.
     const current =  queryClient.getQueryData<typeof records>(["cooldown"])
     if(!current) return

     const unexpired = current.filter((record)=>{
        const expirey = Date.parse(record.expires_at)
        return Number.isFinite(expirey) && expirey > now
     })

     if(unexpired.length !== current.length){
        queryClient.setQueryData<typeof records>(["cooldown"], unexpired)
     }


  }, [activeCooldownKeys, queryClient, records]);
  

  return {
    cooldowns,
    showMessage: isActive || hasUnexpiredRateLimitError,
    secondsRemaining: Math.max(0, Math.ceil((latestExpiry - now) / 1000)),
  };
}

// This hook figures out which retry or delete buttons should be disabled, and how long the cooldown message should show.
// - COOLDOWN_ACTIONS matches each button type to the route name the backend uses.
// - useCooldown() gets the cooldown records saved in the shared query cache.
// - For each action, the hook checks for an application wide cooldown and a cooldown for that action’s route.
// - It also checks the expiry time from a recent 429 error. That lets the UI react before the backend cooldown query finishes refreshing.
// - If an action’s expiry is still in the future, its flag becomes active. For example, cooldowns.retrySingle.isActive tells the single retry button whether to disable.
// - The hook updates the clock once a second so expired cooldowns become inactive and the countdown changes.
// - It returns the individual button flags, whether to show the message, and the countdown.

// For your main case: a retry gets a 429 → the retry cooldown becomes active → the affected retry button disables → the message shows its countdown. Delete uses the same mechanism, but under its own action key, so a delete cooldown won’t disable retry buttons.
