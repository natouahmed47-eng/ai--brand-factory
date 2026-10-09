'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRow = {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  workspace: {
    id: string;
    name: string;
    plan: string;
    credits: number;
  } | null;
  brands_count: number;
  campaigns_count: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('https://ai-brand-factory-production.up.railway.app/admin/users', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => {
        if (!res.ok) {
          setError('هذه الصفحة للمسؤولين فقط');
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUsers(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.workspace?.name || '').toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">المستخدمون ({users.length})</h2>
          <input
            type="text"
            placeholder="ابحث بالبريد أو اسم Workspace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 w-64"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-right text-sm text-gray-400">
                <th className="px-6 py-4">البريد الإلكتروني</th>
                <th className="px-6 py-4">Workspace</th>
                <th className="px-6 py-4">الخطة</th>
                <th className="px-6 py-4">البراندات</th>
                <th className="px-6 py-4">الحملات</th>
                <th className="px-6 py-4">Credits</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-sm">{u.workspace?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-500/20 rounded text-xs capitalize">
                      {u.workspace?.plan || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{u.brands_count}</td>
                  <td className="px-6 py-4 text-sm text-center">{u.campaigns_count}</td>
                  <td className="px-6 py-4 text-sm text-center">{u.workspace?.credits || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    {u.is_admin ? (
                      <span className="px-2 py-1 bg-red-500/30 text-red-200 rounded text-xs">
                        Admin
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}