// lib/moka.ts

const BASE_URL = (process.env.MOKA_API_URL || "https://api.mokapos.com") + "/v1";
const ACCESS_TOKEN = process.env.MOKA_ACCESS_TOKEN;

// --- TIPE DATA (INTERFACES) ---

export interface MokaOutlet {
  id: number;
  name: string;
}

export interface CleanProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  // Field Tambahan (Wajib untuk API Order)
  variant_id: number;
  variant_name: string;
  category_id: number;
}

// Checkout API Types
export interface CheckoutItem {
  quantity: number;
  item_id: number;
  item_name: string;
  item_variant_id: number;
  item_variant_name: string;
  category_id: number;
  category_name: string;
  client_price: number;
  gross_sales: number;
  net_sales: number;
}

export interface CheckoutRequest {
  checkout: {
    note: string;
    client_created_at: string;
    total_gross_sales: number;
    total_net_sales: number;
    total_collected: number;
    amount_pay: number;
    items: CheckoutItem[];
  };
}

export interface CheckoutResponse {
  data: {
    uuid: string;
    receipt_no: string;
    total_collected: number;
  };
  meta: {
    code: number;
  };
}

// --- HELPER FETCHING ---

async function fetchMoka(endpoint: string, cacheStrategy: RequestCache = 'default') {
  if (!ACCESS_TOKEN) {
    throw new Error("MOKA_ACCESS_TOKEN belum diset di .env.local");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    cache: cacheStrategy,
  });

  if (!res.ok) {
    throw new Error(`Moka API Error (${res.status}): ${res.statusText}`);
  }

  return res.json();
}

async function postMoka(endpoint: string, body: object) {
  if (!ACCESS_TOKEN) {
    throw new Error("MOKA_ACCESS_TOKEN belum diset di .env.local");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Moka POST Error:", data);
    throw new Error(`Moka API Error (${res.status}): ${data?.meta?.error_message || res.statusText}`);
  }

  return data;
}

// --- FUNGSI UTAMA ---

/**
 * 1. Ambil daftar semua Outlet yang tersedia di akun
 */
export async function getMokaOutlets(): Promise<MokaOutlet[]> {
  try {
    // Menggunakan endpoint profile untuk melihat akses outlet user
    const data = await fetchMoka('/profile/self', 'force-cache'); // Cache profil 

    // Mapping dari array ID dan Name terpisah menjadi array of object
    // Data asli Moka: { outlet_ids: [1, 2], outlet_names: ["A", "B"] }
    if (data.outlet_ids && data.outlet_names) {
      const outlets: MokaOutlet[] = data.outlet_ids.map((id: number, index: number) => ({
        id: id,
        name: data.outlet_names[index] || `Outlet ${id}`
      }));
      return outlets;
    }

    return [];
  } catch (error) {
    console.error("Gagal ambil outlet:", error);
    return [];
  }
}

/**
 * 2. Ambil Produk berdasarkan Outlet ID yang dipilih
 */
export async function getMokaProducts(outletId: number): Promise<CleanProduct[]> {
  try {
    console.log(`Fetching items untuk Outlet ID: ${outletId}...`);

    // Fetch items dari outlet spesifik
    const json = await fetchMoka(`/outlets/${outletId}/items`, 'no-store'); // No-store agar stok selalu update

    // Struktur JSON Moka kadang ada di dalam property "data", kadang langsung di root
    const rawItems = json.data?.items || json.items || [];

    // Cleaning & Mapping Data
    return rawItems.map((item: any) => {
      // Ambil varian pertama sebagai default (biasanya varian "Standard")
      const mainVariant = item.item_variants?.[0];

      return {
        id: item.id,
        name: item.name,
        description: item.description || "",

        // Harga & Stok dari varian utama
        price: mainVariant?.price || 0,
        stock: mainVariant?.in_stock || 0,

        // Kategori & Gambar
        category: item.category?.name || "Uncategorized",
        imageUrl: item.image?.url || null, // URL gambar dari server Moka/Gojek

        // --- DATA PENTING UNTUK CHECKOUT ---
        // Kita butuh ID ini saat mengirim pesanan balik ke Moka
        variant_id: mainVariant?.id || 0,
        variant_name: mainVariant?.name || "Standard",
        category_id: item.category?.id || 0,
      };
    });

  } catch (error) {
    console.error(`Error fetching products for outlet ${outletId}:`, error);
    return [];
  }
}

/**
 * 3. Create a checkout transaction in Moka (for recording completed online payments)
 * This creates a completed transaction directly in Moka's Transactions/Reports
 * Use this after successful online payment (e.g., Midtrans)
 */
