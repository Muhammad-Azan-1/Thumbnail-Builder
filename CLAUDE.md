@AGENTS.md


 ✅ Build succeeded with zero errors. All 7 routes are compiled and registered:                                                                                                                                             
                                                                                                                                                                                                                             
    Route (app)
    ┌ ○ /                    (home)
    ├ ○ /_not-found
    ├ ○ /email-verification
    ├ ○ /forgot-password
    ├ ○ /login                                                                                                                                                                                                               
    ├ ○ /reset-password
    └ ○ /signup
  
  Here's a summary of everything that was created:
  ──────
  ### Files Created (14 files, ~1060 lines)                                                                                                                                                                                  
  
  Foundation (4 files):
  
   File                                                                                                        │ Description
  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────
   globals.css                                                                                                 │ Auth CSS appended — all .auth-* classes, responsive breakpoint
   layout.tsx/layout.tsx)                                                                                      │ Auth route group layout — centered card with grain + brand mark
   google-auth.tsx                                                                                             │ Reusable Google OAuth button with full-color SVG logo
   password-input.tsx                                                                                          │ Reusable password input with show/hide toggle (Eye/EyeOff)
  
  Pages (5 routes × 2 files each):
  
   Route                                    │ Page                                     │ Form Component                          │ Features
  ──────────────────────────────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────
   /login                                   │ page.tsx/login/page.tsx)                 │ login.tsx                               │ Email/password validation, Google auth, Remember me, Forgot password link
   /signup                                  │ page.tsx/signup/page.tsx)                │ signup.tsx                              │ Name/email/password, live strength bar + 5 requirements checklist, confirm password match
   /email-verification                      │ page.tsx/email-verification/page.tsx)    │ verify-email.tsx                        │ 6-digit OTP with auto-advance/paste, 60s resend countdown, success state
   /forgot-password                         │ page.tsx/forgot-password/page.tsx)       │ forgot-password.tsx                     │ Email validation, success state ("Check Your Inbox")
   /reset-password                          │ page.tsx/reset-password/page.tsx)        │ reset-password.tsx                      │ New password + confirm with live strength bar/requirements, success state
  
  ### Validation Features
  
  • ✅ Email format regex validation                                                                                                                                                                                         
  • ✅ Password minimum 8 characters                                                                                                                                                                                         
  • ✅ 5 live password requirements (uppercase, lowercase, number, special char, length)                                                                                                                                     
  • ✅ Password strength bar (Weak → Fair → Medium → Strong → Very Strong)                                                                                                                                                   
  • ✅ Confirm password match                                                                                                                                                                                                
  • ✅ Required field validation with orange shake animation                                                                                                                                                                 
  • ✅ OTP digit-by-digit with auto-advance, backspace nav, and paste support                                                                                                                                                
  
  ### Where to add API calls
  
  Every form has // TODO: Replace with actual API call comments at the exact submission points. Just replace the console.log + setTimeout with your actual fetch calls.
  
  ### Also fixed
  
  • 🔧 Deleted the old pages.tsx typo file (was login/pages.tsx instead of page.tsx)                                                                                                                                         


-- remember me 


 ### The Flow
  
    User checks "Remember me" ☑️                                                                                                                                                                                             
            │
            ▼
    POST /api/auth/login
    { email, password, remember_me: true }
            │
            ▼
    ┌─── FastAPI Backend ───────────────────────────┐
    │                                               │
    │  if remember_me:                              │
    │      token_expiry = 30 days    ← LONG lived   │
    │  else:                                        │
    │      token_expiry = 1 hour     ← SHORT lived  │
    │                                               │
    │  access_token = create_jwt(user, token_expiry)│                                                                                                                                                                        
    │  Set-Cookie: token=xxx; Max-Age=token_expiry  │
    └───────────────────────────────────────────────┘
            │
            ▼
    ┌─── Next.js Frontend ─────────────────────────┐
    │                                              │
    │  if (rememberMe):                            │
    │      store token in localStorage             │
    │      → survives browser close                │
    │  else:                                       │
    │      store token in sessionStorage           │
    │      → dies when tab/browser closes          │
    └──────────────────────────────────────────────┘
  ──────
  ### Concrete Example (what you'd build)
  
  Backend (FastAPI):
  
    @router.post("/login")
    def login(data: LoginRequest):
        user = authenticate(data.email, data.password)
        
        if data.remember_me:
            expires = timedelta(days=30)   # 👈 stays logged in for a month                                                                                                                                                  
        else:
            expires = timedelta(hours=1)   # 👈 short session                                                                                                                                                                
        
        token = create_access_token(user.id, expires_delta=expires)
        return {"access_token": token, "remember_me": data.remember_me}
  
  Frontend (your login form):
  
    // After successful API response:
    if (rememberMe) {
      localStorage.setItem("token", response.access_token);
      // ^ persists even after browser restart
    } else {
      sessionStorage.setItem("token", response.access_token);
      // ^ gone the moment user closes the tab
    }
  ──────
  ### The real-world test scenario
  
   Action                                                                  │ Remember Me ☑                                                          │ Remember Me ☐
  ─────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────
   Close tab, reopen                                                       │ Still logged in                                                        │ Logged out
   Close entire browser, reopen                                            │ Still logged in                                                        │ Logged out
   Wait 2 hours                                                            │ Still logged in                                                        │ Logged out (token expired)
   Wait 31 days                                                            │ Logged out (token expired)                                             │ Logged out
  ──────
  ### TL;DR
  
  "Remember me" = "How long should the app trust that I am who I say I am?" 