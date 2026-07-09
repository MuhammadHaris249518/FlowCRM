import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <SignIn
      path="/login"
      routing="path"
      signUpUrl="/register"
      afterSignInUrl="/dashboard"
    />
  );
}