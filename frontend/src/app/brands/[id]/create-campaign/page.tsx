'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
};

type Idea = {
  title: string;
  description: string;
  content_type: string;
  duration: number;
  tone: string;
};

type Campaign = {
  id: string;
  status: string;
  stage: string;
  final_url: string | null;
  error: string | null;
};

type Stage = 'loading' | 'select-product' | 'thinking' | 'ideas' | 'creating' | 'producing' | 'done' | 'failed';

export default function CreateCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [stage, setStage] = useState<Stage>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('http://localhost:8000/brands/' + brandId + '/products', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setStage('select-product');
      })
      .catch(() => setStage('select-product'));
  }, [router, brandId]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const connectWebSocket = (campaignId: string) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket('ws://localhost:8000/ws/campaigns/' + campaignId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state' || data.type === 'progress' || data.type === 'done') {
          setCampaign({
            id: campaignId,
            status: data.status,
            stage: data.stage,
            final_url: data.final_url,
            error: data.error,
          });
          if (data.status === 'done' || data.type === 'done') setStage('done');
          else if (data.status === 'failed') setStage('failed');
        }
      } catch (e) {}
    };

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Polling fallback: even if WS fails, poll every 5s
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/campaigns/' + campaignId, {
          headers: { Authorization: 'Bearer ' + token },
        });
        const data = await res.json();
        setCampaign({
          id: campaignId,
          status: data.status,
          stage: data.stage,
          final_url: data.final_url,
          error: data.error,
        });
        if (data.status === 'done') {
          setStage('done');
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setStage('failed');
          clearInterval(pollInterval);
        }
      } catch {}
    }, 5000);
  };

  const handleGenerateIdeas = async () => {
    if (!selectedProduct) {
      setError('اختر منتجًا أولًا');
      return;
    }
    setStage('thinking');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/campaigns/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ brand_id: brandId, product_id: selectedProduct.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'فشل');
        setStage('select-product');
        return;
      }
      setIdeas(data.ideas || []);
      setStage('ideas');
    } catch {
      setError('خطأ في الاتصال');
      setStage('select-product');
    }
  };

  const handleSelectIdea = async (idea: Idea) => {
    setSelectedIdea(idea);
    setStage('creating');
    setError('');
    setElapsed(0);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ brand_id: brandId, product_id: selectedProduct?.id || null, idea }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'فشل');
        setStage('ideas');
        return;
      }
      setCampaign({ id: data.id, status: data.status, stage: data.stage, final_url: null, error: null });
      setStage('producing');
      connectWebSocket(data.id);
    } catch {
      setError('خطأ في الاتصال');
      setStage('ideas');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  const stageLabel = (s: string) => {
    if (!s) return 'بدء الإنتاج...';
    const parts = s.split('|').map((p) => p.trim());
    const map: Record<string, string> = {
      script: 'كتابة السكريبت',
      image: 'توليد الصورة',
      video: 'توليد الفيديو',
      voice: 'توليد التعليق الصوتي',
      merge_scene: 'دمج المشهد',
      combine: 'دمج المشاهد',
      music: 'تأليف الموسيقى',
      add_music: 'إضافة الموسيقى',
      captions: 'إضافة النصوص',
      pipeline: 'اللمسات الأخيرة',
      complete: 'اكتمل',
      starting: 'البدء',
    };
    return (map[parts[0]] || parts[0]) + (parts[2] ? ' - ' + parts[2] : '');
  };

  if (!mounted || stage === 'loading') {
    return (
      <main className="min-h-screen bg-[#0B0B0D] flex items-center justify-center" dir="rtl">
        <p className="text-white">جاري التحميل...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]" dir="rtl">
      <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4">
        <Link href={'/brands/' + brandId} className="text-[#D4A574] hover:underline text-sm">
          ← العودة إلى البراند
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-5xl">

        {stage === 'select-product' && (
          <div className="py-8">
            <h1 className="text-4xl font-bold mb-4 text-center">أنشئ حملتك</h1>
            <p className="text-[#8B8B8B] mb-10 text-lg text-center">اختر المنتج الذي تريد الإعلان عنه</p>

            {error && (
              <div className="bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252] px-4 py-3 rounded-lg mb-6 max-w-md mx-auto text-center">
                {error}
              </div>
            )}

            {products.length === 0 ? (
              <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-12 text-center max-w-2xl mx-auto">
                <p className="text-[#8B8B8B] mb-4">لا توجد منتجات لهذا البراند</p>
                <Link
                  href={'/brands/' + brandId + '/products'}
                  className="inline-block px-6 py-3 bg-[#D4A574] hover:bg-[#E5B98A] rounded-lg font-semibold"
                >
                  + إضافة منتج
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {products.map((product) => {
                    const isSelected = selectedProduct?.id === product.id;
                    const hasImages = product.images && product.images.length >= 3;
                    return (
                      <div
                        key={product.id}
                        onClick={() => hasImages && setSelectedProduct(product)}
                        className={
                          'rounded-2xl p-4 transition border ' +
                          (isSelected
                            ? 'bg-blue-500/20 border-[#D4A574] ring-2 ring-blue-500'
                            : hasImages
                            ? 'bg-[#1A1A1F] border-[rgba(212,165,116,0.12)] hover:border-[#D4A574]/50 cursor-pointer'
                            : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.12)] opacity-50 cursor-not-allowed')
                        }
                      >
                        <div className="grid grid-cols-3 gap-1 mb-3">
                          {product.images && product.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={'http://localhost:8000' + img}
                              alt={product.name}
                              className="w-full h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                        <h3 className="font-bold mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs text-[#8B8B8B] mb-2 line-clamp-2">{product.description}</p>
                        )}
                        {!hasImages && (
                          <p className="text-xs text-yellow-400">⚠ يحتاج 3 صور</p>
                        )}
                        {isSelected && (
                          <p className="text-xs text-[#D4A574] mt-2 font-bold">✓ مختار</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <button
                    onClick={handleGenerateIdeas}
                    disabled={!selectedProduct}
                    className="px-10 py-5 bg-[#D4A574] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition"
                  >
                    {selectedProduct ? 'اقترح 5 أفكار لـ ' + selectedProduct.name : 'اختر منتجًا للبدء'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {stage === 'thinking' && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#D4A574] border-t-transparent mb-6" />
            <h2 className="text-2xl font-bold mb-3">AI Creative Director يفكر...</h2>
            <p className="text-[#8B8B8B]">يقرأ عقل براندك والمنتج، ويبتكر أفكارًا</p>
          </div>
        )}

        {stage === 'ideas' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">اختر فكرتك الإبداعية</h1>
            <p className="text-[#8B8B8B] mb-8">5 أفكار مبنية على "{selectedProduct?.name}". اضغط على إحداها.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectIdea(idea)}
                  className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6 hover:border-[#D4A574]/50 hover:bg-[#1A1A1F] transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold">{idea.title}</h3>
                    <span className="text-xs px-3 py-1 bg-blue-500/20 rounded-full border border-[#D4A574]/30">
                      {idea.content_type}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">{idea.description}</p>
                  <div className="flex gap-3 text-xs text-[#8B8B8B]">
                    <span>المدة: {idea.duration}ث</span>
                    <span>•</span>
                    <span>النبرة: {idea.tone}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10 flex gap-4 justify-center">
              <button
                onClick={() => setStage('select-product')}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                ← تغيير المنتج
              </button>
              <button
                onClick={handleGenerateIdeas}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                ولّد 5 أفكار أخرى
              </button>
            </div>
          </div>
        )}

        {stage === 'creating' && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-6" />
            <h2 className="text-2xl font-bold mb-3">جاري إنشاء الحملة...</h2>
          </div>
        )}

        {stage === 'producing' && campaign && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#D4A574] border-t-transparent mb-6" />
            <h1 className="text-3xl font-bold mb-4">المصنع يعمل الآن</h1>
            <p className="text-[#8B8B8B] mb-10">إنتاج الفيديو يستغرق 10-15 دقيقة</p>
            <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-8 max-w-2xl mx-auto mb-6">
              <div className="text-sm text-[#8B8B8B] mb-3">المرحلة الحالية</div>
              <div className="text-xl font-bold mb-4">{stageLabel(campaign.stage)}</div>
              <div className="flex justify-between text-sm text-[#8B8B8B]">
                <span>الوقت المنقضي: {formatTime(elapsed)}</span>
                <span>متوسط: ~13 دقيقة</span>
              </div>
            </div>
            <Link href="/dashboard" className="text-[#D4A574] hover:underline text-sm">
              يمكنك متابعة العمل من اللوحة
            </Link>
          </div>
        )}

        {stage === 'done' && campaign && (
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4">🎉 إعلانك جاهز!</h1>
            <p className="text-[#8B8B8B] mb-10">اضغط للتشغيل</p>
            <video
              controls
              className="w-full max-w-md mx-auto rounded-2xl border border-[rgba(212,165,116,0.12)] shadow-2xl mb-8"
              src={'http://localhost:8000' + campaign.final_url}
            />
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={async () => {
                  try {
                    const url = 'http://localhost:8000' + campaign.final_url;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'campaign.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (e) { alert('فشل التحميل'); }
                }}
                className="px-6 py-3 bg-[#D4A574] hover:opacity-90 rounded-lg font-semibold transition"
              >
                ⬇️ تحميل الفيديو
              </button>
              <Link
                href={'/campaigns/' + campaign.id}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                عرض التفاصيل
              </Link>
              <button
                onClick={() => {
                  setStage('select-product');
                  setCampaign(null);
                  setIdeas([]);
                  setElapsed(0);
                  setSelectedIdea(null);
                }}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                ✨ حملة جديدة
              </button>
            </div>
          </div>
        )}

        {stage === 'failed' && campaign && (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4 text-red-400">فشلت الحملة</h1>
            <div className="bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252] px-6 py-4 rounded-lg mb-8 max-w-2xl mx-auto text-sm">
              {campaign.error || 'خطأ غير معروف'}
            </div>
            <button
              onClick={() => {
                setStage('select-product');
                setCampaign(null);
                setElapsed(0);
              }}
              className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
            >
              ← العودة
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
