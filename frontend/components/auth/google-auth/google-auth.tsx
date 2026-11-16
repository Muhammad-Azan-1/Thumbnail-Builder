"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/use-auth";
import { GoogleAuthButtonProps } from "@/types/auth";
import { AppDispatch } from "@/redux/store/store";
import { login } from "@/redux/reducers/authReducer";
import { getSafeRedirectPath } from "@/lib/auth-redirect";
import styles from './google-auth.module.css'
import { useGoogleLogin } from "@react-oauth/google";

import { LoaderCircle , Check } from "lucide-react";

export default function GoogleAuthButton({
  disabled = false,
  label,
}: GoogleAuthButtonProps) {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const dispatch = useDispatch<AppDispatch>();

  const { mutateAsync: googleAuthMutation, isPending, isError , error , isSuccess } = useGoogleAuth();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting  , setIsSubmitting] = useState(false)

  console.log(isPending , "IS PENDING")


  async function handleGoogleAuth(response: any): Promise<void> {
    setLocalError(null);
    const result = await googleAuthMutation({credential: response.code})
    console.log("GOOGLE AUTH RETURNED RESULT" , result)
    dispatch(login(result))
    setIsSubmitting(false)

    setTimeout(()=>{router.replace(getSafeRedirectPath(redirect) ?? "/");},1500)

  }

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    ux_mode : 'popup',

    onSuccess: async (tokenResponse) => {
      console.log("Google token:", tokenResponse);
      await handleGoogleAuth(tokenResponse)
    },
    onError: () => {
      setLocalError("Google sign-in failed.");
    },

  
    onNonOAuthError: (error) => {
      setIsSubmitting(false);
    if (error.type === "popup_closed") {
      setLocalError(null); // User cancelled; don't show an error.
      return;
    }
    setLocalError("Google sign-in could not be completed.");
  },
  
  });

  console.log(error?.message , localError)

  return (
    <div>
     <button
      type="button"
      className={styles.googleAuthButton}
      onClick={()=> { googleLogin(); setIsSubmitting(true)}}
      disabled={disabled || isSubmitting}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span className="font-mono">{label}</span>
      {
        isSubmitting && (
          <LoaderCircle className="button-loader" aria-hidden="true" />
        )

      }

      {
        isSuccess && (
           <Check aria-hidden="true" />
        )
      }

    </button>

      {localError ||  (isError)  && (
        <p className={`auth-field-error ${styles.para}`} role="alert">
          { localError || error.message }
        
        </p>
      )}
    </div>

     
  );
}


// agy --conversation=033ed7e3-a61d-4d2c-98dc-e4d5da3cd9fb

// "use client";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useDispatch } from "react-redux";
// import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
// import { useGoogleAuth } from "@/hooks/use-auth";
// import { GoogleAuthButtonProps } from "@/types/auth";
// import { AppDispatch } from "@/redux/store/store";
// import { login } from "@/redux/reducers/authReducer";
// import { getSafeRedirectPath } from "@/lib/auth-redirect";
// import styles from "./google-auth.module.css";

// export default function GoogleAuthButton({
//   disabled = false,
//   label,
// }: GoogleAuthButtonProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const redirect = searchParams.get("redirect");
//   const dispatch = useDispatch<AppDispatch>();

//   const {
//     mutateAsync: googleAuthMutation,
//     isPending,
//     isError,
//     error,
//   } = useGoogleAuth();
  
//   const [localError, setLocalError] = useState<string | null>(null);

//   async function handleGoogleSuccess(response: CredentialResponse) {
//     if (!response.credential) {
//       setLocalError("Google sign-in failed — no credential returned.");
//       return;
//     }
//     setLocalError(null);

//       const result = await googleAuthMutation({
//         credential: response.credential,
//       });
//       dispatch(login(result));
//       router.replace(getSafeRedirectPath(redirect) ?? "/");
    
//   }

//   return (
//     <div>
//       {/* Wrapper: custom button is visible, GoogleLogin iframe is stretched
//           over it at opacity 0 so it captures the click.  */}
//       <div className={styles.googleAuthWrapper}>
//         {/* Your custom-styled button (visible but non-interactive) */}
//         <button
//           type="button"
//           className={styles.googleAuthButton}
//           disabled={disabled || isPending}
//           aria-label={label}
//           tabIndex={-1}
//         >
//           <svg viewBox="0 0 24 24" aria-hidden="true">
//             <path
//               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
//               fill="#4285F4"
//             />
//             <path
//               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//               fill="#34A853"
//             />
//             <path
//               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//               fill="#FBBC05"
//             />
//             <path
//               d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//               fill="#EA4335"
//             />
//           </svg>
//           <span className="font-mono">{label}</span>
//         </button>

//         {/* Invisible GoogleLogin overlay — captures the actual click */}
//         <div className={styles.googleLoginOverlay}>
//           <GoogleLogin
//             onSuccess={handleGoogleSuccess}
//             onError={() => setLocalError("Google sign-in failed.")}
//             width="400"
//             size="large"
//           />
//         </div>
        
//       </div>

//       {(localError || isError) && (
//         <p className={`auth-field-error ${styles.para}`} role="alert">
//           {localError || error?.message}
//         </p>
//       )}
//     </div>
//   );
// }

