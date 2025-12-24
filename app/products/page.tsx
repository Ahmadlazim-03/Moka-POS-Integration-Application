// app/products/page.tsx
import { getMokaOutlets, getMokaProducts } from "@/lib/moka";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Store, ShoppingBag, Sparkles } from "lucide-react";
import ProductGrid from "@/components/products/ProductGrid";
import OutletTabs from "@/components/products/OutletTabs";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ outletId?: string }>;
}) {
  const outlets = await getMokaOutlets();

  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-8 rounded-full mb-6">
          <Store className="h-16 w-16 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tidak Ada Outlet</h2>
        <p className="text-gray-500 max-w-md">
          Belum ada outlet yang tersedia. Silakan hubungi administrator.
        </p>
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const activeOutletId = resolvedSearchParams.outletId
    ? parseInt(resolvedSearchParams.outletId)
    : outlets[0].id;

  const activeOutletName =
    outlets.find((o) => o.id === activeOutletId)?.name || "Outlet";

  const allProducts = await getMokaProducts(activeOutletId);
  const products = allProducts.filter(
    (p) => p.name !== "Custom Amount" && p.name !== "Harga Variabel"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 text-amber-100 text-sm mb-3">
            <Sparkles className="h-4 w-4" />
            <span>Pesan Online • Bayar di Kasir</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            Menu Kami
          </h1>
          <div className="flex items-center text-white/90">
            <MapPin className="w-5 h-5 mr-2" />
            <span className="font-medium">{activeOutletName}</span>
          </div>
        </div>
      </div>

      {/* Outlet Tabs */}
      <OutletTabs initialOutlets={outlets} activeOutletId={activeOutletId} />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <ProductGrid
          initialProducts={products}
          outletId={activeOutletId}
          outletName={activeOutletName}
        />
      </div>
    </div>
  );
}
