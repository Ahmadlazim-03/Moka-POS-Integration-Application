import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    createSnapTransaction,
    generateOrderId,
    MidtransItemDetail,
} from "@/lib/midtrans";
import { createOrder } from "@/lib/orders";

// Request validation schema
const ItemSchema = z.object({
    id: z.number(),
    variant_id: z.number(),
    name: z.string(),
    variant_name: z.string().optional().default("Standard"),
    price: z.number().min(1),
    quantity: z.number().min(1),
    category_id: z.number(),
    category_name: z.string(),
});

const CreateTransactionSchema = z.object({
    outlet_id: z.number(),
    outlet_name: z.string(),
    customer_name: z.string().min(1, "Nama harus diisi"),
    customer_phone: z.string().min(10, "Nomor telepon tidak valid"),
    note: z.string().optional().default(""),
    items: z.array(ItemSchema).min(1, "Minimal 1 item"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validatedData = CreateTransactionSchema.parse(body);
        const { outlet_id, outlet_name, customer_name, customer_phone, note, items } =
            validatedData;

        // Calculate total
        const total = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Generate unique order ID
        const orderId = generateOrderId();

        // Prepare item details for Midtrans
        const midtransItems: MidtransItemDetail[] = items.map((item) => ({
            id: `${item.id}-${item.variant_id}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category_name,
        }));

        // Create Midtrans Snap transaction
        const snapResponse = await createSnapTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: total,
            },
            customer_details: {
                first_name: customer_name,
                phone: customer_phone,
            },
            item_details: midtransItems,
            callbacks: {
                finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/order-success?order_id=${orderId}`,
            },
        });

        // Store order in memory for later use (after payment callback)
        createOrder(orderId, {
            outlet_id,
            outlet_name,
            customer_name,
            customer_phone,
            note,
            items: items.map((item) => ({
                id: item.id,
                variant_id: item.variant_id,
                name: item.name,
                variant_name: item.variant_name || "Standard",
                price: item.price,
                quantity: item.quantity,
                category_id: item.category_id,
                category_name: item.category_name,
            })),
            total,
        });

        console.log(`[Payment] Created transaction:`, {
            orderId,
            total,
            items: items.length,
            customer: customer_name,
        });

        return NextResponse.json({
            success: true,
            data: {
                order_id: orderId,
                token: snapResponse.token,
                redirect_url: snapResponse.redirect_url,
            },
        });
    } catch (error) {
        console.error("[Payment] Error creating transaction:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation Error",
                    details: error.issues,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create transaction",
            },
            { status: 500 }
        );
    }
}
