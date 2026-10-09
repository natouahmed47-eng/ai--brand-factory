'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminCostsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch('https://ai-brand-factory-production.up.railway.app/admin/stats', {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
      fetch('https://ai-brand-factory-production.up.railway.app/admin/users', {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
    ])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData);
        setLoading(false);
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

  // Calculate costs
  const AI_COST_PER_CAMPAIGN = 0.55; // Estimated: images $0.05 + video $0.30 + voice $0.10 + music $0.10
  const totalCampaigns = stats?.campaigns?.done || 0;
  const estimatedAICost = (totalCampaigns * AI_COST_PER_CAMPAIGN).toFixed(2);

  // Subscriptions
  const plansCount = users.reduce((acc: any, u: any) => {
    const plan = u.workspace?.plan || 'starter';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const planPrices: any = {
    starter: 49,
    pro: 149,
    business: 399,
    free: 0,
  };

  const estimatedMRR = Object.keys(plansCount).reduce(
    (sum, plan) => sum + (planPrices[plan] || 0) * plansCount[plan],
    0
  );

  const profit = estimatedMRR - parseFloat(estimatedAICost);
  const margin = estimatedMRR > 0 ? ((profit / estimatedMRR) * 100).toFixed(1) : 0;

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
        <h2 className="text-3xl font-bold mb-2">التكاليف والهامش</h2>
        <p className="text-gray-400 mb-8 text-sm">
          ⚠️ الأرقام تقديرية بناءً على متوسطات ثابتة
        </p>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">MRR المتوقع</p>
            <p className="text-3xl font-bold text-green-400">${estimatedMRR}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">تكلفة AI التقديرية</p>
            <p className="text-3xl font-bold text-red-400">${estimatedAICost}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">صافي الربح</p>
            <p className={'text-3xl font-bold ' + (profit >= 0 ? 'text-green-400' : 'text-red-400')}>
              ${profit.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm text-gray-400 mb-2">هامش الربح</p>
            <p className={'text-3xl font-bold ' + (parseFloat(margin as string) >= 50 ? 'text-green-400' : 'text-yellow-400')}>
              {margin}%
            </p>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">توزيع الخطط</h3>
            <div className="space-y-4">
              {Object.keys(planPrices).filter((p) => planPrices[p] > 0 || plansCount[p]).map((plan) => (
                <div key={plan} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="capitalize">{plan}</span>
                  <div className="flex gap-6">
                    <span className="text-gray-400 text-sm">
                      {plansCount[plan] || 0} عميل
                    </span>
                    <span className="font-bold">
                      ${(planPrices[plan] * (plansCount[plan] || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">تفصيل تكاليف AI</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">صور (Agnes - مجاني)</span>
                <span className="text-green-400">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">فيديو (Wan 2.2)</span>
                <span>$0.30 × {totalCampaigns} = ${(totalCampaigns * 0.30).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">صوت (ElevenLabs v4)</span>
                <span>$0.10 × {totalCampaigns} = ${(totalCampaigns * 0.10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">موسيقى (مكتبة محلية)</span>
                <span className="text-green-400">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">نصوص (OpenRouter)</span>
                <span>$0.05 × {totalCampaigns} = ${(totalCampaigns * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-3 font-bold">
                <span>الإجمالي</span>
                <span className="text-red-400">${estimatedAICost}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Economics */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6">اقتصاديات الحملة الواحدة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">تكلفة الحملة</p>
              <p className="text-2xl font-bold text-red-400">${AI_COST_PER_CAMPAIGN}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">سعر البيع (Starter)</p>
              <p className="text-2xl font-bold">$49 ÷ 5 = $9.80</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">هامش Starter</p>
              <p className="text-2xl font-bold text-green-400">94%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">حملات هذا الشهر</p>
              <p className="text-2xl font-bold">{totalCampaigns}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}