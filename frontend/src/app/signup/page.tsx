"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { theme } from "../../lib/theme";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://ai-brand-factory-production.up.railway.app/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          workspace_name: workspaceName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "حدث خطأ. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
      router.push("/dashboard");
    } catch {
      setError("تعذّر الاتصال بالخادم. تأكد أن Backend يعمل.");
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
            <h1 className="text-2xl font-light mb-2">ابدأ الآن</h1>
            <p className="text-sm" style={{ color: theme.muted }}>
              أنشئ حسابك في ثوان
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs tracking-widest mb-2"
                style={{ color: theme.muted }}
              >
                اسم البراند
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                placeholder="مثال: عطور الأصالة"
                className="w-full px-4 py-3 rounded-xl outline-none transition"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = theme.gold)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = theme.lineSoft)
                }
              />
            </div>

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

            <div>
              <label
                className="block text-xs tracking-widest mb-2"
                style={{ color: theme.muted }}
              >
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="٨ أحرف على الأقل"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              style={{ background: theme.gold, color: theme.bg }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  إنشاء الحساب
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="mt-6 text-center text-sm"
            style={{ color: theme.muted }}
          >
            لديك حساب؟{" "}
            <Link
              href="/login"
              className="transition hover:opacity-80"
              style={{ color: theme.gold }}
            >
              سجّل الدخول
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
