"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { theme } from "../../lib/theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "حدث خطأ. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      setMessage("تم إرسال رابط إعادة التعيين إلى بريدك.");
      if (data.token) setToken(data.token);
      setLoading(false);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.lineSoft}`,
    color: theme.text,
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div
        className="fixed top-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
        style={{ background: theme.gold }}
      />
      <div
        className="fixed bottom-0 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[120px] pointer-events-none"
        style={{ background: theme.gold }}
      />

      <div className="w-full max-w-md relative">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-10 group"
        >
          <Sparkles
            className="w-5 h-5 transition group-hover:scale-110"
            style={{ color: theme.gold }}
          />
          <span className="text-lg font-medium tracking-wide">
            AI Brand Factory
          </span>
        </Link>

        <div
          className="rounded-3xl p-8 sm:p-10"
          style={{
            background: theme.card,
            border: `1px solid ${theme.lineSoft}`,
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: "rgba(212,165,116,0.08)",
                border: `1px solid ${theme.line}`,
              }}
            >
              <Mail className="w-6 h-6" style={{ color: theme.gold }} />
            </div>
            <h1 className="text-2xl font-light mb-2">نسيت كلمة المرور؟</h1>
            <p className="text-sm" style={{ color: theme.muted }}>
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs tracking-widest mb-2"
                style={{ color: theme.muted }}
              >
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl outline-none transition text-left"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = theme.gold)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = theme.lineSoft)
                }
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(224,82,82,0.1)",
                  border: `1px solid rgba(224,82,82,0.3)`,
                  color: theme.danger,
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(107,191,122,0.08)",
                  border: `1px solid rgba(107,191,122,0.3)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: theme.success }}
                  />
                  <div className="flex-1 text-sm" style={{ color: theme.success }}>
                    <div className="font-medium mb-1">{message}</div>
                    {token && (
                      <Link
                        href={"/reset-password?token=" + token}
                        className="text-xs underline hover:opacity-80 transition"
                        style={{ color: theme.gold }}
                      >
                        إعادة تعيين كلمة المرور الآن ←
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              style={{ background: theme.gold, color: theme.bg }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارٍ الإرسال...
                </>
              ) : (
                <>
                  إرسال رابط الاستعادة
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="mt-6 text-center text-sm"
            style={{ color: theme.muted }}
          >
            <Link
              href="/login"
              className="transition hover:opacity-80"
              style={{ color: theme.gold }}
            >
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
