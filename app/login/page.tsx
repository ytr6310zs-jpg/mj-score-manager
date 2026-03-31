import { LoginForm } from "./login-form";

export default function LoginPage() {
  const rawTotp = String(process.env.MFA_TOTP_SECRET ?? "").trim();
  const showOtp = rawTotp !== "" && rawTotp !== "MFA_TOTP_SECRET";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm showOtp={showOtp} />
    </main>
  );
}
