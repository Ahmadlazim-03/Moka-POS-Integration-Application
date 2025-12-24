
"use client";

import useSWR from "swr";
import { CleanProduct } from "@/lib/moka";
import ProductCard from "@/components/ui/ProductCard";
import { useEffect, useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";

interface ProductGridProps {
    initialProducts: CleanProduct[];
    outletId: number;
    outletName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductGrid({
    initialProducts,
    outletId,
    outletName,
}: ProductGridProps) {
    // Use SWR to poll for data
    const { data, error, isLoading } = useSWR<{ products: CleanProduct[] }>(
        `/api/products?outletId=${outletId}`,
        fetcher,
        {
            fallbackData: { products: initialProducts },
            refreshInterval: 5000, // Poll every 5 seconds
            revalidateOnFocus: true,
        }
    );

    const allProducts = data?.products || initialProducts;
    const products = allProducts.filter(p => p.name !== "Custom Amount" && p.name !== "Harga Variabel");

    // Simple state to show a "updating" indicator if needed, 
    // but usually seamless update is better.

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-6 rounded-full mb-6">
                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Menu Belum Tersedia
                </h3>
                <p className="text-gray-500 max-w-sm">
                    Belum ada produk di outlet{" "}
                    <span className="font-semibold">{outletName}</span>. Coba pilih outlet
                    lain.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                    Menampilkan <span className="font-semibold text-foreground">{products.length}</span> menu
                </p>


            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        outletId={outletId}
                        outletName={outletName}
                    />
                ))}
            </div>
        </>
    );
}
