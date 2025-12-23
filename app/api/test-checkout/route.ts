import { NextResponse } from "next/server";
import { createCheckoutTransaction, CheckoutItem, getMokaProducts, getMokaOutlets } from "@/lib/moka";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let outletId = searchParams.get("outletId");

        if (!outletId) {
            const outlets = await getMokaOutlets();
            if (outlets.length > 0) {
                outletId = outlets[0].id.toString();
                console.log("Auto-selected outlet:", outletId);
            } else {
                return NextResponse.json({ error: "No outlets found" }, { status: 404 });
            }
        }

        const numericOutletId = parseInt(outletId);

        // 1. Fetch real products to get valid IDs
        const products = await getMokaProducts(numericOutletId);
        if (products.length === 0) {
            return NextResponse.json({ error: "No products found for this outlet" }, { status: 404 });
        }

        const product = products[0];
        console.log("Using product for test:", product);

        // 2. Construct Payload
        const item: CheckoutItem = {
            item_id: product.id,
            quantity: 1,
            item_name: product.name,
            item_variant_id: product.variant_id,
            item_variant_name: product.variant_name,
            category_id: product.category_id,
            category_name: product.category,
            client_price: product.price,
            gross_sales: product.price * 1,
            net_sales: product.price * 1, // Assuming no discount/tax for simplicity
        };

        const note = "TEST CHECKOUT API - PLEASE IGNORE";
        const total = product.price;

        // 3. Call API
        const response = await createCheckoutTransaction(
            numericOutletId,
            [item],
            note,
            total
        );

        return NextResponse.json({
            success: true,
            data: response
        });

    } catch (error: any) {
        console.error("Test Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
