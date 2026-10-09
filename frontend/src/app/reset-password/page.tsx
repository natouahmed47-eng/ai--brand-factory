"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Loader2, ArrowLeft, Lock, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { theme } from "../../lib/theme";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون ٨ أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://ai-brand-factory-production.up.railway.app/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "حدث خطأ. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push("/login"), 2000);
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

  if (success) {
    return (
      <div
        className="rounded-3xl p-10 text-center"
        style={{
          background: theme.card,
          border: `1px solid ${theme.lineSoft}`,
        }}
      >
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "rgba(107,191,122,0.1)",
            border: `1px solid rgba(107,191,122,0.3)`,
          }}
        >
          <CheckCircle2 className="w-7 h-7" style={{ color: theme.success }} />
        </div>
        <h2 className="text-xl font-light mb-2" style={{ color: theme.text }}>
          تم بنجاح
        </h2>
        <p className="text-sm mb-6" style={{ color: theme.muted }}>
          تم تعيين كلمة المرور الجديدة. جارٍ التحويل لتسجيل الدخول...
        </p>
        <div className="inline-flex items-center gap-2 text-xs" style={{ color: theme.gold }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          جارٍ التحويل...
        </div>
      </div>
    );
  }

  return (
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
          <Lock className="w-6 h-6" style={{ color: theme.gold }} />
        </div>
        <h1 className="text-2xl font-light mb-2">كلمة مرور جديدة</h1>
        <p className="text-sm" style={{ color: theme.muted }}>
          اختر كلمة مرور قوية لحسابك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            className="block text-xs tracking-widest mb-2"
            style={{ color: theme.muted }}
          >
            كلمة المرور الجديدة
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="٨ أحرف على الأقل"
              dir="ltr"
              className="w-full px-4 py-3 pl-11 rounded-xl outline-none transition text-left"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.gold)}
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.lineSoft)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition hover:bg-white/5"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" style={{ color: theme.muted }} />
              ) : (
                <Eye className="w-4 h-4" style={{ color: theme.muted }} />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-xs tracking-widest mb-2"
            style={{ color: theme.muted }}
          >
            تأكيد كلمة المرور
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            placeholder="أعد كتابة كلمة المرور"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl outline-none transition text-left"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = theme.gold)}
            onBlur={(e) => (e.currentTarget.style.borderColor = theme.lineSoft)}
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

        {!token && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={{
              background: "rgba(224,176,82,0.1)",
              border: "1px solid rgba(224,176,82,0.3)",
              color: theme.warning,
            }}
          >
            الرابط لا يحتوي على token صالح. اطلب رابطًا جديدًا من صفحة الاستعادة.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3.5 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{ background: theme.gold, color: theme.bg }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              تعيين كلمة المرور
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm" style={{ color: theme.muted }}>
        <Link
          href="/login"
          className="transition hover:opacity-80"
          style={{ color: theme.gold }}
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div
      className="rounded-3xl p-10 flex items-center justify-center"
      style={{
        background: theme.card,
        border: `1px solid ${theme.lineSoft}`,
        minHeight: "420px",
      }}
    >
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.gold }} />
    </div>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<LoadingFallback />}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
