import crypto from "crypto";

// Midtrans API URLs
const SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1";
const PRODUCTION_URL = "https://app.midtrans.com/snap/v1";

// Get server key from env
const getServerKey = () => process.env.MIDTRANS_SERVER_KEY || "";
const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === "true";

// Types
export interface MidtransItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}

export interface MidtransCustomerDetail {
    first_name: string;
    last_name?: string;
    email?: string;
    phone: string;
}

export interface MidtransTransactionRequest {
    transaction_details: {
        order_id: string;
        gross_amount: number;
    };
    customer_details: MidtransCustomerDetail;
    item_details: MidtransItemDetail[];
    callbacks?: {
        finish?: string;
    };
}

export interface MidtransSnapResponse {
    token: string;
    redirect_url: string;
}

export interface MidtransNotification {
    transaction_time: string;
    transaction_status: string;
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key: string;
    payment_type: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    fraud_status?: string;
    currency: string;
}

/**
 * Create a Midtrans Snap transaction token
 */
export async function createSnapTransaction(
    request: MidtransTransactionRequest
): Promise<MidtransSnapResponse> {
    const serverKey = getServerKey();
    const baseUrl = isProduction() ? PRODUCTION_URL : SANDBOX_URL;

    // Base64 encode the server key for Basic Auth
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    const response = await fetch(`${baseUrl}/transactions`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Midtrans API Error:", error);
        throw new Error(error.error_messages?.[0] || "Failed to create transaction");
    }

    return response.json();
}

/**
 * Verify Midtrans notification signature
 */
export function verifySignature(notification: MidtransNotification): boolean {
    const serverKey = getServerKey();
    const { order_id, status_code, gross_amount, signature_key } = notification;

    const expectedSignature = crypto
        .createHash("sha512")
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest("hex");

    return expectedSignature === signature_key;
}

/**
 * Check if transaction is successful
 */
export function isTransactionSuccess(notification: MidtransNotification): boolean {
    const { transaction_status, fraud_status } = notification;

    return (
        transaction_status === "capture" ||
        transaction_status === "settlement" ||
        (transaction_status === "capture" && fraud_status === "accept")
    );
}

/**
 * Check if transaction is pending
 */
export function isTransactionPending(notification: MidtransNotification): boolean {
    return notification.transaction_status === "pending";
}

/**
 * Check if transaction failed/cancelled
 */
export function isTransactionFailed(notification: MidtransNotification): boolean {
    const { transaction_status } = notification;

    return (
        transaction_status === "deny" ||
        transaction_status === "cancel" ||
        transaction_status === "expire" ||
        transaction_status === "failure"
    );
}

/**
 * Generate unique order ID with prefix
 */
export function generateOrderId(): string {
    return `WEB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
