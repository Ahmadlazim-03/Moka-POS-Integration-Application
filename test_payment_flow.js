// Native fetch in Node 18+

async function testPaymentFlow() {
    console.log("1. Creating Transaction...");
    const createUrl = 'http://localhost:3000/api/payment/create-transaction';
    const createData = {
        outlet_id: 111,
        outlet_name: "Test Outlet",
        customer_name: "Test User Flow",
        customer_phone: "08123456789",
        note: "Test Full Flow",
        items: [
            {
                id: 1,
                variant_id: 1,
                name: "Test Item Flow",
                variant_name: "Standard",
                price: 15000,
                quantity: 1,
                category_id: 1,
                category_name: "Test Cat"
            }
        ]
    };

    let orderId;

    try {
        const res = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const json = await res.json();
        console.log('Create Response:', JSON.stringify(json, null, 2));

        if (json.success) {
            orderId = json.data.order_id;
            console.log("✅ Order created:", orderId);
        } else {
            console.error("❌ Failed to create order");
            return;
        }

    } catch (err) {
        console.error('Create Error:', err);
        return;
    }

    console.log("\n2. Recording Payment (Simulating Midtrans Success)...");
    const recordUrl = 'http://localhost:3000/api/payment/record';
    const recordData = {
        order_id: orderId,
        payment_type: "credit_card" // Simulate
    };

    try {
        const res = await fetch(recordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData)
        });
        const json = await res.json();
        console.log('Record Response Preview:', JSON.stringify(json, null, 2).substring(0, 500));

        if (json.success) {
            console.log("✅ Payment recorded & sent to Moka!");
        } else {
            console.error("❌ Failed to record payment");
        }

    } catch (err) {
        console.error('Record Error:', err);
    }
}

testPaymentFlow();
