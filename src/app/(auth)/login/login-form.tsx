// =============================================================================
// ConMart — Login Form (Client Component)
// =============================================================================
// Interactive login form with React Hook Form + Zod validation.
// Calls the signIn server action and handles redirect on success.
// Fully bilingual English & Amharic.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { loginSchema, type LoginFormData } from "@/lib/validations";
import { signIn } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

interface LoginFormProps {
  /** URL to redirect to after successful login */
  redirectUrl?: string;
  /** Error message from URL params (e.g., auth callback failure) */
  errorMessage?: string;
}

export function LoginForm({ redirectUrl, errorMessage }: LoginFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(
    errorMessage ?? null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);

      const result = await signIn(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // Sanitize redirectUrl to prevent Open Redirect attacks
      const isSafeRedirect =
        redirectUrl &&
        redirectUrl.startsWith("/") &&
        !redirectUrl.startsWith("//") &&
        !redirectUrl.includes("\\") &&
        !redirectUrl.includes(":");

      router.push(isSafeRedirect ? redirectUrl : result.data.redirectUrl);
      router.refresh();
    });
  }

  return (
    <Card className="border-border/50 bg-card shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-xl font-bold">{t("auth_sign_in_title")}</CardTitle>
        <CardDescription>
          {t("auth_sign_in_subtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* --- Server Error Alert --- */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* --- Email Field --- */}
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("auth_email_label")}</Label>
            <Input
              id="login-email"
              type="email"
              placeholder={t("auth_email_placeholder")}
              autoComplete="email"
              disabled={isPending}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* --- Password Field --- */}
          <div className="space-y-2">
            <Label htmlFor="login-password">{t("auth_password_label")}</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isPending}
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isPending}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth_btn_signing_in")}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t("auth_btn_sign_in")}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth_no_account")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("auth_create_account_link")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
