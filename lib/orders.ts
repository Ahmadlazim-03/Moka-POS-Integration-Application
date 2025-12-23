/**
 * Simple in-memory order storage for MVP
 * In production, replace with a proper database (e.g., Prisma, MongoDB)
 */

export interface OrderItem {
    id: number;
    variant_id: number;
    name: string;
    variant_name: string;
    price: number;
    quantity: number;
    category_id: number;
    category_name: string;
}

export interface Order {
    id: string;
    outlet_id: number;
    outlet_name: string;
    customer_name: string;
    customer_phone: string;
    note: string;
    items: OrderItem[];
    total: number;
    status: "pending" | "paid" | "failed" | "expired" | "cancelled";
    payment_type?: string;
    midtrans_transaction_id?: string;
    moka_receipt_no?: string;
    created_at: Date;
    updated_at: Date;
}

// In-memory storage
const orders: Map<string, Order> = new Map();

/**
 * Create a new pending order
 */
export function createOrder(
    orderId: string,
    data: Omit<Order, "id" | "status" | "created_at" | "updated_at">
): Order {
    const order: Order = {
        ...data,
        id: orderId,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
    };

    orders.set(orderId, order);
    console.log(`[Orders] Created order: ${orderId}`);
    return order;
}

/**
 * Get order by ID
 */
export function getOrder(orderId: string): Order | undefined {
    return orders.get(orderId);
}

/**
 * Update order status
 */
export function updateOrderStatus(
    orderId: string,
    status: Order["status"],
    extraData?: Partial<Order>
): Order | undefined {
    const order = orders.get(orderId);
    if (!order) {
        console.warn(`[Orders] Order not found: ${orderId}`);
        return undefined;
    }

    const updatedOrder: Order = {
        ...order,
        ...extraData,
        status,
        updated_at: new Date(),
    };

    orders.set(orderId, updatedOrder);
    console.log(`[Orders] Updated order ${orderId} status to: ${status}`);
    return updatedOrder;
}

/**
 * Get all orders (for debugging)
 */
export function getAllOrders(): Order[] {
    return Array.from(orders.values());
}

/**
 * Clear all orders (for testing)
 */
export function clearOrders(): void {
    orders.clear();
    console.log("[Orders] Cleared all orders");
}
