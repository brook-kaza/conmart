// =============================================================================
// ConMart — Login Page
// =============================================================================

import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ConMart account",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      redirectUrl={params.redirect}
      errorMessage={
        params.error === "auth_failed"
          ? "Authentication failed. Please try again."
          : params.error === "missing_code"
            ? "Invalid authentication link."
            : undefined
      }
    />
  );
}
