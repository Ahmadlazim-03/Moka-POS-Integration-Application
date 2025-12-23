import { NextRequest, NextResponse } from "next/server";
import {
    MidtransNotification,
    verifySignature,
    isTransactionSuccess,
    isTransactionPending,
    isTransactionFailed,
} from "@/lib/midtrans";
import { getOrder, updateOrderStatus } from "@/lib/orders";
import { createCheckoutTransaction, CheckoutItem } from "@/lib/moka";

/**
 * Midtrans Webhook Handler
 * This endpoint receives payment notifications from Midtrans
 */
export async function POST(request: NextRequest) {
    try {
        const notification: MidtransNotification = await request.json();

        console.log("[Webhook] Received Midtrans notification:", {
            order_id: notification.order_id,
            transaction_status: notification.transaction_status,
            payment_type: notification.payment_type,
        });

        // Verify signature
        if (!verifySignature(notification)) {
            console.error("[Webhook] Invalid signature!");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        const orderId = notification.order_id;
        const order = getOrder(orderId);

        if (!order) {
            console.error(`[Webhook] Order not found: ${orderId}`);
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Handle different transaction statuses
        if (isTransactionSuccess(notification)) {
            console.log(`[Webhook] Payment SUCCESS for order: ${orderId}`);

            // Update order status
            updateOrderStatus(orderId, "paid", {
                payment_type: notification.payment_type,
                midtrans_transaction_id: notification.transaction_id,
            });

            // Record transaction to Moka via Checkout API
            try {
                const mokaItems: CheckoutItem[] = order.items.map((item) => ({
                    quantity: item.quantity,
                    item_id: item.id,
                    item_name: item.name,
                    item_variant_id: item.variant_id,
                    item_variant_name: item.variant_name,
                    category_id: item.category_id,
                    category_name: item.category_name,
                    client_price: item.price,
                    gross_sales: item.price * item.quantity,
                    net_sales: item.price * item.quantity,
                }));

                const paymentNote = `Online Payment - ${notification.payment_type.toUpperCase()} | Order: ${orderId} | Customer: ${order.customer_name} | Phone: ${order.customer_phone}${order.note ? ` | Note: ${order.note}` : ""}`;

                const mokaResponse = await createCheckoutTransaction(
                    order.outlet_id,
                    mokaItems,
                    paymentNote,
                    order.total
                );

                // Store Moka receipt number
                updateOrderStatus(orderId, "paid", {
                    moka_receipt_no: mokaResponse.data?.receipt_no,
                });

                console.log(`[Webhook] Recorded to Moka:`, {
                    orderId,
                    receipt_no: mokaResponse.data?.receipt_no,
                });
            } catch (mokaError) {
                console.error(`[Webhook] Failed to record to Moka:`, mokaError);
                // Don't fail the webhook, payment was still successful
                // We can add retry logic or manual reconciliation later
            }
        } else if (isTransactionPending(notification)) {
            console.log(`[Webhook] Payment PENDING for order: ${orderId}`);
            updateOrderStatus(orderId, "pending", {
                payment_type: notification.payment_type,
            });
        } else if (isTransactionFailed(notification)) {
            console.log(`[Webhook] Payment FAILED for order: ${orderId}`);
            updateOrderStatus(orderId, "failed", {
                payment_type: notification.payment_type,
            });
        }

        return NextResponse.json({ status: "OK" });
    } catch (error) {
        console.error("[Webhook] Error processing notification:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Also handle GET for webhook verification (Midtrans might ping this)
export async function GET() {
    return NextResponse.json({ status: "Webhook endpoint is active" });
}
