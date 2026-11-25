import Link from "next/link";
import { login } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";
import { AuthShell } from "../auth/auth-shell";

export const metadata = { title: "Sign in | FCSIT Event Hub" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" kicker="// sign in" tone="sky">
      <AuthForm
        action={login}
        submitLabel="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-5 text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-bold text-ink underline decoration-amber decoration-4 underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
