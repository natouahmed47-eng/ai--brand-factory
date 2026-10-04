'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Idea = {
  title: string;
  description: string;
  content_type: string;
  duration: number;
  tone: string;
};

type Scene = {
  number: number;
  duration: number;
  visual: string;
  voice_over: string;
  on_screen_text: string;
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const [stage, setStage] = useState<'idle' | 'thinking' | 'ideas' | 'script-loading' | 'script'>('idle');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handleGenerate = async () => {
    setStage('thinking');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/campaigns/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brand_id: brandId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed');
        setStage('idle');
        return;
      }

      setIdeas(data.ideas || []);
      setStage('ideas');
    } catch {
      setError('Connection error');
      setStage('idle');
    }
  };

  const handleSelectIdea = async (idea: Idea) => {
    setSelectedIdea(idea);
    setStage('script-loading');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/campaigns/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brand_id: brandId, idea }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed');
        setStage('ideas');
        return;
      }

      setScenes(data.scenes || []);
      setStage('script');
    } catch {
      setError('Connection error');
      setStage('ideas');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <Link href={`/brands/${brandId}`} className="text-blue-400 hover:underline text-sm">
          Back to Brand
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {stage === 'idle' && (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Create Your Campaign</h1>
            <p className="text-gray-400 mb-10 text-lg">
              AI Creative Director will analyze your Brand Brain and suggest 5 creative ideas.
            </p>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerate}
              className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded-xl font-bold text-xl transition"
            >
              Generate 5 Ideas
            </button>
          </div>
        )}

        {stage === 'thinking' && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6" />
            <h2 className="text-2xl font-bold mb-3">AI Creative Director is thinking...</h2>
            <p className="text-gray-400">Reading your Brand Brain and generating ideas</p>
          </div>
        )}

        {stage === 'script-loading' && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-6" />
            <h2 className="text-2xl font-bold mb-3">Writing your script...</h2>
            <p className="text-gray-400">Building scene-by-scene script from your idea</p>
          </div>
        )}

        {stage === 'ideas' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Choose Your Creative Idea</h1>
            <p className="text-gray-400 mb-8">5 ideas generated from your Brand Brain. Click one to proceed.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectIdea(idea)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/10 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold">{idea.title}</h3>
                    <span className="text-xs px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                      {idea.content_type}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">{idea.description}</p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>Duration: {idea.duration}s</span>
                    <span>•</span>
                    <span>Tone: {idea.tone}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition"
              >
                Generate 5 More Ideas
              </button>
            </div>
          </div>
        )}

        {stage === 'script' && (
          <div>
            <div className="mb-8">
              <span className="text-sm text-gray-400">Idea</span>
              <h1 className="text-3xl font-bold mb-2">{selectedIdea?.title}</h1>
              <p className="text-gray-400">{selectedIdea?.description}</p>
            </div>

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Storyboard</h2>
              <span className="text-sm text-gray-400">{scenes.length} scenes • {scenes.reduce((a, s) => a + s.duration, 0)}s total</span>
            </div>

            <div className="space-y-4">
              {scenes.map((scene) => (
                <div key={scene.number} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl font-bold">
                      {scene.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold">Scene {scene.number}</h3>
                        <span className="text-xs px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                          {scene.duration}s
                        </span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Visual:</span>
                          <p className="text-gray-200">{scene.visual}</p>
                        </div>
                        {scene.voice_over && (
                          <div>
                            <span className="text-gray-500 text-xs">Voice Over:</span>
                            <p className="text-gray-200 italic">{scene.voice_over}</p>
                          </div>
                        )}
                        {scene.on_screen_text && (
                          <div>
                            <span className="text-gray-500 text-xs">On-Screen Text:</span>
                            <p className="text-blue-300 font-semibold">{scene.on_screen_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStage('ideas');
                  setScenes([]);
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition"
              >
                ← Back to Ideas
              </button>
              <button
                disabled
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold opacity-50 cursor-not-allowed"
              >
                Generate Video (coming soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
