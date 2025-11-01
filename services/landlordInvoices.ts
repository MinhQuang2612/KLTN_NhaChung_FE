import { apiGet, apiPost } from "@/utils/api";

export interface ManualInvoiceOtherItem {
  description: string;
  amount: number;
  type?: string;
}

export interface CreateManualInvoicePayload {
  contractId: number;
  month: number;
  year: number;
  dueDate?: string; // ISO string
  electricityStart?: number;
  electricityEnd?: number;
  electricityUnitPrice?: number;
  waterStart?: number;
  waterEnd?: number;
  waterUnitPrice?: number;
  otherItems?: ManualInvoiceOtherItem[];
  includeRent?: boolean;
  rentAmountOverride?: number;
  note?: string;
}

export interface CreatedInvoiceItem {
  description: string;
  amount: number;
  type: string;
}

export interface CreateManualInvoiceResponse {
  invoiceId: number;
  tenantId: number;
  landlordId: number;
  contractId: number;
  roomId: number;
  invoiceType: string;
  amount: number;
  dueDate: string;
  status: string;
  description?: string;
  items: CreatedInvoiceItem[];
}

export async function createManualInvoice(payload: CreateManualInvoicePayload): Promise<CreateManualInvoiceResponse> {
  return apiPost("landlord/invoices/manual", payload);
}

export interface MaintenanceFeeInvoice {
  invoiceId: number;
  landlordId: number;
  invoiceType: 'maintenance_fee';
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  description: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  paidDate?: string;
}

/**
 * Lấy danh sách hóa đơn phí duy trì
 */
export async function getMaintenanceFeeInvoices(): Promise<MaintenanceFeeInvoice[]> {
  return apiGet("landlord/invoices?invoiceType=maintenance_fee");
}


