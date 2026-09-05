// =============================================================================
// ConMart — Register Form (Client Component)
// =============================================================================
// Registration form with role selection (BUYER or SELLER).
// Uses React Hook Form + Zod for validation.
// Creates both a Supabase Auth user and a database user record.
// Fully bilingual English & Amharic.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2, AlertCircle, Building2, ShoppingCart, ShieldCheck } from "lucide-react";

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

import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { signUp } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      companyName: "",
      role: "BUYER",
    },
  });

  const selectedRole = watch("role");

  function onSubmit(data: RegisterFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      formData.set("name", data.name);
      formData.set("phone", data.phone);
      formData.set("companyName", data.companyName);
      formData.set("role", data.role);

      const result = await signUp(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(result.data.redirectUrl);
      router.refresh();
    });
  }

  return (
    <Card className="border-border/50 bg-card shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-xl font-bold">{t("auth_register_title")}</CardTitle>
        <CardDescription>
          {t("auth_register_subtitle")}
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

          {/* --- Role Selection --- */}
          <div className="space-y-2">
            <Label>{t("auth_role_label")}</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue("role", "BUYER")}
                className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-2.5 text-center text-xs font-semibold transition-all ${
                  selectedRole === "BUYER"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="line-clamp-2">{t("auth_role_buyer")}</span>
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "SELLER")}
                className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-2.5 text-center text-xs font-semibold transition-all ${
                  selectedRole === "SELLER"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span className="line-clamp-2">{t("auth_role_seller")}</span>
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "ADMIN")}
                className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-2.5 text-center text-xs font-semibold transition-all ${
                  selectedRole === "ADMIN"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="line-clamp-2">{t("auth_role_admin")}</span>
              </button>
            </div>
            {/* Hidden input for form registration */}
            <input type="hidden" {...register("role")} />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* --- Name Field --- */}
          <div className="space-y-2">
            <Label htmlFor="reg-name">{t("auth_name_label")}</Label>
            <Input
              id="reg-name"
              placeholder={t("auth_name_placeholder")}
              autoComplete="name"
              disabled={isPending}
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* --- Company Name Field --- */}
          <div className="space-y-2">
            <Label htmlFor="reg-company">{t("auth_company_label")}</Label>
            <Input
              id="reg-company"
              placeholder={t("auth_company_placeholder")}
              disabled={isPending}
              {...register("companyName")}
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          {/* --- Phone Field --- */}
          <div className="space-y-2">
            <Label htmlFor="reg-phone">{t("auth_phone_label")}</Label>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="+251 91 234 5678"
              autoComplete="tel"
              disabled={isPending}
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* --- Email Field --- */}
          <div className="space-y-2">
            <Label htmlFor="reg-email">{t("auth_email_label")}</Label>
            <Input
              id="reg-email"
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
            <Label htmlFor="reg-password">{t("auth_password_label")}</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
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

          {/* --- Confirm Password Field --- */}
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">{t("auth_confirm_password_label")}</Label>
            <Input
              id="reg-confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
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
                {t("auth_btn_registering")}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("auth_btn_register")}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth_have_account")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("auth_sign_in_link")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
