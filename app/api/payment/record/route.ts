import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/orders";
import { createAdvancedOrder } from "@/lib/moka";

/**
 * API to record a completed online payment to Moka
 * Called from frontend after Midtrans payment success
 * 
 * Uses Advanced Orderings API (since Checkout API requires special configuration)
 * Order is sent to Moka app with "SUDAH DIBAYAR ONLINE" note
 * Cashier just needs to complete the order
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_id, payment_type } = body;

        if (!order_id) {
            return NextResponse.json(
                { success: false, error: "Order ID is required" },
                { status: 400 }
            );
        }

        console.log(`[Record Payment] Processing order: ${order_id}`);

        const order = getOrder(order_id);

        if (!order) {
            console.error(`[Record Payment] Order not found: ${order_id}`);
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        // Check if already recorded
        if (order.status === "paid" && order.moka_receipt_no) {
            console.log(`[Record Payment] Already recorded: ${order.moka_receipt_no}`);
            return NextResponse.json({
                success: true,
                data: {
                    message: "Already recorded",
                    moka_receipt_no: order.moka_receipt_no,
                },
            });
        }

        // Update order status
        updateOrderStatus(order_id, "paid", {
            payment_type: payment_type || "online",
        });

        // Prepare items for Advanced Orderings
        const items = order.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variant_id: item.variant_id,
            category_id: item.category_id,
            category: item.category_name,
        }));

        // Create note with payment info
        const paymentNote = [
            `✅ SUDAH DIBAYAR ONLINE (${payment_type || 'Midtrans'})`,
            order.note ? order.note : null,
        ].filter(Boolean).join(" - ");

        console.log("[Record Payment] Sending to Moka Advanced Orderings...");
        console.log("[Record Payment] Outlet ID:", order.outlet_id);
        console.log("[Record Payment] Items:", items.length);
        console.log("[Record Payment] Total:", order.total);

        try {
            // Use Advanced Orderings API (which works)
            const mokaResponse = await createAdvancedOrder(
                order.outlet_id,
                order.customer_name,
                order.customer_phone,
                paymentNote,
                items
            );

            // Update order with Moka order ID
            updateOrderStatus(order_id, "paid", {
                moka_receipt_no: mokaResponse.orderId,
            });

            console.log("[Record Payment] ✅ Success! Order sent to Moka:", mokaResponse.orderId);

            return NextResponse.json({
                success: true,
                data: {
                    message: "Order sent to Moka cashier app. Payment already done online.",
                    moka_order_id: mokaResponse.orderId,
                    status: mokaResponse.data?.status,
                },
            });
        } catch (mokaError) {
            console.error("[Record Payment] ❌ Moka API Error:", mokaError);

            const errorMessage = mokaError instanceof Error ? mokaError.message : "Failed to send to Moka";

            return NextResponse.json({
                success: false,
                error: errorMessage,
                details: "Payment was received via Midtrans but failed to send to Moka. Please contact support.",
            }, { status: 500 });
        }
    } catch (error) {
        console.error("[Record Payment] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
