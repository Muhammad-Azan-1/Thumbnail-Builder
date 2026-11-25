"use client";

import { useEffect, useState } from "react";
import { useCooldown } from "@/hooks/use-cooldown";
import {UseCooldownTimerProps} from '@/types/rateLimit'



export default function CooldownTimer({
  action,
  isRateLimited,
  retryAfterExpiresAt,
  onCooldownChange,
}: UseCooldownTimerProps) {

  console.log("Function Cool Down Timer Get Called")
  // Fetch active cooldown records saved by the backend.
  const {data: cooldowns = [],isError: isCooldownStatusError, error: cooldownStatusError,} = useCooldown();

  console.log(cooldowns , "DATA")
  // Read the current time on each render to avoid using a stale time when a cooldown starts.
  const [, setClockTick] = useState(0); // only used to trigger re-render
  const now = Date.now();

  // Track whether a countdown has started for the current 429 error.
  const [hasObservedCooldownForError, setHasObservedCooldownForError] =
    useState(false);

    //* application cooldown
  // Application cooldowns apply to all actions, so match by scope.
  const applicationCooldown = cooldowns.find(
    (cooldown) => cooldown.scope === "application",
  );
  // Convert the selected cooldown expiration timestamps into milliseconds.
  const applicationExpiry = applicationCooldown ? Date.parse(applicationCooldown.expires_at) : 0;
  // Treat missing or invalid timestamps as no cooldown.
  const validApplicationExpiry = Number.isFinite(applicationExpiry) ? applicationExpiry : 0;

  //* Route cooldown
  // Route cooldowns apply only when their action matches this component's route.
  const actions: readonly string[] = typeof action === "string" ? [action] : action;
  const routeExpiries = cooldowns
    .filter(
      (cooldown) =>
        cooldown.scope === "route" && actions.includes(cooldown.action),
    )
    .map((cooldown) => Date.parse(cooldown.expires_at))
    .filter(Number.isFinite);
  const validRouteExpiry = Math.max(0, ...routeExpiries);


  
  // Use the response's Retry-After immediately, then keep any later stored expiry.
  const expiresAt = Math.max(validApplicationExpiry, validRouteExpiry, isRateLimited ? retryAfterExpiresAt ?? 0 : 0,
  );

  // Calculate the time remaining, rounded up to whole seconds and never below zero.
  const secondsRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  // A cooldown is active while its expiration time is still in the future.
  const isActive = secondsRemaining > 0;

  // Keep the app-wide cooldown status separate for parent controls that affect all actions.
  const isApplicationCooldownActive = Math.ceil((validApplicationExpiry - now) / 1000) > 0;

  useEffect(() => {
    if (!isActive) return;

    // Trigger a render each second while counting down, then clear the interval.
    const intervalId = window.setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt, isActive]);


  useEffect(() => {
    // Let the parent update controls, such as disabling a button during cooldown.
    onCooldownChange({
      isActive,

    });
  }, [
    isActive,
    isApplicationCooldownActive,
    onCooldownChange,
    secondsRemaining,
  ]);


  useEffect(() => {
    // Reset this marker when there is no 429; set it when an active cooldown is found.
    if (!isRateLimited) {
      setHasObservedCooldownForError(false);
    } else if (isActive) {
      setHasObservedCooldownForError(true);
    }
  }, [isActive, isRateLimited]);


  useEffect(() => {
    // Report failures from the cooldown-status request for debugging.
    if (isCooldownStatusError) {
      console.error("Failed to load cooldown status:", cooldownStatusError);
    }
  }, [isCooldownStatusError, cooldownStatusError]);
  

  // Show the message for an active cooldown or while waiting for its record after a 429.
  const shouldShowRateLimitMessage = isActive || (isRateLimited && !hasObservedCooldownForError);

  // Render nothing when there is no current rate-limit message to show.
  if (!shouldShowRateLimitMessage) return null;



  return (
    <p className="auth-field-error" role="alert">
      Too many requests. Please wait before trying again.
      {/* Show the countdown while either the response or stored cooldown is active. */}
      {isActive && <span> Try again in {secondsRemaining}s.</span>}
      {/* Retry-After starts the countdown while useCooldown fetch data from backend; cached status can restore it on navigation, and a full reload fetches it again. */}
    </p>
  );
}



// Yes—for route-level cooldowns, the shared backend pieces are in place: the handler records a cooldown in Redis, and the status endpoint returns active records. You can wire the remaining frontend routes yourself; you shouldn’t need to duplicate backend logic.

// For each UI action that can be rate-limited:

// Use its stable action from rateLimitActions.ts. It must match the backend’s method and route path.
// Pass the action, RateLimitError status, and retryAfterExpiresAt to CooldownTimer.
// In that action’s 429 handling, invalidate ["cooldown"] so the query fetches the newly saved Redis record.
// Disable the relevant button while that cooldown is active.
// Test each route for an immediate countdown, then navigate away and return or reload to confirm it restores from Redis. One caveat: routes limited by IP share cooldowns across devices only when those devices appear to the server from the same IP.

// 10:51 am
// 10s
// •
