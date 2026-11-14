import ResendEmailVerificationForm from "@/components/auth/resend-email-verification/resend-email-verification";

export const metadata = {
  title: "Resend Verification Email — Thumbnail Builder",
  description: "Request a new email verification code",
};

export default function ResendEmailVerificationPage() {
  return <ResendEmailVerificationForm />;
}
