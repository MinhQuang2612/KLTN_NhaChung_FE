import { apiGet, apiPost } from "@/utils/api";

// ==================== TYPES ====================

export interface Invoice {
  invoiceId: number;
  amount: number;
  dueDate: string;
  invoiceType: 'rent' | 'deposit' | 'utility' | 'other';
  roomNumber: string;
  isQrGenerated: boolean;
  canPay: boolean;
  description?: string;
  createdAt: string;
}

export interface ZaloPayQRData {
  // Theo hướng dẫn API - response structure chính xác (cập nhật)
  orderId: string;
  qrCodeUrl: string;
  qrCodeData: string;
  amount: number;
  expiryAt: string;
}

export interface PaymentStatus {
  orderId: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  paidAt?: string;
  paymentMethod?: string;
  errorMessage?: string;
}

export interface PaidInvoice {
  invoiceId: number;
  amount: number;
  paidDate: string;
  invoiceType: string;
  roomNumber: string;
  paymentMethod: string;
  description: string;
  items: InvoiceItem[];
}

export interface PaymentHistoryItem {
  invoiceId: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  invoiceType: string;
  roomNumber: string;
  paymentMethod?: string;
  description: string;
  items: InvoiceItem[];
  canPay: boolean;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  type: string;
}

export interface RoomPaymentStatus {
  roomNumber: string;
  buildingName: string;
  paymentStatus: 'fully_paid' | 'partial_paid' | 'not_paid' | 'overdue';
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  paidAmount: number;
  pendingInvoices: number;
  pendingAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  latestInvoice?: {
    invoiceId: number;
    invoiceType: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending';
    paidDate?: string;
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Lấy danh sách hóa đơn chờ thanh toán
 */
export async function getPendingInvoices(): Promise<Invoice[]> {
  return apiGet("payments/pending-invoices");
}

/**
 * Lấy danh sách hóa đơn đã thanh toán
 */
export async function getPaidInvoices(): Promise<PaidInvoice[]> {
  return apiGet("payments/paid-invoices");
}

/**
 * Lấy lịch sử thanh toán (tất cả hóa đơn)
 */
export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  return apiGet("payments/payment-history");
}

/**
 * Lấy trạng thái thanh toán của hợp đồng cụ thể
 */
export async function getContractPaymentStatus(contractId: number): Promise<RoomPaymentStatus> {
  return apiGet(`payments/contract/${contractId}/status`);
}

/**
 * Tạo mã QR thanh toán ZaloPay
 */
export async function generateZaloPayQR(invoiceId: number): Promise<ZaloPayQRData> {
  return apiPost("payments/generate-zalopay-qr", { invoiceId });
}

/**
 * Kiểm tra trạng thái thanh toán
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
  return apiGet(`payments/status/${orderId}`);
}


// ==================== UTILITY FUNCTIONS ====================

/**
 * Format loại hóa đơn
 */
export function formatInvoiceType(type: Invoice['invoiceType']): string {
  switch (type) {
    case 'rent': return 'Tiền thuê';
    case 'deposit': return 'Tiền cọc';
    case 'utility': return 'Tiền điện nước';
    case 'other': return 'Khác';
    default: return type;
  }
}

/**
 * Format trạng thái thanh toán
 */
export function formatPaymentStatus(status: PaymentStatus['status']): string {
  switch (status) {
    case 'pending': return 'Chờ thanh toán';
    case 'paid': return 'Đã thanh toán';
    case 'failed': return 'Thanh toán thất bại';
    case 'expired': return 'Hết hạn';
    default: return status;
  }
}

/**
 * Format số tiền
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Kiểm tra hóa đơn có quá hạn không
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  return dueDate < now;
}

/**
 * Tính số ngày quá hạn
 */
export function calculateOverdueDays(invoice: Invoice): number {
  if (!isInvoiceOverdue(invoice)) return 0;
  
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}