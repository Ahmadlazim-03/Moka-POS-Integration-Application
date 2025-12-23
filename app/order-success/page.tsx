"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle2,
    Clock,
    Smartphone,
    CreditCard,
    Home,
    ShoppingBag,
    Wallet,
    Receipt,
    PartyPopper,
    Hourglass,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";

interface OrderDetails {
    id: string;
    status: string;
    customer_name: string;
    outlet_name: string;
    total: number;
    payment_type?: string;
    moka_receipt_no?: string;
}

const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id") || searchParams.get("orderId") || "MOKA-ORDER";
    const paymentType = searchParams.get("payment") || "kasir";

    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(paymentType === "success" || paymentType === "pending");

    // Poll for order status if online payment
    useEffect(() => {
        if (paymentType === "success" || paymentType === "pending") {
            const fetchOrderStatus = async () => {
                try {
                    const res = await fetch(`/api/payment/status?order_id=${orderId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            setOrderDetails(data.data);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch order status:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchOrderStatus();

            // Poll every 3 seconds for pending payments
            if (paymentType === "pending") {
                const interval = setInterval(fetchOrderStatus, 3000);
                return () => clearInterval(interval);
            }
        }
    }, [orderId, paymentType]);

    // Different content based on payment type
    const isOnlinePayment = paymentType === "success" || paymentType === "pending";
    const isPending = paymentType === "pending";

    const kasirSteps = [
        {
            icon: CheckCircle2,
            title: "Pesanan Terkirim",
            description: "Pesanan Anda telah dikirim ke sistem kasir",
            active: true,
        },
        {
            icon: Smartphone,
            title: "Menunggu Konfirmasi",
            description: "Kasir akan menerima dan memproses pesanan Anda",
            active: false,
        },
        {
            icon: CreditCard,
            title: "Pembayaran di Kasir",
            description: "Lakukan pembayaran langsung di kasir outlet",
            active: false,
        },
    ];

    const onlineSuccessSteps = [
        {
            icon: CheckCircle2,
            title: "Pembayaran Berhasil",
            description: "Pembayaran Anda telah diterima via Midtrans",
            active: true,
        },
        {
            icon: Smartphone,
            title: "Pesanan Terkirim ke Kasir",
            description: "Pesanan dikirim ke aplikasi kasir dengan status 'SUDAH DIBAYAR'",
            active: true,
        },
        {
            icon: PartyPopper,
            title: "Siap Diambil!",
            description: "Datang ke outlet untuk mengambil pesanan Anda",
            active: true,
        },
    ];

    const onlinePendingSteps = [
        {
            icon: Hourglass,
            title: "Menunggu Pembayaran",
            description: "Silakan selesaikan pembayaran Anda",
            active: true,
        },
        {
            icon: Receipt,
            title: "Verifikasi Pembayaran",
            description: "Sistem akan memverifikasi pembayaran Anda",
            active: false,
        },
        {
            icon: CheckCircle2,
            title: "Selesai",
            description: "Transaksi akan tercatat setelah pembayaran dikonfirmasi",
            active: false,
        },
    ];

    const steps = isPending ? onlinePendingSteps : (isOnlinePayment ? onlineSuccessSteps : kasirSteps);

    const headerConfig = {
        success: {
            gradient: "from-green-500 to-emerald-600",
            bgColor: "from-green-50",
            icon: CheckCircle2,
            title: "Pembayaran Berhasil!",
            subtitle: "Terima kasih! Pembayaran Anda telah diterima dan dicatat.",
        },
        pending: {
            gradient: "from-amber-500 to-orange-500",
            bgColor: "from-amber-50",
            icon: Hourglass,
            title: "Menunggu Pembayaran",
            subtitle: "Silakan selesaikan pembayaran Anda sesuai instruksi.",
        },
        kasir: {
            gradient: "from-green-500 to-emerald-600",
            bgColor: "from-green-50",
            icon: CheckCircle2,
            title: "Pesanan Berhasil Dikirim!",
            subtitle: "Terima kasih telah memesan. Pesanan Anda sedang diproses oleh kasir.",
        },
    };

    const config = headerConfig[paymentType as keyof typeof headerConfig] || headerConfig.kasir;
    const HeaderIcon = config.icon;

    return (
        <div className={`min-h-screen bg-gradient-to-b ${config.bgColor} via-white to-white`}>
            {/* Success Header */}
            <div className={`bg-gradient-to-br ${config.gradient} text-white`}>
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 ${isPending ? 'animate-pulse' : 'animate-bounce'}`}>
                        <HeaderIcon className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        {config.title}
                    </h1>
                    <p className="text-white/80 max-w-md mx-auto">
                        {config.subtitle}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 -mt-8">
                {/* Order ID Card */}
                <Card className={`max-w-md mx-auto mb-8 border-2 shadow-lg ${isPending ? 'border-amber-200' : 'border-green-200'}`}>
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">ID Pesanan</p>
                        <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                            {orderId}
                        </p>

                        {/* Show order details if available */}
                        {orderDetails && (
                            <div className="mt-4 pt-4 border-t space-y-2">
                                {orderDetails.outlet_name && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Outlet:</span>{" "}
                                        <span className="font-medium">{orderDetails.outlet_name}</span>
                                    </p>
                                )}
                                {orderDetails.total && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Total:</span>{" "}
                                        <span className="font-bold text-primary">{formatRupiah(orderDetails.total)}</span>
                                    </p>
                                )}
                                {orderDetails.payment_type && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Metode:</span>{" "}
                                        <span className="font-medium uppercase">{orderDetails.payment_type}</span>
                                    </p>
                                )}
                                {orderDetails.moka_receipt_no && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Receipt:</span>{" "}
                                        <span className="font-mono font-bold">{orderDetails.moka_receipt_no}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Simpan ID ini untuk referensi
                        </p>
                    </CardContent>
                </Card>

                {/* Steps */}
                <Card className="max-w-lg mx-auto mb-8">
                    <CardContent className="p-6">
                        <h2 className="font-bold text-lg mb-6 text-center">
                            {isPending ? "Status Pembayaran" : "Status Pesanan"}
                        </h2>
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.active
                                            ? isPending
                                                ? "bg-amber-500 text-white"
                                                : "bg-green-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3
                                            className={`font-semibold ${step.active
                                                ? isPending
                                                    ? "text-amber-600"
                                                    : "text-green-600"
                                                : "text-foreground"
                                                }`}
                                        >
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions - Different for each payment type */}
                {paymentType === "kasir" && (
                    <div className="max-w-lg mx-auto mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Informasi Penting
                        </h3>
                        <ul className="space-y-2 text-sm text-amber-700">
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Datang ke outlet untuk konfirmasi pesanan
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Sebutkan ID pesanan atau nama Anda kepada kasir
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Pembayaran dilakukan langsung di kasir
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Pesanan akan diproses setelah pembayaran
                            </li>
                        </ul>
                    </div>
                )}

                {paymentType === "success" && (
                    <div className="max-w-lg mx-auto mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Transaksi Tercatat
                        </h3>
                        <ul className="space-y-2 text-sm text-green-700">
                            <li className="flex items-start gap-2">
                                <span className="font-bold">✓</span>
                                Pembayaran Anda telah berhasil diproses
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">✓</span>
                                Transaksi otomatis tercatat di sistem Moka POS
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">✓</span>
                                Anda dapat melihat di menu Transactions di dashboard
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">✓</span>
                                Simpan ID pesanan sebagai bukti transaksi
                            </li>
                        </ul>
                    </div>
                )}

                {paymentType === "pending" && (
                    <div className="max-w-lg mx-auto mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                            <Hourglass className="h-5 w-5" />
                            Menunggu Pembayaran
                        </h3>
                        <ul className="space-y-2 text-sm text-amber-700">
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Selesaikan pembayaran sesuai instruksi yang diberikan
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Halaman ini akan update otomatis setelah pembayaran
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Jika menggunakan Virtual Account, transfer sebelum expired
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold">•</span>
                                Simpan ID pesanan untuk pengecekan status
                            </li>
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
                    <Link href="/products" className="flex-1">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-12"
                        >
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Pesan Lagi
                        </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <Button
                            size="lg"
                            className={`w-full h-12 ${isPending
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                }`}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Kembali ke Beranda
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Memuat...</div>
                </div>
            }
        >
            <OrderSuccessContent />
        </Suspense>
    );
}
