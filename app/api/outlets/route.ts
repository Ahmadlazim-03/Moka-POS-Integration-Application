import { NextResponse } from "next/server";
import { getMokaOutlets } from "@/lib/moka";

export const dynamic = 'force-dynamic'; // Ensure this endpoint is never statically cached

export async function GET() {
    try {
        const outlets = await getMokaOutlets();
        return NextResponse.json({ outlets });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch outlets" },
            { status: 500 }
        );
    }
}
