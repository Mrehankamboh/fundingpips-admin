import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="mark">FP</div>
          <div>
            <strong>FundingPips</strong>
          </div>
        </div>
        <h1>Admin sign in</h1>
        <p className="sub">
          {process.env.NEXT_PUBLIC_UI_ONLY === "1"
            ? "UI preview mode — click Sign in to open the admin shell."
            : "Use your admin account email and password."}
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
