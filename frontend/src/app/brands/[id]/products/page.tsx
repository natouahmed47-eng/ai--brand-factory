'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price: string | null;
  images: string[];
  features: string[];
  created_at: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentProductIdRef = useRef<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = () => {
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
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [brandId, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ brand_id: brandId, name, description, price }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed');
        setCreating(false);
        return;
      }
      setProducts([data, ...products]);
      setName('');
      setDescription('');
      setPrice('');
      setShowForm(false);
      setCreating(false);
    } catch {
      setError('Connection error');
      setCreating(false);
    }
  };

  const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingProductId(productId);
    const token = localStorage.getItem('token');

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        await fetch('http://localhost:8000/products/' + productId + '/images', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData,
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    // Refetch all products to sync with backend
    try {
      const res = await fetch('http://localhost:8000/brands/' + brandId + '/products', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setProducts(data);
    } catch {}

    setUploadingProductId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch('http://localhost:8000/products/' + productId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      setProducts(products.filter((p) => p.id !== productId));
    } catch {}
  };

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-[#F5F5F0]" dir="rtl">
      <nav className="border-b border-[rgba(212,165,116,0.12)] px-6 py-4">
        <Link href={'/brands/' + brandId} className="text-[#D4A574] hover:underline text-sm">
          ← العودة إلى البراند
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">منتجاتي</h1>
            <p className="text-[#8B8B8B]">أضف منتجاتك ليستخدمها AI في إنشاء المحتوى.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-[#D4A574] hover:opacity-90 rounded-lg font-semibold transition"
          >
            {showForm ? 'إلغاء' : '+ إضافة منتج'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6 mb-8 space-y-4">
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">اسم المنتج *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white"
                placeholder="مثال: عطر نُوى الفاخر"
              />
            </div>
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">الوصف</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white resize-none"
                placeholder="مثال: عطر شرقي فاخر بمكونات نادرة"
              />
            </div>
            <div>
              <label className="block text-sm text-[#F5F5F0] mb-2">السعر (اختياري)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#1A1A1F] border border-[rgba(212,165,116,0.2)] text-white"
                placeholder="مثال: 850 ريال"
              />
            </div>
            {error && (
              <div className="bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] text-[#E05252] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={creating}
              className="px-8 py-3 bg-[#D4A574] hover:bg-[#E5B98A] disabled:opacity-50 rounded-lg font-semibold transition"
            >
              {creating ? 'جاري الإنشاء...' : 'إنشاء المنتج'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#8B8B8B]">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-[#D4A574]/30 rounded-2xl p-12 text-center">
            <h3 className="text-2xl font-bold mb-3">لا توجد منتجات بعد</h3>
            <p className="text-[#F5F5F0] mb-6">أضف منتجك الأول لتبدأ إنشاء الحملات الإعلانية.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-[#D4A574] hover:bg-[#E5B98A] rounded-lg font-semibold transition"
            >
              + إضافة منتج
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-[#1A1A1F] border border-[rgba(212,165,116,0.12)] rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    {product.price && (
                      <div className="text-sm text-[#D4A574] mt-1">{product.price}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    حذف
                  </button>
                </div>

                {product.description && (
                  <p className="text-sm text-[#8B8B8B] mb-4">{product.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {product.images && product.images.map((img, i) => (
                    <img
                      key={i}
                      src={'http://localhost:8000' + img}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-lg border border-[rgba(212,165,116,0.12)]"
                    />
                  ))}
                  <label
                    htmlFor={'file-input-' + product.id}
                    className="w-full h-24 border-2 border-dashed border-[rgba(212,165,116,0.2)] rounded-lg flex items-center justify-center text-xs text-[#8B8B8B] hover:border-[#D4A574]/50 hover:text-[#D4A574] transition cursor-pointer"
                  >
                    {uploadingProductId === product.id ? '⏳' : '+ صورة'}
                  </label>
                  <input
                    id={'file-input-' + product.id}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(product.id, e)}
                    className="hidden"
                  />
                </div>

                {product.images && product.images.length >= 3 && (
                  <div className="text-xs text-[#6BBF7A] mb-2">✓ جاهز للحملات ({product.images.length} صور)</div>
                )}
                {(!product.images || product.images.length < 3) && (
                  <div className="text-xs text-yellow-400 mb-2">⚠ يحتاج 3 صور على الأقل</div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
