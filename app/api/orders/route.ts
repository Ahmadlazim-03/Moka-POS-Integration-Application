// app/api/orders/route.ts
// API for "Bayar di Kasir" - sends order to Moka mobile app

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdvancedOrder } from "@/lib/moka";

// Validation Schema
const CartItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  variant_id: z.number(),
  category_id: z.number(),
  category: z.string(),
});

const OrderSchema = z.object({
  customer_name: z.string().min(1, "Nama wajib diisi"),
  customer_phone: z.string().optional(),
  customer_note: z.string().optional(),
  outlet_id: z.number(),
  items: z.array(CartItemSchema).min(1, "Minimal 1 item dalam pesanan"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate Input with Zod
    const validation = OrderSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { customer_name, customer_phone, customer_note, outlet_id, items } =
      validation.data;

    // 2. Calculate total for logging
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    console.log("🔵 [Bayar di Kasir] Sending Order to Moka...");
    console.log(`   Customer: ${customer_name}`);
    console.log(`   Items: ${items.length}`);
    console.log(`   Total: Rp ${totalAmount.toLocaleString("id-ID")}`);

    // 3. Send to Moka via Advanced Orderings API
    const result = await createAdvancedOrder(
      outlet_id,
      customer_name,
      customer_phone || "",
      customer_note || "",
      items
    );

    console.log("✅ Order sent to Moka cashier app");

    return NextResponse.json({
      success: true,
      data: {
        order_id: result.orderId,
        status: result.data?.status || "pending",
        message: "Pesanan dikirim ke kasir. Silakan datang ke outlet untuk pembayaran.",
      },
    });
  } catch (error: unknown) {
    console.error("❌ Server Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
