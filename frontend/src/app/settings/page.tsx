'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setWorkspace(data.workspace);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    if (newPassword.length < 8) {
      setMsg('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('كلمتا المرور غير متطابقتين');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.detail || 'فشل التغيير');
        setSaving(false);
        return;
      }
      setMsg('✓ تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMsg('خطأ في الاتصال');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0B0D] flex items-center justify-center" dir="rtl">
        <p className="text-white">جاري التحميل...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]" dir="rtl">
      <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-[#D4A574] hover:underline text-sm">
          ← العودة إلى اللوحة
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-[#E05252] hover:text-red-300"
        >
          تسجيل الخروج
        </button>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">الإعدادات</h1>

        {/* Account Info */}
        <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">معلومات الحساب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[rgba(212,165,116,0.12)] pb-3">
              <span className="text-[#8B8B8B]">البريد الإلكتروني</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between border-b border-[rgba(212,165,116,0.12)] pb-3">
              <span className="text-[#8B8B8B]">اسم Workspace</span>
              <span>{workspace?.name}</span>
            </div>
            <div className="flex justify-between border-b border-[rgba(212,165,116,0.12)] pb-3">
              <span className="text-[#8B8B8B]">الخطة الحالية</span>
              <span className="capitalize text-[#D4A574]">{workspace?.plan || 'starter'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B8B8B]">Credits المتبقية</span>
              <span>{workspace?.credits || 0}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">تغيير كلمة المرور</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white"
              />
            </div>

            {msg && (
              <div className={'px-4 py-3 rounded-lg text-sm ' + (msg.startsWith('✓') ? 'bg-[rgba(107,191,122,0.1)] border border-[rgba(107,191,122,0.3)] text-green-200' : 'bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252]')}>
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#D4A574] hover:bg-[#E5B98A] disabled:opacity-50 rounded-lg font-semibold transition"
            >
              {saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}