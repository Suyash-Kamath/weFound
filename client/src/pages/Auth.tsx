import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Mail, Lock, User, ArrowLeft, Loader2, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"auth" | "forgot" | "reset">("auth");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { login, register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    setIsLogin(modeParam !== "register");
    if (modeParam === "reset") {
      setMode("reset");
      const tokenParam = searchParams.get("token");
      const emailParam = searchParams.get("email");
      if (tokenParam) setResetToken(tokenParam);
      if (emailParam) setResetEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        await api.post("/auth/forgot-password", { email: resetEmail || email });
        toast({
          title: "Reset email sent",
          description: "Check your inbox for a reset token.",
        });
        setMode("reset");
      } else if (mode === "reset") {
        await api.post("/auth/reset-password", {
          email: resetEmail || email,
          token: resetToken,
          password,
        });
        toast({
          title: "Password updated",
          description: "You can now sign in with your new password.",
        });
        setMode("auth");
        setIsLogin(true);
      } else if (isLogin) {
        const success = await login(email, password);
        if (success) {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          navigate("/dashboard");
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        }
      } else {
        if (!name.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your name.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const success = await register(email, password, name);
        if (success) {
          toast({
            title: "Account created!",
            description: "Welcome to weFound.",
          });
          navigate("/dashboard");
        } else {
          toast({
            title: "Registration failed",
            description: "An account with this email already exists.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left side - branding */}
      <div className="auth-left">
        <Link to="/" className="auth-brand">
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <QrCode size={24} />
          </div>
          <span>weFound</span>
        </Link>

        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Protect What
          <br />
          Matters Most
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', lineHeight: 1.6 }}>
          Dynamic QR stickers that help reunite lost items with their owners.
          Private, secure, and fast to activate.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <div className="check-circle"><Check size={14} /></div>
            <span>Dynamic QR codes you can reassign anytime</span>
          </div>
          <div className="auth-feature-item">
            <div className="check-circle"><Check size={14} /></div>
            <span>Privacy-protected contact options</span>
          </div>
          <div className="auth-feature-item">
            <div className="check-circle"><Check size={14} /></div>
            <span>Real-time scan notifications</span>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="auth-right">
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" className="btn btn-outline" style={{ border: 'none', paddingLeft: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="nav-logo-icon" style={{ width: 48, height: 48, margin: '0 auto 1rem' }}>
              <QrCode size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {mode === "forgot" ? "Reset your password" : mode === "reset" ? "Set new password" : isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {mode === "forgot"
                ? "Enter your email and we will send a reset token."
                : mode === "reset"
                ? "Enter the reset token from email and a new password."
                : isLogin
                ? "Sign in to manage your items"
                : "Start protecting your valuables today"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && mode === "auth" && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={mode === "forgot" || mode === "reset" ? resetEmail : email}
                  onChange={(e) => (mode === "forgot" || mode === "reset" ? setResetEmail(e.target.value) : setEmail(e.target.value))}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {(mode === "auth" || mode === "reset") && (
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  {mode === "reset" ? "New Password" : "Password"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === "reset" && (
              <div className="form-group">
                <label className="form-label" htmlFor="token">Reset Token</label>
                <input
                  id="token"
                  type="text"
                  placeholder="Paste reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />
                  {mode === "forgot" ? "Sending..." : mode === "reset" ? "Updating..." : isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "forgot" ? (
                "Send Reset Email"
              ) : mode === "reset" ? (
                "Update Password"
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {mode === "auth" && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          )}

          {mode === "auth" && isLogin && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setMode("auth")}
                style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Back to sign in
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
