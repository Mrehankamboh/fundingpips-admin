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
        <p className="sub">Use your admin account email and password.</p>
        <LoginForm />
      </div>
    </div>
  );
}
