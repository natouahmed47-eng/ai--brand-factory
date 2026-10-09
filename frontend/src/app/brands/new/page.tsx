"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Loader2, Layers, FileText } from "lucide-react";
import { theme } from "../../../lib/theme";

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://ai-brand-factory-production.up.railway.app/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "حدث خطأ. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      if (data.id) {
        router.push("/brands/" + data.id);
      } else {
        router.push("/dashboard");
      }
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

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.gold;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.lineSoft;
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div
        className="fixed top-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[140px] pointer-events-none"
        style={{ background: theme.gold }}
      />

      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: "rgba(11,11,13,0.75)",
          borderBottom: `1px solid ${theme.lineSoft}`,
        }}
      >
        <div className="max-w-[900px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition hover:opacity-80"
            style={{ color: theme.muted }}
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة للوحة
          </Link>

          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" style={{ color: theme.gold }} />
            <span className="text-base font-medium tracking-wide">
              AI Brand Factory
            </span>
          </div>
        </div>
      </header>

      <div className="relative max-w-[900px] mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div
            className="text-[10px] tracking-[0.3em] mb-3"
            style={{ color: theme.gold }}
          >
            براند جديد
          </div>
          <h1 className="text-3xl sm:text-4xl font-light mb-3">
            أنشئ براندك
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: theme.muted }}>
            ابدأ بالمعلومات الأساسية — ثم نبني عقل براندك خطوة بخطوة.
          </p>
        </div>

        <div
          className="rounded-3xl p-8 sm:p-10 max-w-xl mx-auto"
          style={{
            background: theme.card,
            border: `1px solid ${theme.lineSoft}`,
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-xs tracking-widest mb-2"
                style={{ color: theme.muted }}
              >
                اسم البراند
              </label>
              <div className="relative">
                <Layers
                  className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: theme.muted }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مثال: عطور الأصالة"
                  className="w-full pr-11 pl-4 py-3 rounded-xl outline-none transition"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs tracking-widest mb-2"
                style={{ color: theme.muted }}
              >
                وصف البراند{" "}
                <span className="font-normal">(اختياري)</span>
              </label>
              <div className="relative">
                <FileText
                  className="w-4 h-4 absolute right-4 top-4 pointer-events-none"
                  style={{ color: theme.muted }}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ماذا يميّز براندك؟ لمن تتحدث؟"
                  rows={4}
                  className="w-full pr-11 pl-4 py-3 rounded-xl outline-none transition resize-none"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{ background: theme.gold, color: theme.bg }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    إنشاء البراند
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-full text-center text-sm transition hover:bg-white/5"
                style={{ color: theme.muted, border: "1px solid rgba(255,255,255,0.1)" }}
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
