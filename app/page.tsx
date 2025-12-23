import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Coffee,
  Clock,
  CreditCard,
  Smartphone,
  Sparkles,
  ChefHat,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Coffee,
      title: "Menu Lengkap",
      description: "Berbagai pilihan menu makanan dan minuman favorit",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: CreditCard,
      title: "Pembayaran Mudah",
      description: "Bayar langsung di kasir outlet pilihan Anda",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Clock,
      title: "Proses Cepat",
      description: "Pesanan langsung dikirim ke kasir untuk diproses",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Pesan dari mana saja lewat smartphone Anda",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const steps = [
    { num: 1, title: "Pilih Menu", desc: "Telusuri dan pilih menu favorit" },
    { num: 2, title: "Isi Data", desc: "Masukkan nama dan nomor telepon" },
    { num: 3, title: "Konfirmasi", desc: "Pesanan dikirim ke kasir" },
    { num: 4, title: "Bayar & Ambil", desc: "Pembayaran di kasir outlet" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-300/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Moka POS</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
              Pesan Menu
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 to-amber-100 bg-clip-text text-transparent">
                Favorit Anda
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Platform pemesanan online yang terintegrasi langsung dengan sistem kasir.
              Pesan, konfirmasi, dan bayar dengan mudah!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-white text-orange-600 hover:bg-white/90 shadow-xl shadow-black/20 group"
                >
                  Lihat Menu
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">100+</div>
                <div className="text-sm text-white/70">Menu Tersedia</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">5★</div>
                <div className="text-sm text-white/70">Rating Pelanggan</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">24/7</div>
                <div className="text-sm text-white/70">Pemesanan Online</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kenapa Pesan di Sini?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Nikmati kemudahan memesan menu favorit dengan sistem yang terintegrasi langsung ke kasir
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cara Memesan
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Hanya 4 langkah mudah untuk menikmati menu favorit Anda
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 z-0" />
                )}

                <div className="relative z-10 mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-2xl font-bold shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  {step.num}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-8 animate-bounce">
              <ChefHat className="h-10 w-10" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Siap Untuk Memesan?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Jelajahi menu lengkap kami dan pesan sekarang juga!
            </p>

            <Link href="/products">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl shadow-orange-500/30 group"
              >
                Mulai Pesan Sekarang
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MokaShop</span>
            </div>

            <p className="text-sm text-center md:text-right">
              Terintegrasi dengan{" "}
              <span className="text-amber-500 font-semibold">Moka POS</span> •
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
