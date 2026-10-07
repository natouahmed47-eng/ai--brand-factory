"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Plus, LogOut, Settings, User as UserIcon,
  Layers, Zap, Film, ChevronLeft,
} from "lucide-react";
import { theme } from "../../lib/theme";

type User = {
  id: string;
  email: string;
  workspace_id: string;
  is_admin?: boolean;
};

type Workspace = {
  id: string;
  name: string;
  plan: string;
  credits: number;
};

type Brand = {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
};

type Campaign = {
  id: string;
  brand_id: string;
  status: string;
  stage?: string | null;
  created_at: string;
};

const API = "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(API + "/auth/me", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("workspace");
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data.user);
        setWorkspace(data.workspace);

        fetch(API + "/brands", {
          headers: { Authorization: "Bearer " + token },
        })
          .then((r) => r.json())
          .then((b) => {
            setBrands(Array.isArray(b) ? b : b.items || []);
            setLoadingBrands(false);
          })
          .catch(() => setLoadingBrands(false));

        fetch(API + "/campaigns", {
          headers: { Authorization: "Bearer " + token },
        })
          .then((r) => r.json())
          .then((c) => setCampaigns(Array.isArray(c) ? c : c.items || []))
          .catch(() => {});
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("workspace");
    router.push("/login");
  };

  const getBrandName = (id: string) => {
    const b = brands.find((x) => x.id === id);
    return b ? b.name : "براند محذوف";
  };

  const statusMeta = (status: string) => {
    const s = status || "pending";
    if (s === "completed" || s === "done" || s === "success")
      return { text: "مكتملة", color: theme.success, bg: "rgba(107,191,122,0.1)" };
    if (s === "failed" || s === "error")
      return { text: "فاشلة", color: theme.danger, bg: "rgba(224,82,82,0.1)" };
    if (s === "running" || s === "processing")
      return { text: "جاري التنفيذ", color: theme.gold, bg: "rgba(212,165,116,0.12)" };
    return { text: "قيد الانتظار", color: theme.muted, bg: "rgba(255,255,255,0.05)" };
  };

  return (
    <main
      className="min-h-screen relative"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[140px] pointer-events-none"
        style={{ background: theme.gold }}
      />

      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: "rgba(11,11,13,0.75)",
          borderBottom: `1px solid ${theme.lineSoft}`,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Sparkles
              className="w-5 h-5 transition group-hover:scale-110"
              style={{ color: theme.gold }}
            />
            <span className="text-base font-medium tracking-wide">
              AI Brand Factory
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 rounded-full transition hover:bg-white/5"
              title="الإعدادات"
            >
              <Settings className="w-4 h-4" style={{ color: theme.muted }} />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition hover:bg-white/5"
              title="خروج"
            >
              <LogOut className="w-4 h-4" style={{ color: theme.muted }} />
            </button>
          </div>
        </div>
      </header>

      <div className="relative max-w-[1200px] mx-auto px-6 py-12">
        <div className="mb-12">
          <div
            className="text-[10px] tracking-[0.3em] mb-3"
            style={{ color: theme.gold }}
          >
            لوحة التحكم
          </div>
          <h1 className="text-3xl sm:text-4xl font-light mb-2">
            مرحبًا في{" "}
            <span style={{ color: theme.gold }}>
              {workspace?.name || "..."}
            </span>
          </h1>
          <p className="text-sm" style={{ color: theme.muted }}>
            {user?.email || "..."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <KpiCard
            icon={Zap}
            label="Credits"
            value={workspace ? Math.floor(workspace.credits / 100) : 0}
          />
          <KpiCard icon={Layers} label="البراندات" value={brands.length} />
          <KpiCard icon={Film} label="الحملات" value={campaigns.length} />
          <KpiCard
            icon={Sparkles}
            label="الخطة"
            value={workspace?.plan || "Free"}
            isText
          />
        </div>


        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">البراندات</h2>
            <Link
              href="/brands/new"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition hover:opacity-90"
              style={{ background: theme.gold, color: theme.bg }}
            >
              <Plus className="w-4 h-4" />
              براند جديد
            </Link>
          </div>

          {loadingBrands ? (
            <div
              className="rounded-2xl p-8 text-center text-sm"
              style={{
                background: theme.card,
                border: `1px solid ${theme.lineSoft}`,
                color: theme.muted,
              }}
            >
              جارٍ التحميل...
            </div>
          ) : brands.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: theme.card,
                border: `1px solid ${theme.line}`,
              }}
            >
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(212,165,116,0.08)",
                  border: `1px solid ${theme.line}`,
                }}
              >
                <Layers className="w-6 h-6" style={{ color: theme.gold }} />
              </div>
              <h3 className="text-lg font-light mb-2">
                ابدأ ببناء أول براند
              </h3>
              <p className="text-sm mb-6" style={{ color: theme.muted }}>
                أنشئ براندك الأول — عقل رقمي سيُنتج لك محتوى لا نهائي.
              </p>
              <Link
                href="/brands/new"
                className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-full transition hover:opacity-90"
                style={{ background: theme.gold, color: theme.bg }}
              >
                <Plus className="w-4 h-4" />
                إنشاء براند
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={"/brands/" + b.id}
                  className="group rounded-2xl p-6 transition hover:-translate-y-0.5"
                  style={{
                    background: theme.card,
                    border: `1px solid ${theme.lineSoft}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.lineSoft;
                  }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={b.name}
                        className="w-12 h-12 rounded-xl object-cover"
                        style={{ border: `1px solid ${theme.lineSoft}` }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(212,165,116,0.08)",
                          border: `1px solid ${theme.line}`,
                        }}
                      >
                        <Sparkles
                          className="w-5 h-5"
                          style={{ color: theme.gold }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-normal truncate">
                        {b.name}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: theme.muted }}
                      >
                        {new Date(b.created_at).toLocaleDateString("ar-EG")}
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: theme.muted }}
                  >
                    <span>عرض التفاصيل</span>
                    <ChevronLeft
                      className="w-3.5 h-3.5 transition group-hover:-translate-x-1"
                      style={{ color: theme.gold }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">حملاتي</h2>
            <span className="text-xs" style={{ color: theme.muted }}>
              {campaigns.length} حملة
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: theme.card,
                border: `1px solid ${theme.lineSoft}`,
              }}
            >
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(212,165,116,0.08)",
                  border: `1px solid ${theme.line}`,
                }}
              >
                <Film className="w-6 h-6" style={{ color: theme.gold }} />
              </div>
              <h3 className="text-lg font-light mb-2">لا توجد حملات بعد</h3>
              <p className="text-sm" style={{ color: theme.muted }}>
                أنشئ براندًا، ثم ابدأ أول حملة إعلانية.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c) => {
                const meta = statusMeta(c.status);
                return (
                  <Link
                    key={c.id}
                    href={"/campaigns/" + c.id}
                    className="group rounded-2xl p-6 transition hover:-translate-y-0.5"
                    style={{
                      background: theme.card,
                      border: `1px solid ${theme.lineSoft}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.gold;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.lineSoft;
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-normal truncate flex-1">
                        {getBrandName(c.brand_id)}
                      </h3>
                      <span
                        className="text-[10px] tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.color}33`,
                        }}
                      >
                        {meta.text}
                      </span>
                    </div>
                    <div
                      className="text-xs mb-2"
                      style={{ color: theme.muted }}
                    >
                      {new Date(c.created_at).toLocaleDateString("ar-EG")}
                    </div>
                    {c.status === "running" && c.stage && (
                      <div
                        className="text-xs truncate"
                        style={{ color: theme.gold }}
                      >
                        {c.stage}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  isText = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: theme.card,
        border: `1px solid ${theme.lineSoft}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ color: theme.muted }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(212,165,116,0.08)",
            border: `1px solid ${theme.line}`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: theme.gold }} />
        </div>
      </div>
      <div
        className={isText ? "text-xl font-light" : "text-3xl font-light"}
        style={{ color: theme.text }}
      >
        {value}
      </div>
    </div>
  );
}
