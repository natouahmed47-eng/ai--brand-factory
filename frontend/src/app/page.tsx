"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { openPaddleCheckout } from "../lib/paddle";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, Check, ChevronDown,
  Layers, DollarSign, Fingerprint,
  Palette, Package, Wand2, Film,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6 },
  }),
};

const GOLD = "#D4A574";
const CARD = "#1A1A1F";
const TEXT = "#F5F5F0";
const MUTED = "#8B8B8B";
const LINE = "rgba(212,165,116,0.12)";

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-md"
      style={{ background: "rgba(11,11,13,0.7)", borderBottom: "1px solid rgba(212,165,116,0.08)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-base font-medium tracking-wide" style={{ color: TEXT }}>
            AI Brand Factory
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: MUTED }}>
          <a href="#problem" className="hover:text-white transition">المشكلة</a>
          <a href="#solution" className="hover:text-white transition">الحل</a>
          <a href="#how" className="hover:text-white transition">كيف يعمل</a>
          <a href="#pricing" className="hover:text-white transition">الأسعار</a>
        </div>

        <Link
          href="/signup"
          className="text-sm font-medium px-5 py-2 rounded-full transition"
          style={{ background: GOLD, color: "#0B0B0D" }}
        >
          ابدأ مجانًا
        </Link>
      </div>
    </motion.nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px]" style={{ background: GOLD }} />

      <div className="relative max-w-[1200px] mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 text-right">
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 text-xs tracking-widest mb-8"
            style={{ color: GOLD }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
            منصة المحتوى الذكي للبراندات العربية
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.15] mb-6"
            style={{ color: TEXT }}
          >
            براندك يستحق
            <br />
            <span style={{ color: GOLD }}>عقلًا حقيقيًا.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg leading-relaxed max-w-lg ml-auto mb-10"
            style={{ color: MUTED }}
          >
            من الفكرة إلى فيديو فاخر — في دقائق، لا أسابيع.
            عقل رقمي واحد يفهم هويتك، يقود إبداعك، وينتج محتواك.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center gap-3 justify-end"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition hover:opacity-90"
              style={{ background: GOLD, color: "#0B0B0D" }}
            >
              ابدأ مجانًا
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            </Link>
            <button
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition hover:bg-white/[0.03]"
              style={{ color: TEXT, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              شاهد العرض
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-16 flex items-center gap-4 justify-end text-xs"
            style={{ color: MUTED }}
          >
            <span>+٢٠٠ براند نشط</span>
            <span className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span>٤.٩ ★</span>
            <span className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span>خليج · سعودية · مصر</span>
          </motion.div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-full opacity-20 blur-[80px]" style={{ background: GOLD }} />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-[280px] h-[580px] rounded-[3rem] p-[10px]"
              style={{
                background: "linear-gradient(180deg, #1F1F24 0%, #131317 100%)",
                border: "1px solid rgba(212,165,116,0.15)",
                boxShadow: "0 30px 80px -20px rgba(212,165,116,0.2)",
              }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full z-20" style={{ background: "#0B0B0D" }} />
              <div
                className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
                style={{ background: "linear-gradient(135deg, #1A1A1F 0%, #0B0B0D 100%)" }}
              >
                <div className="absolute top-16 right-6 left-6">
                  <div className="text-[10px] tracking-widest mb-3" style={{ color: GOLD }}>✦ LUXE</div>
                  <div className="text-3xl font-light leading-tight" style={{ color: TEXT }}>
                    أناقة<br />بلا حدود
                  </div>
                </div>
                <div className="absolute bottom-24 right-6 left-6">
                  <div className="text-xs" style={{ color: MUTED }}>مجموعة ٢٠٢٦ الجديدة</div>
                </div>
                <div className="absolute bottom-10 right-6 left-6 flex items-center justify-between">
                  <div className="text-xs px-4 py-2 rounded-full" style={{ background: GOLD, color: "#0B0B0D" }}>
                    تسوّق
                  </div>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-6 h-px" style={{ background: i === 0 ? GOLD : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const brands = ["LUXE", "NOVA", "AURA", "VELVET", "MAISON"];
  return (
    <section className="py-12" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center text-[10px] tracking-[0.3em] mb-6" style={{ color: MUTED }}>
          موثوق به من براندات رائدة
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-4">
          {brands.map((b) => (
            <span key={b} className="text-base font-light tracking-[0.2em] transition hover:opacity-100" style={{ color: MUTED, opacity: 0.6 }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}


function Problem() {
  const items = [
    { icon: Layers, n: "١", t: "تشتت الأدوات", d: "٦ منصات مختلفة لكل حملة — كل واحدة بتسعيرة وواجهة." },
    { icon: DollarSign, n: "٢", t: "تكلفة مرتفعة", d: "أكثر من ١٠٠٠$ لكل فيديو إعلاني — بلا نهاية." },
    { icon: Fingerprint, n: "٣", t: "فقدان الهوية", d: "كل فيديو يبدو من براند آخر — الرسالة تضعف." },
  ];
  return (
    <section id="problem" className="py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>المشكلة</div>
          <h2 className="text-3xl sm:text-4xl font-light" style={{ color: TEXT }}>
            المشكلة التي تعرفها جيدًا
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="rounded-2xl p-8"
              style={{ background: CARD, border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${LINE}` }}>
                  <it.icon className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <span className="text-xs tracking-widest" style={{ color: MUTED }}>٠{it.n}</span>
              </div>
              <h3 className="text-lg font-normal mb-3" style={{ color: TEXT }}>{it.t}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{it.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const points = ["الهوية", "الشخصية", "الجمهور", "المنتجات", "القواعد"];
  return (
    <section id="solution" className="py-28" style={{ background: "#0A0A0C" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>الحل</div>
          <h2 className="text-3xl sm:text-4xl font-light" style={{ color: TEXT }}>
            عقل واحد — يفهم ويقود
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl p-12 text-center"
            style={{ background: CARD, border: `1px solid ${LINE}` }}
          >
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ border: `1px solid ${GOLD}` }}>
              <span className="text-2xl">🧠</span>
            </div>
            <div className="text-2xl font-light mb-2" style={{ color: TEXT }}>Brand Brain</div>
            <div className="text-sm" style={{ color: GOLD }}>Score 100%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <ul className="space-y-5">
              {points.map((p, i) => (
                <li key={i} className="flex items-center gap-4 text-lg font-light" style={{ color: TEXT }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${GOLD}` }}>
                    <Check className="w-3 h-3" style={{ color: GOLD }} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-relaxed" style={{ color: MUTED }}>
              عقل رقمي واحد يقرأ هويتك، يفهم جمهورك، ويقود كل قرار إبداعي — فتبقى كل حملة متسقة مع براندك.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Palette, t: "رفع الهوية", d: "١ دقيقة" },
    { icon: Package, t: "إضافة المنتجات", d: "٣ دقائق" },
    { icon: Wand2, t: "اختيار الفكرة", d: "٣٠ ثانية" },
    { icon: Film, t: "استلام الفيديو", d: "٥ دقائق" },
  ];
  return (
    <section id="how" className="py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>كيف يعمل</div>
          <h2 className="text-3xl sm:text-4xl font-light" style={{ color: TEXT }}>
            من الفكرة إلى الفيديو — في ٤ خطوات
          </h2>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 right-[10%] left-[10%] h-px" style={{ background: LINE }} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 relative z-10"
                  style={{ background: "#0B0B0D", border: `1px solid ${LINE}` }}>
                  <s.icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div className="text-xs tracking-widest mb-2" style={{ color: GOLD }}>٠{i + 1}</div>
                <div className="text-base font-normal mb-1" style={{ color: TEXT }}>{s.t}</div>
                <div className="text-xs" style={{ color: MUTED }}>{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  const reels = [1, 2, 3, 4];
  return (
    <section className="py-28" style={{ background: "#0A0A0C" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>أعمالنا</div>
          <h2 className="text-3xl sm:text-4xl font-light mb-4" style={{ color: TEXT }}>
            محتوى يتحدث عن نفسه
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>كلها مُنتجة تلقائيًا — بدون مصوّر أو فريق</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reels.map((r, i) => (
            <motion.div
              key={r}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="aspect-[9/16] rounded-2xl relative overflow-hidden group cursor-pointer"
              style={{ background: CARD, border: `1px solid ${LINE}` }}
            >
              <video
                src={"/showcase/reel-" + r + ".mp4"}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 text-[10px] tracking-widest" style={{ color: MUTED }}>
                REEL · 0{r}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const router = useRouter();
  const [subscribing, setSubscribing] = useState<string>("");

  const handleSubscribe = async (plan: "pro" | "business") => {
    setSubscribing(plan);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      await openPaddleCheckout(
        plan,
        () => {
          setSubscribing("");
          router.push("/payment/success");
        },
        () => setSubscribing(""),
      );
    } catch (e: any) {
      setSubscribing("");
      alert(e?.message || "حدث خطأ. حاول مرة أخرى.");
    }
  };

  const plans = [
    { name: "Free", price: "0", period: "للأبد", features: ["٣ حملات شهريًا", "Watermark", "جودة ٧٢٠p", "Brand Brain أساسي"], cta: "ابدأ مجانًا", featured: false },
    { name: "Pro", price: "٢٩", period: "/شهر", features: ["٣٠ حملة شهريًا", "بدون Watermark", "جودة ١٠٨٠p", "Brand Brain كامل", "أولوية توليد"], cta: "ابدأ Pro", featured: true },
    { name: "Business", price: "٩٩", period: "/شهر", features: ["١٠٠ حملة شهريًا", "بدون Watermark", "جودة 4K", "Brand Brain كامل", "دعم مخصص", "API Access"], cta: "ابدأ Business", featured: false },
  ];
  return (
    <section id="pricing" className="py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>الأسعار</div>
          <h2 className="text-3xl sm:text-4xl font-light mb-4" style={{ color: TEXT }}>خطط بسيطة وشفافة</h2>
          <p className="text-sm" style={{ color: MUTED }}>ابدأ مجانًا. ارقِ عندما تنمو.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="relative rounded-3xl p-8"
              style={{
                background: CARD,
                border: p.featured ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {p.featured && (
                <div className="absolute -top-3 right-6 text-[10px] tracking-widest px-3 py-1 rounded-full"
                  style={{ background: GOLD, color: "#0B0B0D" }}>
                  الأكثر شعبية
                </div>
              )}
              <div className="text-xs tracking-widest mb-2" style={{ color: MUTED }}>{p.name}</div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-light" style={{ color: TEXT }}>${p.price}</span>
                <span className="text-xs" style={{ color: MUTED }}>{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm" style={{ color: TEXT }}>
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />
                    {f}
                  </li>
                ))}
              </ul>
              {p.name === "Free" ? (
                <Link
                  href="/signup"
                  className="block text-center text-sm font-medium py-3 rounded-full transition"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: TEXT }}
                >
                  {p.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleSubscribe(p.name.toLowerCase() as "pro" | "business")}
                  disabled={subscribing === p.name.toLowerCase()}
                  className="block w-full text-center text-sm font-medium py-3 rounded-full transition disabled:opacity-50"
                  style={p.featured
                    ? { background: GOLD, color: "#0B0B0D" }
                    : { border: "1px solid rgba(255,255,255,0.1)", color: TEXT }}
                >
                  {subscribing === p.name.toLowerCase() ? "جارٍ الفتح..." : p.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const qs = [
    { q: "هل أحتاج خبرة تقنية؟", a: "لا. المنصة مبنية لتكون بسيطة — أنشئ براندك، ارفع صور منتجاتك، واختر فكرة." },
    { q: "كم يستغرق إنتاج حملة كاملة؟", a: "حملة من ٦ مشاهد تستغرق عادةً ١٠-١٥ دقيقة — من الفكرة إلى الفيديو النهائي." },
    { q: "هل الفيديوهات بالعربية؟", a: "نعم — الفصحى والعامية الخليجية متاحتان. كل شيء بالعربية بشكل كامل." },
    { q: "هل يمكنني تعديل النتيجة؟", a: "بالتأكيد. يمكنك إعادة توليد أي مشهد، تغيير الصوت، أو إضافة موسيقى." },
    { q: "هل هناك نسخة مجانية؟", a: "نعم — ٣ حملات شهريًا مع Watermark. كافية للتجربة الكاملة." },
  ];
  return (
    <section className="py-28" style={{ background: "#0A0A0C" }}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="text-[10px] tracking-[0.3em] mb-4" style={{ color: GOLD }}>الأسئلة</div>
          <h2 className="text-3xl sm:text-4xl font-light" style={{ color: TEXT }}>أسئلة شائعة</h2>
        </motion.div>

        <div className="space-y-3">
          {qs.map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
              style={{ background: CARD, border: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-right transition hover:bg-white/[0.02]"
              >
                <span className="text-base font-normal" style={{ color: TEXT }}>{item.q}</span>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ color: GOLD, transform: open === i ? "rotate(180deg)" : "rotate(0)" }}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px]" style={{ background: GOLD }} />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl font-light mb-6" style={{ color: TEXT }}>
            جاهز تبني <span style={{ color: GOLD }}>عقل براندك</span>؟
          </h2>
          <p className="text-base mb-10" style={{ color: MUTED }}>
            انضم إلى +٢٠٠ براند يستخدمون AI Brand Factory
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition hover:opacity-90"
            style={{ background: GOLD, color: "#0B0B0D" }}
          >
            ابدأ مجانًا الآن
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12" style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2" style={{ color: MUTED }}>
          <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          <span>AI Brand Factory © 2026</span>
        </div>
        <div className="flex items-center gap-6" style={{ color: MUTED }}>
          <a href="#" className="hover:text-white transition">الخصوصية</a>
          <a href="#" className="hover:text-white transition">الشروط</a>
          <a href="#" className="hover:text-white transition">تواصل</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ background: "#0B0B0D" }}>
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />
      <Solution />
      <HowItWorks />
      <Showcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
