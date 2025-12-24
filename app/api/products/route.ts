
import { getMokaProducts } from "@/lib/moka";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get("outletId");

    if (!outletId) {
        return NextResponse.json(
            { error: "outletId is required" },
            { status: 400 }
        );
    }

    try {
        const products = await getMokaProducts(parseInt(outletId));
        return NextResponse.json({ products });
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
