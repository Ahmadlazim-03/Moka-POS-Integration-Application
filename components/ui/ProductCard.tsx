// components/ui/ProductCard.tsx
"use client";

import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingBag, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Types
interface ProductProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string | null;
    stock: number;
    variant_id: number;
    variant_name: string;
    category_id: number;
  };
  outletId: number;
  outletName: string;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

export default function ProductCard({ product, outletId, outletName }: ProductProps) {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const itemInCart = items.find((item) => item.id === product.id);
  const quantityInCart = itemInCart?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product, outletId, outletName);
    setJustAdded(true);

    toast.success(`${product.name} ditambahkan ke keranjang`, {
      description: `${formatRupiah(product.price)} × 1`,
      duration: 2000,
    });

    setTimeout(() => setJustAdded(false), 1500);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <Card className="group relative border-0 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 bg-white overflow-hidden rounded-2xl flex flex-col h-full hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <div className="p-4 rounded-full bg-gray-100">
              <ShoppingBag className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-white/95 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm border-0 px-3 py-1"
          >
            {product.category}
          </Badge>
        </div>

        {/* Cart Quantity Badge */}
        {quantityInCart > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground shadow-lg px-2.5 py-1 text-xs font-bold">
              {quantityInCart}×
            </Badge>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 flex-grow">
          {product.description || "Menu spesial pilihan kami"}
        </p>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-lg font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
            {product.price > 0 ? formatRupiah(product.price) : "Harga Variabel"}
          </span>
        </div>
      </CardContent>

      {/* Footer / Action Button */}
      <CardFooter className="p-4 pt-0">
        <Button
          className={`w-full font-semibold rounded-xl h-11 transition-all duration-300 ${justAdded
            ? "bg-green-500 hover:bg-green-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            }`}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {justAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Ditambahkan!
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Tambah ke Keranjang
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
