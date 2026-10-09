'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Campaign = {
  id: string;
  brand_id: string;
  idea: any;
  status: string;
  stage: string;
  scenes: any;
  assets: any;
  final_url: string | null;
  error: string | null;
  created_at: string;
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenLoading, setRegenLoading] = useState<number | null>(null);
  const [formats, setFormats] = useState<any>(null);
  const [generatingFormats, setGeneratingFormats] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchCampaign = () => {
      fetch('https://ai-brand-factory-production.up.railway.app/campaigns/' + campaignId, {
        headers: { Authorization: 'Bearer ' + token },
      })
        .then((res) => res.json())
        .then((data) => {
          setCampaign(data);
          setLoading(false);
          if (data.status === 'running') {
            setTimeout(fetchCampaign, 10000);
          }
        })
        .catch(() => setLoading(false));
    };

    fetchCampaign();
  }, [campaignId, router]);

  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!campaign) return;
    setRegenLoading(sceneNumber);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        'https://ai-brand-factory-production.up.railway.app/campaigns/' + campaign.id + '/scenes/' + sceneNumber + '/regenerate',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const updatedScenes = (campaign.scenes || []).map((sc: any) =>
          sc.number === sceneNumber ? data.scene : sc
        );
        setCampaign({ ...campaign, scenes: updatedScenes });
        alert('تم توليد المشهد ' + sceneNumber + ' بنجاح!');
      } else {
        alert('فشل توليد المشهد');
      }
    } catch {
      alert('خطأ في الاتصال');
    }
    setRegenLoading(null);
  };

  const handleGenerateFormats = async () => {
    if (!campaign) return;
    setGeneratingFormats(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        'https://ai-brand-factory-production.up.railway.app/campaigns/' + campaign.id + '/formats',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setFormats(data.formats);
      } else {
        alert('فشل توليد الصيغ');
      }
    } catch {
      alert('خطأ في الاتصال');
    }
    setGeneratingFormats(false);
  };

  const handleRebuild = async () => {
    if (!campaign) return;
    setRebuilding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        'https://ai-brand-factory-production.up.railway.app/campaigns/' + campaign.id + '/rebuild',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCampaign({ ...campaign, final_url: data.final_url, status: 'done' });
        alert('تم إعادة بناء الفيديو النهائي!');
      } else {
        alert('فشل إعادة البناء');
      }
    } catch {
      alert('خطأ في الاتصال');
    }
    setRebuilding(false);
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <p className="text-white">جاري التحميل...</p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]">
        <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4">
          <Link href="/dashboard" className="text-[#D4A574] hover:underline text-sm">
            ← العودة إلى اللوحة
          </Link>
        </nav>
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-[#E05252]">الحملة غير موجودة</p>
        </div>
      </main>
    );
  }

  const isDone = campaign.status === 'done' && campaign.final_url;
  const isRunning = campaign.status === 'running';
  const isFailed = campaign.status === 'failed';

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]" dir="rtl">
      <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-[#D4A574] hover:underline text-sm">
          ← العودة إلى اللوحة
        </Link>
        <Link href={'/brands/' + campaign.brand_id} className="text-[#D4A574] hover:underline text-sm">
          صفحة البراند →
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <span className="text-sm text-[#8B8B8B]">حملة إعلانية</span>
          <h1 className="text-3xl font-bold mt-1">
            {campaign.idea?.title || 'حملة بدون عنوان'}
          </h1>
          {campaign.idea?.description && (
            <p className="text-[#8B8B8B] mt-2">{campaign.idea.description}</p>
          )}
          <p className="text-sm text-[#5A5A5A] mt-3">
            {new Date(campaign.created_at).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {isDone && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">الفيديو النهائي</h2>
            <video
              controls
              className="w-full max-w-md mx-auto rounded-2xl border border-[rgba(212,165,116,0.12)] shadow-2xl mb-8"
              src={'https://ai-brand-factory-production.up.railway.app' + campaign.final_url}
            />
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={async () => {
                  try {
                    const url = 'https://ai-brand-factory-production.up.railway.app' + campaign.final_url;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'campaign-' + campaign.id + '.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (e) {
                    alert('فشل التحميل');
                  }
                }}
                className="px-6 py-3 bg-[#D4A574] hover:opacity-90 rounded-lg font-semibold transition"
              >
                ⬇️ تحميل الفيديو
              </button>
            </div>
          </div>
        )}

        {isDone && (
          <div className="mt-12 bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">صيغ متعددة للمنصات</h3>
              <button
                onClick={handleGenerateFormats}
                disabled={generatingFormats}
                className="px-5 py-2 bg-[#D4A574] hover:opacity-90 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
              >
                {generatingFormats ? '⏳ جاري التوليد...' : '🎬 ولّد 3 صيغ'}
              </button>
            </div>

            {!formats && !generatingFormats && (
              <p className="text-sm text-[#8B8B8B] text-center py-4">
                اضغط الزر لتوليد نسخ جاهزة لكل المنصات (TikTok، Instagram، YouTube).
              </p>
            )}

            {generatingFormats && !formats && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#D4A574] border-t-transparent mb-4" />
                <p className="text-sm text-[#8B8B8B]">جاري توليد 3 صيغ...</p>
              </div>
            )}

            {formats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-xl p-4">
                  <div className="text-center mb-3">
                    <div className="text-sm font-bold">9:16 عمودي</div>
                    <div className="text-xs text-[#8B8B8B]">TikTok • Reels • Shorts</div>
                  </div>
                  {formats.vertical_9x16 && (
                    <>
                      <video
                        controls
                        className="w-full rounded-lg border border-[rgba(212,165,116,0.12)] mb-3"
                        src={'https://ai-brand-factory-production.up.railway.app' + formats.vertical_9x16}
                      />
                      <a
                        href={'https://ai-brand-factory-production.up.railway.app' + formats.vertical_9x16}
                        download
                        className="block text-center px-4 py-2 bg-[#D4A574] hover:bg-[#E5B98A] rounded-lg text-xs font-semibold transition"
                      >
                        ⬇️ تحميل
                      </a>
                    </>
                  )}
                </div>

                <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-xl p-4">
                  <div className="text-center mb-3">
                    <div className="text-sm font-bold">1:1 مربع</div>
                    <div className="text-xs text-[#8B8B8B]">Instagram Feed</div>
                  </div>
                  {formats.square_1x1 && (
                    <>
                      <video
                        controls
                        className="w-full rounded-lg border border-[rgba(212,165,116,0.12)] mb-3"
                        src={'https://ai-brand-factory-production.up.railway.app' + formats.square_1x1}
                      />
                      <a
                        href={'https://ai-brand-factory-production.up.railway.app' + formats.square_1x1}
                        download
                        className="block text-center px-4 py-2 bg-[#D4A574] hover:bg-[#E5B98A] rounded-lg text-xs font-semibold transition"
                      >
                        ⬇️ تحميل
                      </a>
                    </>
                  )}
                </div>

                <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-xl p-4">
                  <div className="text-center mb-3">
                    <div className="text-sm font-bold">16:9 أفقي</div>
                    <div className="text-xs text-[#8B8B8B]">YouTube • Facebook</div>
                  </div>
                  {formats.landscape_16x9 && (
                    <>
                      <video
                        controls
                        className="w-full rounded-lg border border-[rgba(212,165,116,0.12)] mb-3"
                        src={'https://ai-brand-factory-production.up.railway.app' + formats.landscape_16x9}
                      />
                      <a
                        href={'https://ai-brand-factory-production.up.railway.app' + formats.landscape_16x9}
                        download
                        className="block text-center px-4 py-2 bg-[#D4A574] hover:bg-[#E5B98A] rounded-lg text-xs font-semibold transition"
                      >
                        ⬇️ تحميل
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isRunning && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#D4A574] border-t-transparent mb-6" />
            <h2 className="text-2xl font-bold mb-3">المصنع يعمل الآن</h2>
            <p className="text-[#8B8B8B] mb-8">يُحدَّث كل 10 ثوانٍ</p>
            <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-sm text-[#8B8B8B] mb-3">المرحلة الحالية</div>
              <div className="text-xl font-bold">{campaign.stage || 'بدء الإنتاج...'}</div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4 text-[#E05252]">فشلت الحملة</h2>
            <div className="bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252] px-6 py-4 rounded-lg max-w-2xl mx-auto text-sm">
              {campaign.error || 'خطأ غير معروف'}
            </div>
          </div>
        )}

        {campaign.scenes && campaign.scenes.length > 0 && (
          <div className="mt-12 bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">المشاهد ({campaign.scenes.length})</h3>
              {campaign.status === 'done' && (
                <button
                  onClick={handleRebuild}
                  disabled={rebuilding}
                  className="px-5 py-2 bg-[#D4A574] hover:opacity-90 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
                >
                  {rebuilding ? 'جاري إعادة البناء...' : '🔄 إعادة بناء الفيديو النهائي'}
                </button>
              )}
            </div>
            <div className="space-y-6">
              {campaign.scenes.map((scene: any) => {
                const hasVideo = !!scene.video_url;
                const hasMerged = !!scene.merged_url;
                const hasImage = !!scene.image_url;
                const hasVoice = !!scene.voice_url;
                return (
                  <div key={scene.number} className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Image Thumbnail */}
                      <div className="flex-shrink-0 w-full md:w-40">
                        {hasImage ? (
                          <img
                            src={'https://ai-brand-factory-production.up.railway.app' + scene.image_url}
                            alt={'Scene ' + scene.number}
                            className="w-full h-40 md:h-40 object-cover rounded-lg border border-[rgba(212,165,116,0.12)]"
                          />
                        ) : (
                          <div className="w-full h-40 bg-[#1A1A1F] rounded-lg border border-[rgba(212,165,116,0.12)] flex items-center justify-center text-[#5A5A5A] text-xs">
                            لا توجد صورة
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#D4A574] rounded-lg flex items-center justify-center text-lg font-bold">
                              {scene.number}
                            </div>
                            <div>
                              <div className="font-bold">مشهد {scene.number}</div>
                              <div className="text-xs text-[#8B8B8B]">
                                {scene.duration}ث
                                {hasMerged && ' • ✓ مكتمل'}
                                {!hasMerged && hasVideo && ' • ⚠ بدون دمج'}
                                {!hasVideo && ' • ❌ فاشل'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRegenerateScene(scene.number)}
                            disabled={regenLoading === scene.number}
                            className="px-3 py-1.5 bg-[#1A1A1F] hover:bg-[#202026] disabled:opacity-50 rounded-lg text-xs font-semibold transition"
                          >
                            {regenLoading === scene.number ? '⏳' : '🔄 إعادة التوليد'}
                          </button>
                        </div>

                        {scene.visual && (
                          <p className="text-xs text-[#8B8B8B] mb-2">
                            <span className="text-[#5A5A5A]">بصري: </span>
                            {scene.visual}
                          </p>
                        )}
                        {scene.voice_over && (
                          <p className="text-xs text-[#8B8B8B] italic mb-3">
                            <span className="text-[#5A5A5A] not-italic">صوت: </span>
                            {scene.voice_over}
                          </p>
                        )}

                        {/* Media Players */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {hasMerged && (
                            <details className="text-xs">
                              <summary className="cursor-pointer px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-[#D4A574]/30 inline-block">
                                🎬 عرض الفيديو المدموج
                              </summary>
                              <video
                                controls
                                className="mt-3 w-full max-w-md rounded-lg border border-[rgba(212,165,116,0.12)]"
                                src={'https://ai-brand-factory-production.up.railway.app' + scene.merged_url}
                              />
                            </details>
                          )}
                          {!hasMerged && hasVideo && (
                            <details className="text-xs">
                              <summary className="cursor-pointer px-3 py-1.5 bg-[rgba(212,165,116,0.1)] hover:bg-yellow-500/30 rounded-lg border border-yellow-500/30 inline-block">
                                🎬 عرض الفيديو (بدون صوت)
                              </summary>
                              <video
                                controls
                                className="mt-3 w-full max-w-md rounded-lg border border-[rgba(212,165,116,0.12)]"
                                src={'https://ai-brand-factory-production.up.railway.app' + scene.video_url}
                              />
                            </details>
                          )}
                          {hasVoice && (
                            <details className="text-xs">
                              <summary className="cursor-pointer px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-[#D4A574]/30 inline-block">
                                🎙️ سماع الصوت
                              </summary>
                              <audio
                                controls
                                className="mt-3 w-full max-w-md"
                                src={'https://ai-brand-factory-production.up.railway.app' + scene.voice_url}
                              />
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {campaign.assets && (
          <div className="mt-12 bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">الأصول المُنتَجة</h3>
            <div className="space-y-2 text-sm">
              {campaign.assets.music_url && (
                <div className="flex justify-between">
                  <span className="text-[#8B8B8B]">🎵 الموسيقى</span>
                  <a
                    href={'https://ai-brand-factory-production.up.railway.app' + campaign.assets.music_url}
                    target="_blank"
                    className="text-[#D4A574] hover:underline"
                  >
                    تحميل
                  </a>
                </div>
              )}
              {campaign.assets.captions_url && (
                <div className="flex justify-between">
                  <span className="text-[#8B8B8B]">📝 النصوص (SRT)</span>
                  <a
                    href={'https://ai-brand-factory-production.up.railway.app' + campaign.assets.captions_url}
                    target="_blank"
                    className="text-[#D4A574] hover:underline"
                  >
                    تحميل
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