export async function createCheckoutTransaction(
  outletId: number,
  items: CheckoutItem[],
  paymentNote: string,
  totalAmount: number
): Promise<CheckoutResponse> {
  // Format time for Indonesia (WIB +7)
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibTime = new Date(now.getTime() + wibOffset);
  const formattedTime = wibTime.toISOString().replace('Z', '+07:00');

  const checkoutRequest: CheckoutRequest = {
    checkout: {
      note: paymentNote,
      client_created_at: formattedTime,
      total_gross_sales: totalAmount,
      total_net_sales: totalAmount,
      total_collected: totalAmount,
      amount_pay: totalAmount,
      items: items,
    },
  };

  console.log(`[Moka Checkout] Creating transaction for outlet ${outletId}:`, {
    itemsCount: items.length,
    total: totalAmount,
    note: paymentNote,
    firstItem: items[0], // Log first item for debugging
  });

  try {
    const response = await postMoka(`/outlets/${outletId}/checkouts`, checkoutRequest);
    console.log(`[Moka Checkout] Transaction created successfully:`, {
      receipt_no: response.data?.receipt_no,
      uuid: response.data?.uuid,
    });
    return response;
  } catch (error) {
    console.error(`[Moka Checkout] Failed to create transaction. Payload:`, JSON.stringify(checkoutRequest, null, 2));
    throw error;
  }


}

// --- Advanced Orderings Types ---

export interface AdvancedOrderItem {
  item_id: number;
  item_name: string;
  quantity: number;
  item_variant_id: number;
  item_variant_name: string;
  note: string;
  item_price_library: number;
  category_id: number;
  category_name: string;
  item_modifiers: any[];
  item_discount_amount: number | null;
}

export interface AdvancedOrderRequest {
  customer_name: string;
  customer_phone_number: string;
  customer_address_detail: string;
  customer_city: string;
  sales_type_name: string;
  client_created_at: string;
  application_order_id: string;
  payment_type: string;
  note: string;
  discount_amount: number | null;
  order_items: AdvancedOrderItem[];
}

export interface AdvancedOrderResponse {
  orderId?: string; // Added by createAdvancedOrder function
  data: {
    id: number;
    uuid: string;
    application_order_id: string;
    status: string;
  };
  meta: {
    code: number;
  };
}

/**
 * 4. Create an Advanced Order in Moka (for pay-at-cashier flow)
 * This sends the order to the Moka mobile app for cashier to process
 * Order will appear in cashier's app, they must accept + complete it
 */
export async function createAdvancedOrder(
  outletId: number,
  customerName: string,
  customerPhone: string,
  customerNote: string,
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    variant_id: number;
    category_id: number;
    category: string;
  }[]
): Promise<AdvancedOrderResponse> {
  // Generate unique order ID
  const orderId = `WEB-${Date.now()}`;

  // Format time for Indonesia (WIB +7)
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibTime = new Date(now.getTime() + wibOffset);
  const formattedTime = wibTime.toISOString().replace('Z', '+07:00');

  // Build order items
  const orderItems: AdvancedOrderItem[] = items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    item_variant_id: item.variant_id,
    item_variant_name: "Standard",
    note: "",
    item_price_library: item.price,
    category_id: item.category_id,
    category_name: item.category,
    item_modifiers: [],
    item_discount_amount: null,
  }));

  // Calculate total for note
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsSummary = items.map((item) => `${item.name} x${item.quantity}`).join(", ");

  const orderRequest: AdvancedOrderRequest = {
    customer_name: customerName,
    customer_phone_number: customerPhone || "-",
    customer_address_detail: "Online Order",
    customer_city: "Online",
    sales_type_name: "Website Order",
    client_created_at: formattedTime,
    application_order_id: orderId,
    payment_type: "Cash",
    note: customerNote
      ? `[Website] ${customerNote} | ${itemsSummary}`
      : `[Website] ${itemsSummary}`,
    discount_amount: null,
    order_items: orderItems,
  };

  console.log(`[Moka Advanced Order] Sending to outlet ${outletId}:`, {
    orderId,
    customer: customerName,
    items: items.length,
    total: totalAmount,
  });

  const response = await postMoka(
    `/outlets/${outletId}/advanced_orderings/orders`,
    orderRequest
  );

  console.log(`[Moka Advanced Order] Created:`, {
    orderId,
    status: response.data?.status,
    uuid: response.data?.uuid,
  });

  return { ...response, orderId };
}

