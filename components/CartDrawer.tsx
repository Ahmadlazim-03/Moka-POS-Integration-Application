"use client";

import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);

export default function CartDrawer() {
    const {
        items,
        outletName,
        isOpen,
        setIsOpen,
        updateQuantity,
        removeFromCart,
        totalItems,
        totalPrice,
        clearCart,
    } = useCart();

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent className="flex flex-col w-full sm:max-w-lg">
                <SheetHeader className="space-y-1 relative pr-8">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <ShoppingCart className="h-5 w-5" />
                        Keranjang Belanja
                    </SheetTitle>
                    {outletName && (
                        <SheetDescription className="text-sm">
                            Outlet: <span className="font-medium text-foreground">{outletName}</span>
                        </SheetDescription>
                    )}

                    {items.length > 0 && (
                        <div className="absolute right-0 top-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                onClick={clearCart}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Kosongkan
                            </Button>
                        </div>
                    )}
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="bg-muted/50 rounded-full p-6 mb-4">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Keranjang Kosong</h3>
                        <p className="text-muted-foreground text-sm max-w-[200px]">
                            Mulai belanja dan tambahkan produk ke keranjang Anda
                        </p>
                        <Button
                            variant="default"
                            className="mt-6"
                            onClick={() => setIsOpen(false)}
                        >
                            Mulai Belanja
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full max-h-[calc(100vh-320px)] -mx-6 px-6">
                                <div className="space-y-4 py-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 p-3 bg-muted/30 rounded-xl border border-border/50"
                                        >
                                            {/* Product Image */}
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {item.imageUrl ? (
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="80px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm leading-tight truncate">
                                                    {item.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {item.category}
                                                </p>
                                                <p className="text-sm font-bold text-primary mt-1">
                                                    {formatRupiah(item.price)}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-sm font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="space-y-4 pt-4 border-t bg-white">
                            {/* Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Jumlah Item</span>
                                    <span className="font-medium">{totalItems} item</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-primary text-xl">
                                        {formatRupiah(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2">
                                <Link
                                    href="/checkout"
                                    className="block w-full"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Button
                                        className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                                        size="lg"
                                    >
                                        Checkout
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
