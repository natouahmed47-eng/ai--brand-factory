'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  colors: { palette: string[] } | null;
  brain_score: number;
  created_at: string;
};

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`http://localhost:8000/brands/${brandId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setBrand(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Brand not found');
        setLoading(false);
      });
  }, [brandId, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`http://localhost:8000/brands/${brandId}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Upload failed');
        setUploading(false);
        return;
      }

      setBrand(data);
      setUploading(false);
    } catch {
      setError('Connection error');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </main>
    );
  }

  if (!brand) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <nav className="border-b border-white/10 px-6 py-4">
          <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">
            Back to Dashboard
          </Link>
        </nav>
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-red-400">{error || 'Brand not found'}</p>
        </div>
      </main>
    );
  }

  const logoUrl = brand.logo_url ? `http://localhost:8000${brand.logo_url}` : null;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center gap-6 mb-12">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-5xl font-bold cursor-pointer hover:opacity-80 transition overflow-hidden relative"
          >
            {uploading ? (
              <span className="text-sm">Uploading...</span>
            ) : logoUrl ? (
              <img src={logoUrl} alt={brand.name} className="w-full h-full object-cover" />
            ) : (
              <span>{brand.name.charAt(0)}</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div>
            <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
            <p className="text-gray-400 text-sm mb-3">
              Created: {new Date(brand.created_at).toLocaleDateString()}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg text-sm font-semibold transition"
            >
              {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {brand.colors?.palette && brand.colors.palette.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-2">Brand Colors</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Extracted automatically from your logo.
            </p>
            <div className="flex gap-3 flex-wrap">
              {brand.colors.palette.map((color, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-20 h-20 rounded-xl border border-white/20 shadow-lg"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-gray-400 mt-2 font-mono">{color}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Brand Brain</h2>
            <span className="text-3xl font-bold text-blue-400">{brand.brain_score ?? 0}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${brand.brain_score ?? 0}%` }}
            />
          </div>
          <p className="text-gray-400 mb-6">
            {(brand.brain_score ?? 0) < 100
              ? 'Complete your Brand Brain to unlock the full power of the platform.'
              : 'Your Brand Brain is complete! Ready to create campaigns.'}
          </p>
          {(brand.brain_score ?? 0) < 100 ? (
            <Link
              href={`/brands/${brand.id}/brain`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Complete Brand Brain
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 bg-purple-500/50 rounded-lg font-semibold cursor-not-allowed"
            >
              Create Campaign (coming soon)
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
