'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'حدث خطأ');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('خطأ في الاتصال بالخادم');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">
          ← العودة إلى اللوحة
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">أنشئ براندك</h1>
        <p className="text-gray-400 mb-8">
          ابدأ بإضافة براندك، وسنبني عقلًا رقميًا له.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              اسم البراند *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              placeholder="مثال: عطور نُوى"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              وصف مختصر (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none"
              placeholder="مثال: عطور فاخرة للرجل العصري"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء البراند'}
            </button>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}