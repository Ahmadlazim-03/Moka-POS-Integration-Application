"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MokaOutlet } from "@/lib/moka";

interface OutletTabsProps {
    initialOutlets: MokaOutlet[];
    activeOutletId: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OutletTabs({ initialOutlets, activeOutletId }: OutletTabsProps) {
    // Poll API every 5 seconds for updates
    const { data } = useSWR<{ outlets: MokaOutlet[] }>("/api/outlets", fetcher, {
        refreshInterval: 5000,
        fallbackData: { outlets: initialOutlets },
    });

    const outlets = data?.outlets || initialOutlets;

    return (
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-lg border-b shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
                    {outlets.map((outlet) => {
                        const isActive = outlet.id === activeOutletId;
                        return (
                            <Link
                                key={outlet.id}
                                href={`/products?outletId=${outlet.id}`}
                                scroll={false}
                            >
                                <Button
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-full whitespace-nowrap transition-all ${isActive
                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg shadow-amber-500/25 scale-105"
                                            : "hover:bg-amber-50 hover:border-amber-200"
                                        }`}
                                >
                                    {outlet.name}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
