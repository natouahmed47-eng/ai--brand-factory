"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import { theme } from "../../../lib/theme";

export default function PaymentSuccessPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div
        className="fixed top-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
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
          className="rounded-3xl p-10 text-center"
          style={{
            background: theme.card,
            border: `1px solid ${theme.lineSoft}`,
          }}
        >
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "rgba(107,191,122,0.1)",
              border: "1px solid rgba(107,191,122,0.3)",
            }}
          >
            <CheckCircle2
              className="w-10 h-10"
              style={{ color: theme.success }}
            />
          </div>

          <h1 className="text-2xl font-light mb-3" style={{ color: theme.text }}>
            تم الاشتراك بنجاح
          </h1>
          <p className="text-sm mb-8" style={{ color: theme.muted }}>
            شكرًا لك! تم تفعيل خطتك الجديدة. يمكنك البدء الآن بإنشاء محتوى غير
            محدود.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-medium transition hover:opacity-90"
              style={{ background: theme.gold, color: theme.bg }}
            >
              اذهب إلى لوحة التحكم
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="block w-full py-3.5 rounded-full text-sm transition hover:bg-white/5"
              style={{
                color: theme.muted,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              عرض تفاصيل الاشتراك
            </Link>
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: theme.muted }}
        >
          قد يستغرق ظهور التحديث بضع ثوانٍ
        </p>
      </div>
    </main>
  );
}
