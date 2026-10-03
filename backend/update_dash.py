from pathlib import Path

file = Path("src/app/dashboard/page.tsx")
content = file.read_text(encoding="utf-8")

# استبدال بطاقة البراند بـ Link
old = """            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center text-2xl font-bold">
                  {brand.name.charAt(0)}
                </div>
                <h4 className="text-xl font-bold mb-2">{brand.name}</h4>
                <p className="text-sm text-gray-400">
                  أُنشئ في {new Date(brand.created_at).toLocaleDateString('ar')}
                </p>
              </div>
            ))}"""

new = """            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/50 transition cursor-pointer block"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {brand.logo_url ? (
                    <img
                      src={`http://localhost:8000${brand.logo_url}`}
                      alt={brand.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{brand.name.charAt(0)}</span>
                  )}
                </div>
                <h4 className="text-xl font-bold mb-2">{brand.name}</h4>
                <p className="text-sm text-gray-400">
                  أُنشئ في {new Date(brand.created_at).toLocaleDateString('ar')}
                </p>
              </Link>
            ))}"""

if old in content:
    content = content.replace(old, new)
    file.write_text(content, encoding="utf-8")
    print("OK - Dashboard updated with brand links!")
else:
    print("ERROR - Old block not found")
