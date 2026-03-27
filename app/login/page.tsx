import { LoginForm } from "./login-form";

export default function LoginPage() {
  const totpSecret = (process.env.MFA_TOTP_SECRET ?? "").trim();
  const mfaEnabled = totpSecret.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm mfaEnabled={mfaEnabled} />
    </main>
  );
}
