'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'حدث خطأ');
        setLoading(false);
        return;
      }

      setMessage('تم إرسال رابط إعادة التعيين إلى بريدك');
      if (data.token) {
        setToken(data.token);
      }
      setLoading(false);
    } catch {
      setError('خطأ في الاتصال بالخادم');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-6" dir="rtl">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          نسيت كلمة المرور؟
        </h1>
        <p className="text-gray-400 text-center mb-8">
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {token && (
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-100 px-4 py-3 rounded-lg text-xs break-all">
              <p className="font-bold mb-1">رابط إعادة التعيين:</p>
              <Link href={'/reset-password?token=' + token} className="text-blue-300 underline">
                اضغط هنا لإعادة تعيين كلمة المرور
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          تذكرت كلمة المرور؟{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}