
import fs from 'fs';
import path from 'path';

// Manual env loader
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc: any, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const ACCESS_TOKEN = envVars.MOKA_ACCESS_TOKEN;
const BASE_URL = (envVars.MOKA_API_URL || "https://api.mokapos.com") + "/v1";

console.log("BASE_URL:", BASE_URL);
console.log("Token:", ACCESS_TOKEN ? "Found" : "Missing");

async function fetchMoka(endpoint: string) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Authorization": `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
    if (!res.ok) {
        console.error(`Fetch Error ${res.status}:`, await res.text());
        throw new Error(`Fetch failed: ${res.status}`);
    }
    return res.json();
}

async function postMoka(endpoint: string, body: any) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        console.error(`Post Error ${res.status}:`, await res.text());
        throw new Error(`Post failed: ${res.status}`);
    }
    return res.json();
}

async function run() {
    try {
        // 1. Get Outlet
        const outlets = await fetchMoka("/outlets");
        console.log("Outlets response:", JSON.stringify(outlets).substring(0, 100) + "...");

        const outletId = outlets.data?.outlets?.[0]?.id || outlets.outlets?.[0]?.id;
        if (!outletId) throw new Error("No outlet found");
        console.log("Using Outlet ID:", outletId);

        // 2. Get Product
        const itemsRes = await fetchMoka(`/outlets/${outletId}/items`);
        // Handle different response structures
        const rawItems = itemsRes.data?.items || itemsRes.items || [];

        if (rawItems.length === 0) throw new Error("No items found");

        const product = rawItems[0];
        console.log("Selected Product:", product.name);

        // Find variant
        const variant = product.item_variants?.[0];
        const category = product.category;

        if (!variant || !category) {
            console.log("Product data incomplete:", JSON.stringify(product, null, 2));
            throw new Error("Product missing variant or category");
        }

        // 3. Create Checkout
        // Replicate logic from lib/moka.ts createCheckoutTransaction
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const wibTime = new Date(now.getTime() + wibOffset);
        const formattedTime = wibTime.toISOString().replace('Z', '+07:00');

        const total = variant.price;
        const item = {
            quantity: 1,
            item_id: product.id,
            item_name: product.name,
            item_variant_id: variant.id,
            item_variant_name: variant.name || "Standard", // This is the new field we added
            category_id: category.id,
            category_name: category.name,
            client_price: variant.price,
            gross_sales: variant.price,
            net_sales: variant.price
        };

        const payload = {
            checkout: {
                note: "DEBUG SCRIPT TEST",
                client_created_at: formattedTime,
                total_gross_sales: total,
                total_net_sales: total,
                total_collected: total,
                amount_pay: total,
                items: [item]
            }
        };

        console.log("Sending Payload:", JSON.stringify(payload, null, 2));

        const checkoutRes = await postMoka(`/outlets/${outletId}/checkouts`, payload);
        console.log("✅ CHECKOUT SUCCESS:", checkoutRes);

    } catch (error) {
        console.error("❌ SCRIPT FAILED:", error);
    }
}

run();
