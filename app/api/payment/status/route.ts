import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

/**
 * Get order status by order ID
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
        return NextResponse.json(
            { success: false, error: "Order ID is required" },
            { status: 400 }
        );
    }

    const order = getOrder(orderId);

    if (!order) {
        return NextResponse.json(
            { success: false, error: "Order not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        data: {
            id: order.id,
            status: order.status,
            customer_name: order.customer_name,
            outlet_name: order.outlet_name,
            total: order.total,
            payment_type: order.payment_type,
            moka_receipt_no: order.moka_receipt_no,
            items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            created_at: order.created_at,
        },
    });
}
