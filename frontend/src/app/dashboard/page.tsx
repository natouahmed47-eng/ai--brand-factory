'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    // تحقق من التوكن مع الـBackend
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-10 text-center">
          <h3 className="text-2xl font-bold mb-3">أنشئ براندك الأول</h3>
          <p className="text-gray-300 mb-6">
            ارفع شعارك، وأخبرنا عن منتجك، ودع الذكاء الاصطناعي يبني عقل براندك.
          </p>
          <button
            disabled
            className="px-8 py-3 bg-blue-500 rounded-lg font-semibold opacity-50 cursor-not-allowed"
          >
            قريبًا — إنشاء براند
          </button>
        </div>
      </div>
    </main>
  );
}