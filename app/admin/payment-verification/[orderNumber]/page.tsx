import AdminOrderDetailPage from "@/app/admin/orders/[orderNumber]/page";

// Payment Verification review re-uses the full order detail view (items,
// payment record, proof screenshot, approve/reject actions) so admins
// have complete context, not just the screenshot.
export default AdminOrderDetailPage;
