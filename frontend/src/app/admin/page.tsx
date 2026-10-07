'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify admin access
    fetch('http://localhost:8000/admin/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => {
        if (!res.ok) {
          setError('هذه الصفحة للمسؤولين فقط');
          setLoading(false);
          return null;
        }
        return fetch('http://localhost:8000/admin/stats', {
          headers: { Authorization: 'Bearer ' + token },
        });
      })
      .then((res) => res ? res.json() : null)
      .then((data) => {
        if (data) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center" dir="rtl">
        <p className="text-white">جاري التحميل...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-red-400 text-2xl mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">
            العودة إلى اللوحة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white" dir="rtl">
            <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-red-900/20">
        <h1 className="text-xl font-bold">🔴 Admin Panel</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/admin" className="hover:text-blue-400">لوحة التحكم</Link>
          <Link href="/admin/users" className="hover:text-blue-400">المستخدمون</Link>
          <Link href="/admin/campaigns" className="hover:text-blue-400">الحملات</Link>
          <Link href="/admin/costs" className="hover:text-blue-400">التكاليف</Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-white">← عادي</Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8">لوحة التحكم</h2>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">المستخدمون</p>
                <p className="text-3xl font-bold">{stats.users}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">الـWorkspaces</p>
                <p className="text-3xl font-bold">{stats.workspaces}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">البراندات</p>
                <p className="text-3xl font-bold">{stats.brands}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">نسبة النجاح</p>
                <p className="text-3xl font-bold text-green-400">{stats.success_rate}%</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">الحملات</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">الإجمالي</p>
                  <p className="text-2xl font-bold">{stats.campaigns.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">ناجحة</p>
                  <p className="text-2xl font-bold text-green-400">{stats.campaigns.done}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">فاشلة</p>
                  <p className="text-2xl font-bold text-red-400">{stats.campaigns.failed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">قيد التنفيذ</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.campaigns.running}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">اليوم</p>
                  <p className="text-2xl font-bold">{stats.campaigns.today}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}