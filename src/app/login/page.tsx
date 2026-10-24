import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo" src="/logo.svg" alt="FundingPips" />
        </div>
        <h1>Admin sign in</h1>
        <p className="sub">Use your FundingPips admin email and password.</p>
        <LoginForm />
      </div>
    </div>
  );
}
