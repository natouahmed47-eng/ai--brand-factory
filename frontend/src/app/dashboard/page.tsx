'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Workspace = {
  id: string;
  name: string;
  plan: string;
  credits?: number;
};

type User = {
  id: string;
  email: string;
};

type Campaign = {
  id: string;
  brand_id: string;
  status: string;
  stage: string;
  final_url: string | null;
  created_at: string;
};

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('workspace');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data.user);
          setWorkspace(data.workspace);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('workspace', JSON.stringify(data.workspace));
        }
      })
      .catch(() => {
        router.push('/login');
      });

    fetch('http://localhost:8000/brands', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setBrands(data);
        setLoadingBrands(false);
      })
      .catch(() => setLoadingBrands(false));

    fetch('http://localhost:8000/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCampaigns(data))
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    router.push('/');
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">جاري التحميل...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AI Brand Factory</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-2">
          مرحبًا بك في {workspace?.name || 'لوحتك'}
        </h2>
        <p className="text-gray-400 mb-12">
          ابدأ بإنشاء براندك الأول، ودع الذكاء الاصطناعي يبني محتواك.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">الخطة الحالية</p>
            <p className="text-2xl font-bold capitalize">{workspace?.plan || 'Starter'}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">الحملات المتبقية</p>
            <p className="text-2xl font-bold">{workspace?.credits ? Math.floor(workspace.credits / 100) : 1}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">البراندات</p>
            <p className="text-2xl font-bold">{brands.length}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">البراندات</h3>
          <Link
            href="/brands/new"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
          >
            + إنشاء براند
          </Link>
        </div>

        {loadingBrands ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
            جاري التحميل...
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-10 text-center">
            <h4 className="text-2xl font-bold mb-3">أنشئ براندك الأول</h4>
            <p className="text-gray-300 mb-6">
              ارفع شعارك، وأخبرنا عن منتجك، ودع الذكاء الاصطناعي يبني عقل براندك.
            </p>
            <Link
              href="/brands/new"
              className="inline-block px-8 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              ابدأ الآن
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/50 transition cursor-pointer block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {brand.logo_url ? (
                    <img
                      src={`http://localhost:8000${brand.logo_url}`}
                      alt={brand.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{brand.name.charAt(0)}</span>
                  )}
                </div>
                <h4 className="text-xl font-bold mb-2">{brand.name}</h4>
                <p className="text-sm text-gray-400">
                  أُنشئ في {new Date(brand.created_at).toLocaleDateString('ar')}
                </p>
              </Link>
            ))}
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">حملاتي</h3>
              <span className="text-sm text-gray-400">{campaigns.length} حملة</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => {
                const brand = brands.find((b) => b.id === camp.brand_id);
                const statusColor =
                  camp.status === 'done'
                    ? 'bg-green-500/20 border-green-500/30 text-green-300'
                    : camp.status === 'failed'
                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-300';
                const statusText =
                  camp.status === 'done'
                    ? 'جاهزة'
                    : camp.status === 'failed'
                    ? 'فشلت'
                    : 'قيد الإنتاج';
                return (
                  <Link
                    key={camp.id}
                    href={'/campaigns/' + camp.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/10 transition cursor-pointer block"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold">{brand?.name || 'براند'}</h4>
                      <span className={'text-xs px-3 py-1 rounded-full border ' + statusColor}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {new Date(camp.created_at).toLocaleDateString('ar-EG')}
                    </p>
                    {camp.status === 'running' && (
                      <p className="text-xs text-gray-500 truncate">{camp.stage}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
