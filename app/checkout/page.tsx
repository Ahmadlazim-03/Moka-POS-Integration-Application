"use client";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ShoppingBag,
    ArrowLeft,
    Loader2,
    User,
    Phone,
    FileText,
    Store,
    CreditCard,
    Minus,
    Plus,
    Trash2,
    Wallet,
    Building2,
    QrCode,
} from "lucide-react";
import { toast } from "sonner";

// Extend window type for Midtrans Snap
declare global {
    interface Window {
        snap: {
            pay: (
                token: string,
                options: {
                    onSuccess?: (result: any) => void;
                    onPending?: (result: any) => void;
                    onError?: (result: any) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}

const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);

type PaymentMethod = "kasir" | "online";

export default function CheckoutPage() {
    const router = useRouter();
    const {
        items,
        outletId,
        outletName,
        totalItems,
        totalPrice,
        clearCart,
        updateQuantity,
        removeFromCart,
    } = useCart();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        note: "",
    });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
    const [loading, setLoading] = useState(false);
    const [snapLoaded, setSnapLoaded] = useState(false);

    // Get Midtrans client key from env
    const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    // Handle payment via Midtrans
    const handleOnlinePayment = async () => {
        if (!snapLoaded) {
            toast.error("Sistem pembayaran sedang dimuat, coba lagi");
            return;
        }

        setLoading(true);

        try {
            // Create transaction via our API
            const res = await fetch("/api/payment/create-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outlet_id: outletId,
                    outlet_name: outletName,
                    customer_name: formData.name,
                    customer_phone: formData.phone || "08000000000",
                    note: formData.note,
                    items: items.map((item) => ({
                        id: item.id,
                        variant_id: item.variant_id,
                        name: item.name,
                        variant_name: "Standard",
                        price: item.price,
                        quantity: item.quantity,
                        category_id: item.category_id,
                        category_name: item.category,
                    })),
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Gagal membuat transaksi");
            }

            // Open Midtrans Snap popup
            window.snap.pay(result.data.token, {
                onSuccess: async (snapResult: any) => {
                    console.log("Payment success:", snapResult);

                    // Record payment to Moka (since webhook won't work in localhost)
                    try {
                        const recordRes = await fetch("/api/payment/record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                order_id: result.data.order_id,
                                payment_type: snapResult.payment_type || "online",
                            }),
                        });
                        const recordResult = await recordRes.json();
                        console.log("Record to Moka:", recordResult);
                    } catch (recordError) {
                        console.error("Failed to record to Moka:", recordError);
                        // Continue anyway - payment was successful
                    }

                    clearCart();
                    router.push(
                        `/order-success?order_id=${result.data.order_id}&payment=success`
                    );
                },
                onPending: (snapResult: any) => {
                    console.log("Payment pending:", snapResult);
                    clearCart();
                    router.push(
                        `/order-success?order_id=${result.data.order_id}&payment=pending`
                    );
                },
                onError: (snapResult: any) => {
                    console.error("Payment error:", snapResult);
                    toast.error("Pembayaran gagal, silakan coba lagi");
                },
                onClose: () => {
                    console.log("Payment popup closed");
                    toast.info("Pembayaran dibatalkan");
                },
            });
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(
                error instanceof Error ? error.message : "Terjadi kesalahan"
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle order via kasir (existing flow)
    const handleKasirOrder = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    customer_note: formData.note,
                    outlet_id: outletId,
                    items: items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variant_id: item.variant_id,
                        category_id: item.category_id,
                        category: item.category,
                    })),
                }),
            });

            const result = await res.json();

            if (res.ok) {
                clearCart();
                router.push(
                    `/order-success?order_id=${result.data?.order_id || "success"}&payment=kasir`
                );
            } else {
                toast.error(result.error || "Gagal membuat pesanan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Nama wajib diisi");
            return;
        }

        if (items.length === 0) {
            toast.error("Keranjang kosong");
            return;
        }

        if (paymentMethod === "online") {
            if (!formData.phone || formData.phone.length < 10) {
                toast.error("Nomor telepon wajib diisi untuk pembayaran online");
                return;
            }
            await handleOnlinePayment();
        } else {
            await handleKasirOrder();
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white">
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="bg-muted/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Keranjang Kosong</h1>
                    <p className="text-muted-foreground mb-8">
                        Belum ada produk di keranjang Anda
                    </p>
                    <Link href="/products">
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-500">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Menu
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Load Midtrans Snap.js */}
            <Script
                src={snapUrl}
                data-client-key={midtransClientKey}
                onLoad={() => setSnapLoaded(true)}
                strategy="afterInteractive"
            />

            <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white pb-24">
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
                    <div className="container mx-auto px-4 py-8">
                        <Link
                            href="/products"
                            className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Menu
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
                        <p className="text-white/80 mt-1 flex items-center">
                            <Store className="h-4 w-4 mr-2" />
                            {outletName}
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left Column - Form */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Customer Info */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <User className="h-5 w-5 text-primary" />
                                        Data Pemesan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                Nama Lengkap <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Masukkan nama Anda"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                required
                                                className="h-12"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                Nomor Telepon{" "}
                                                {paymentMethod === "online" && (
                                                    <span className="text-destructive">*</span>
                                                )}
                                            </Label>
                                            <Input
                                                id="phone"
                                                placeholder="08xxxxxxxxxx"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phone: e.target.value })
                                                }
                                                required={paymentMethod === "online"}
                                                className="h-12"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="note" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                Catatan (opsional)
                                            </Label>
                                            <Textarea
                                                id="note"
                                                placeholder="Catatan khusus untuk pesanan Anda..."
                                                value={formData.note}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, note: e.target.value })
                                                }
                                                className="min-h-[100px] resize-none"
                                            />
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Wallet className="h-5 w-5 text-primary" />
                                        Metode Pembayaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                                        className="space-y-3"
                                    >
                                        {/* Online Payment */}
                                        <div
                                            className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "online"
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-primary/50"
                                                }`}
                                            onClick={() => setPaymentMethod("online")}
                                        >
                                            <RadioGroupItem value="online" id="online" className="mt-1" />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor="online"
                                                    className="text-base font-semibold cursor-pointer"
                                                >
                                                    Bayar Online
                                                </Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    QRIS, Gopay, OVO, ShopeePay, Transfer Bank, Kartu Kredit
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full">
                                                        <QrCode className="h-3 w-3" /> QRIS
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full">
                                                        Gopay
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full">
                                                        OVO
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full">
                                                        ShopeePay
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pay at Cashier */}
                                        <div
                                            className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "kasir"
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-primary/50"
                                                }`}
                                            onClick={() => setPaymentMethod("kasir")}
                                        >
                                            <RadioGroupItem value="kasir" id="kasir" className="mt-1" />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor="kasir"
                                                    className="text-base font-semibold cursor-pointer"
                                                >
                                                    Bayar di Kasir
                                                </Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Pesanan dikirim ke kasir, bayar saat mengambil
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                        <Building2 className="h-3 w-3" /> Bayar di Outlet
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Order Items - Mobile */}
                            <Card className="lg:hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                        Pesanan ({totalItems} item)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {item.imageUrl ? (
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                                <p className="text-sm text-primary font-semibold">
                                                    {formatRupiah(item.price)} × {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-20">
                                <Card className="border-2">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <ShoppingBag className="h-5 w-5 text-primary" />
                                            Ringkasan Pesanan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Items List - Desktop */}
                                        <div className="hidden lg:block space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                                                >
                                                    <div className="relative w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                        {item.imageUrl ? (
                                                            <Image
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="56px"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate mb-1">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-sm text-primary font-bold">
                                                            {formatRupiah(item.price)}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-6 w-6 rounded-full"
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity - 1)
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="w-6 text-center text-sm font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-6 w-6 rounded-full"
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity + 1)
                                                                }
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-destructive hover:text-destructive ml-auto"
                                                                onClick={() => removeFromCart(item.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator />

                                        {/* Summary */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>{formatRupiah(totalPrice)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Jumlah Item
                                                </span>
                                                <span>{totalItems} item</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between text-lg pt-2">
                                                <span className="font-bold">Total</span>
                                                <span className="font-bold text-primary">
                                                    {formatRupiah(totalPrice)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment Info */}
                                        <div
                                            className={`rounded-lg p-3 ${paymentMethod === "online"
                                                ? "bg-blue-50 border border-blue-200"
                                                : "bg-amber-50 border border-amber-200"
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {paymentMethod === "online" ? (
                                                    <>
                                                        <Wallet className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-blue-700">
                                                            Anda akan dialihkan ke halaman pembayaran Midtrans
                                                            untuk menyelesaikan transaksi.
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-amber-700">
                                                            Pembayaran dilakukan langsung di kasir setelah
                                                            pesanan dikonfirmasi.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading || !formData.name.trim()}
                                            className={`w-full h-12 text-base font-semibold shadow-lg ${paymentMethod === "online"
                                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25"
                                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25"
                                                }`}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {paymentMethod === "online"
                                                        ? "Membuka Pembayaran..."
                                                        : "Memproses Pesanan..."}
                                                </>
                                            ) : paymentMethod === "online" ? (
                                                <>
                                                    <Wallet className="mr-2 h-5 w-5" />
                                                    Bayar Sekarang
                                                </>
                                            ) : (
                                                "Kirim Pesanan"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
