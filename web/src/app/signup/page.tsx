import Link from "next/link";
import { signup } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";
import { AuthShell } from "../auth/auth-shell";

export const metadata = { title: "Sign up | FCSIT Event Hub" };

export default function SignupPage() {
  return (
    <AuthShell title="Join the fun" kicker="// create account" tone="amber">
      <AuthForm
        action={signup}
        submitLabel="Create account"
        fields={[
          { name: "full_name", label: "Full name", type: "text", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-5 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-ink underline decoration-sky decoration-4 underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
