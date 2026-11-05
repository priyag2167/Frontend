import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { api, jsonBody, resetCsrf } from "@/shared/api/client";
import { useNow } from "@/shared/hooks/useNow";
import { useSession } from "@/features/auth/hooks/useSession";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { BrandLogo } from "@/features/branding/components/BrandLogo";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { useUiStore } from "@/shared/stores/uiStore";
import type { Session } from "@/shared/types/contracts";

export default function Login() {
  const now = useNow();
  const session = useSession();
  const branding = useBranding().data;
  const productName = branding?.productName ?? "Pharma VRM";
  const client = useQueryClient();
  const navigate = useNavigate();
  const signInNotice = useUiStore((state) => state.signInNotice);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const login = useMutation({
    mutationFn: async () => {
      await api("/auth/login", {
        method: "POST",
        body: jsonBody({ email, password }),
      });
      resetCsrf();
      return api<Session>("/auth/me");
    },
    onSuccess: async (authenticatedSession) => {
      await client.cancelQueries();
      useUiStore.getState().reset();
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      client.setQueryData(["auth", "me"], authenticatedSession);
      navigate("/", { replace: true });
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    login.mutate();
  }
  if (session.data) return <Navigate to="/" replace />;
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand light">
          <BrandLogo
            url={branding?.logoUrl}
            companyName={branding?.companyName}
          />
          <div>
            {productName}
            <span>
              {branding?.companyName ?? "VIRTUAL RELATIONSHIP MANAGEMENT"}
            </span>
          </div>
        </div>
        <div className="login-story-content">
          <span className="story-kicker">
            <span className="live-dot" /> A MORE CONNECTED WAY TO WORK
          </span>
          <h1>
            Better relationships.
            <br />
            More meaningful
            <br />
            <em>engagement.</em>
          </h1>
          <p>
            Bring your field team, healthcare professionals, approved knowledge,
            and learning together in one considered workspace.
          </p>
          <div className="story-cards">
            <div>
              <Activity size={22} />
              <strong>Connected teams</strong>
              <span>Every interaction, in context.</span>
            </div>
            <div>
              <ShieldCheck size={22} />
              <strong>Controlled workflows</strong>
              <span>Clear ownership. Clear history.</span>
            </div>
          </div>
        </div>
        <small>{productName} / YOUR CONNECTED WORKSPACE</small>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">{productName} workspace</span>
          <h2>Welcome back.</h2>
          <p className="muted">
            Sign in to your {productName} account
            {branding?.companyName ? ` for ${branding.companyName}` : ""} to
            continue.
          </p>
          {signInNotice && <p role="status">{signInNotice}</p>}
          <form className="form-stack" onSubmit={submit}>
            <Field label="Work email">
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field
              label="Workspace password"
              hint={`Use the password for your ${productName} account.`}
            >
              <div className="password-input">
                <input
                  type={visible ? "text" : "password"}
                  required
                  maxLength={256}
                  autoComplete="current-password"
                  placeholder="Enter your workspace password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="icon-button"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <ErrorMessage error={login.error} />
            <button
              className="btn primary login-submit"
              disabled={login.isPending}
              type="submit"
            >
              {login.isPending ? "Signing in…" : "Sign in to workspace"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-security">
            <LockKeyhole size={15} />
            <span>
              Your session is protected and access is role controlled.
            </span>
          </div>
          <div className="login-help">
            Your company administrator provides access to this workspace.
            Contact them if you need an account or a password reset.
          </div>
        </div>
        <small className="login-copyright">
          © {new Date(now).getFullYear()} {branding?.companyName ?? productName}
        </small>
      </section>
    </main>
  );
}
