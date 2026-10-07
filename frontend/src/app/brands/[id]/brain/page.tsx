'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const TONES = ['فاخر', 'ودود', 'جسور', 'هادئ', 'مرح', 'ملهم', 'تقني', 'أنيق'];
const EMOTIONS = ['ثقة', 'فخامة', 'إثارة', 'أمان', 'انتماء', 'تفوّق', 'حنين', 'طاقة'];

export default function BrandBrainPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [tones, setTones] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [emotion, setEmotion] = useState('');

  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [market, setMarket] = useState('');
  const [language, setLanguage] = useState('');
  const [dialect, setDialect] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const toggleTone = (t: string) => {
    if (tones.includes(t)) {
      setTones(tones.filter((x) => x !== t));
    } else if (tones.length < 3) {
      setTones([...tones, t]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/brands/${brandId}/brain`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personality: {
            tone: tones,
            communication_style: communicationStyle,
            emotional_territory: emotion,
          },
          audience: {
            age_range: ageRange,
            gender,
            market,
            language,
            dialect,
          },
          rules: {
            visual_defaults: true,
            content_defaults: true,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Error saving');
        setLoading(false);
        return;
      }

      router.push(`/brands/${brandId}`);
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]">
      <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4">
        <Link href={`/brands/${brandId}`} className="text-[#D4A574] hover:underline text-sm">
          Back to Brand
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= n ? 'bg-blue-500 text-white' : 'bg-[#1A1A1F] text-[#8B8B8B]'
                }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div className={`w-12 h-1 ${step > n ? 'bg-blue-500' : 'bg-[#1A1A1F]'}`} />
              )}
            </div>
          ))}
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {step === 1 && 'Brand Personality'}
          {step === 2 && 'Brand Audience'}
          {step === 3 && 'Brand Rules'}
        </h1>
        <p className="text-[#8B8B8B] mb-8">
          {step === 1 && 'How does your brand speak and feel?'}
          {step === 2 && 'Who is your brand talking to?'}
          {step === 3 && 'We will set smart defaults for your brand rules.'}
        </p>

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">
                Tone of Voice (choose 2-3)
              </label>
              <div className="flex flex-wrap gap-3">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTone(t)}
                    className={`px-4 py-2 rounded-full border transition ${
                      tones.includes(t)
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">
                Communication Style
              </label>
              <div className="flex flex-wrap gap-3">
                {['مباشر', 'قصصي', 'رسمي', 'ودود'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCommunicationStyle(s)}
                    className={`px-4 py-2 rounded-full border transition ${
                      communicationStyle === s
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">
                Emotional Territory
              </label>
              <div className="flex flex-wrap gap-3">
                {EMOTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmotion(e)}
                    className={`px-4 py-2 rounded-full border transition ${
                      emotion === e
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={tones.length < 2 || !communicationStyle || !emotion}
              className="px-8 py-3 bg-[#D4A574] hover:bg-[#E5B98A] disabled:bg-blue-500/30 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">Age Range</label>
              <div className="flex flex-wrap gap-3">
                {['18-24', '25-34', '35-44', '45+'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgeRange(a)}
                    className={`px-4 py-2 rounded-full border transition ${
                      ageRange === a
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">Gender</label>
              <div className="flex flex-wrap gap-3">
                {['رجال', 'نساء', 'الاثنين'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 rounded-full border transition ${
                      gender === g
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">Market</label>
              <div className="flex flex-wrap gap-3">
                {['السعودية', 'الخليج', 'عالمي'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarket(m)}
                    className={`px-4 py-2 rounded-full border transition ${
                      market === m
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F5F5F0] mb-3">Language</label>
              <div className="flex flex-wrap gap-3">
                {['عربي', 'إنجليزي', 'مزيج'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-4 py-2 rounded-full border transition ${
                      language === l
                        ? 'bg-blue-500 border-[#D4A574]'
                        : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {language === 'عربي' && (
              <div>
                <label className="block text-sm text-[#F5F5F0] mb-3">Dialect</label>
                <div className="flex flex-wrap gap-3">
                  {['فصحى', 'خليجي', 'سعودي'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDialect(d)}
                      className={`px-4 py-2 rounded-full border transition ${
                        dialect === d
                          ? 'bg-blue-500 border-[#D4A574]'
                          : 'bg-[#1A1A1F] border-[rgba(212,165,116,0.2)] hover:border-blue-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!ageRange || !gender || !market || !language}
                className="px-8 py-3 bg-[#D4A574] hover:bg-[#E5B98A] disabled:bg-blue-500/30 disabled:cursor-not-allowed rounded-lg font-semibold transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">Visual Rules</h3>
              <p className="text-sm text-[#8B8B8B]">
                Logo placement, colors, fonts, lighting — set automatically based on your brand.
              </p>
            </div>
            <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">Content Rules</h3>
              <p className="text-sm text-[#8B8B8B]">
                Hook style, music, transitions, scene length — configured for your audience.
              </p>
            </div>
            <div className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">Cultural & Legal</h3>
              <p className="text-sm text-[#8B8B8B]">
                Saudi cultural defaults applied automatically.
              </p>
            </div>

            {error && (
              <div className="bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-[#1A1A1F] hover:bg-[#202026] rounded-lg font-semibold transition"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-8 py-3 bg-[#D4A574] hover:opacity-90 disabled:opacity-50 rounded-lg font-semibold transition"
              >
                {loading ? 'Building...' : 'Build Brand Brain'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
