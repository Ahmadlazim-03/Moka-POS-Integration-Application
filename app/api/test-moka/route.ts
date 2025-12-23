// app/api/test-moka/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const OUTLET_ID = 1136556;
  const ACCESS_TOKEN = "0ae5505f88013c4d9ebc78e1326924a7d35e1ef6be4ca4134e46a27c819dee86";
  const URL = `https://api.mokapos.com/v1/outlets/${OUTLET_ID}/advanced_orderings/orders`;

  const uniqueOrderId = `WEB-${Date.now()}`;
  const d = new Date();
  const clientCreatedAt = new Date(d.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace('Z', '+07:00');

  // Payload FIX: Menghapus semua field diskon
  const payload = {
    customer_name: "Ahmad Lazim (Final Test)",
    customer_phone_number: "081234567890",
    customer_address_detail: "Jalan Test Surabaya",
    customer_province: "Jawa Timur",
    customer_city: "Surabaya",
    customer_kecamatan: "Gubeng",
    customer_postal_code: "60281",
    
    // Gunakan nama sales type yang umum jika ID tidak diketahui
    sales_type_name: "Website Order", 
    
    client_created_at: clientCreatedAt,
    application_order_id: uniqueOrderId,
    payment_type: "Cash", // Cash biasanya aman untuk test
    note: "Order Testing Integrasi Tanpa Diskon",
    
    // Callback URL (Opsional, isi dummy saja)
    complete_order_notification_url: "https://example.com/callback",
    
    // --- BAGIAN PENTING: JANGAN KIRIM FIELD DISCOUNT_AMOUNT DI SINI ---

    order_items: [
      {
        item_id: 118380668,
        item_name: "Macha Latte",
        quantity: 1,
        
        item_variant_id: 185416250,
        item_variant_name: "Standard",
        
        note: "Less Sugar",
        item_price_library: 10000,
        
        category_id: 6837232,
        category_name: "Franchise Coffe Shop Surabaya",
        
        // Modifier kosong
        item_modifiers: []

        // --- BAGIAN PENTING: JANGAN KIRIM ITEM_DISCOUNT DI SINI JUGA ---
      }
    ]
  };

  try {
    console.log(`🔵 Mengirim Advanced Order Bersih...`);
    
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    console.log(`🟡 Status: ${res.status}`);

    return NextResponse.json({
      status: res.status,
      success: res.ok,
      moka_response: json,
      payload_sent: payload
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}