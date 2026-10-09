'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type CampaignRow = {
  id: string;
  status: string;
  stage: string;
  created_at: string;
  final_url: string | null;
  workspace_name: string;
  brand_name: string;
  error: string | null;
};

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('https://ai-brand-factory-production.up.railway.app/admin/campaigns?limit=200', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => {
        if (!res.ok) { setError('هذه الصفحة للمسؤولين فقط'); setLoading(false); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) { setCampaigns(data); setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filtered = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter);

  const counts = {
    all: campaigns.length,
    done: campaigns.filter((c) => c.status === 'done').length,
    failed: campaigns.filter((c) => c.status === 'failed').length,
    running: campaigns.filter((c) => c.status === 'running').length,
  };

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
          <Link href="/dashboard" className="text-blue-400 hover:underline">العودة</Link>
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
        <h2 className="text-3xl font-bold mb-8">الحملات</h2>

        <div className="flex gap-3 mb-6">
          {[
            { key: 'all', label: 'الكل', count: counts.all },
            { key: 'done', label: 'ناجحة', count: counts.done },
            { key: 'failed', label: 'فاشلة', count: counts.failed },
            { key: 'running', label: 'قيد التنفيذ', count: counts.running },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={'px-5 py-2 rounded-lg text-sm transition ' +
                (filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10')}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-right text-sm text-gray-400">
                <th className="px-4 py-4">الحالة</th>
                <th className="px-4 py-4">البراند</th>
                <th className="px-4 py-4">العميل</th>
                <th className="px-4 py-4">المرحلة</th>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const statusColors: any = {
                  done: 'bg-green-500/20 text-green-300 border-green-500/30',
                  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
                  running: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                };
                const statusLabels: any = {
                  done: 'ناجحة',
                  failed: 'فاشلة',
                  running: 'قيد التنفيذ',
                };
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-4">
                      <span className={'px-2 py-1 rounded text-xs border ' + (statusColors[c.status] || 'bg-gray-500/20')}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">{c.brand_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">{c.workspace_name}</td>
                    <td className="px-4 py-4 text-xs text-gray-500 max-w-xs truncate">
                      {c.stage || '-'}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {c.final_url ? (
                        <a href={'https://ai-brand-factory-production.up.railway.app' + c.final_url} target="_blank"
                          className="text-blue-400 hover:underline">
                          مشاهدة
                        </a>
                      ) : c.error ? (
                        <span className="text-red-400 text-xs" title={c.error}>
                          عرض الخطأ
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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