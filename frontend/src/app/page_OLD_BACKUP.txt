import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <nav className="flex justify-between items-center mb-20">
          <h1 className="text-2xl font-bold">AI Brand Factory</h1>
          <div className="space-x-4 space-x-reverse">
            <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">
              تسجيل الدخول
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition">
              ابدأ الآن
            </Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            مصنع محتوى ذكي
            <br />
            <span className="text-blue-400">لكل براند</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            One Brand. One Brain. Unlimited Content.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-blue-500 text-lg rounded-xl hover:bg-blue-600 transition font-semibold"
          >
            ابدأ الآن مجانًا
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            لا حاجة لبطاقة ائتمانية
          </p>
        </div>
      </div>
    </main>
  );
}