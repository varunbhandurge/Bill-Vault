// ==============================================================================
// ASSETCARE - CORE DOMAIN MODEL INTERFACES & TYPES
// ==============================================================================

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  auth_id?: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  must_change_password: boolean;
  phone?: string;
  is_active: boolean;
  household_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by?: string;
  created_at: string;
}

export type CategorySection = 'Household' | 'Electronics' | 'Vehicles' | 'Other';

export interface Category {
  id: string;
  name: string;
  section: CategorySection;
  icon: string;
  description?: string;
  is_default: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  household_id?: string;
  name: string;
  category_id: string;
  category_name?: string;
  category_section?: CategorySection;
  brand: string;
  model: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price: number;
  seller_name?: string;
  dealer_contact?: string;
  installation_date?: string;
  warranty_start_date?: string;
  warranty_expiry_date?: string;
  location?: string;
  notes?: string;
  photos: string[];
  qr_code_id: string;

  // Vehicle-specific fields
  registration_number?: string;
  chassis_number?: string;
  engine_number?: string;
  odometer_reading?: number;
  insurance_expiry_date?: string;
  puc_expiry_date?: string;
  service_interval_km?: number;
  service_interval_months?: number;

  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | 'purchase_invoice'
  | 'service_invoice'
  | 'repair_invoice'
  | 'warranty_certificate'
  | 'insurance_document'
  | 'other';

export interface Document {
  id: string;
  asset_id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash: string; // SHA-256 for duplicate checking
  storage_type: 'local' | 'supabase';
  created_at: string;
}

export type OCRStatus =
  | 'uploaded'
  | 'processing'
  | 'extraction_completed'
  | 'verification_required'
  | 'verified'
  | 'failed';

export interface SparePartItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ExtractedInvoiceData {
  invoice_number?: string;
  invoice_date?: string;
  service_date?: string;
  vendor_name?: string;
  vendor_address?: string;
  vendor_phone?: string;
  gstin?: string;
  description_of_work?: string;
  product_or_component?: string;
  spare_parts: SparePartItem[];
  labour_charges?: number;
  material_charges?: number;
  discount?: number;
  gst_amount?: number;
  total_amount?: number;
  payment_mode?: string;
  warranty_duration_months?: number;
  warranty_expiry_date?: string;
  confidence_scores: Record<string, number>;
}

export interface OCRRecord {
  id: string;
  document_id: string;
  status: OCRStatus;
  raw_text: string;
  structured_data: ExtractedInvoiceData;
  confidence_score: number;
  fields_needing_verification: string[];
  verified_by?: string;
  verified_at?: string;
  error_message?: string;
  created_at: string;
}

export type ServiceType =
  | 'repair'
  | 'general_servicing'
  | 'routine_maintenance'
  | 'inspection';

export interface ServiceRecord {
  id: string;
  asset_id: string;
  document_id?: string;
  user_id: string;
  invoice_number?: string;
  service_date: string;
  vendor_name: string;
  vendor_address?: string;
  vendor_phone?: string;
  gstin?: string;
  service_type: ServiceType;
  component: string; // e.g. "AC Compressor", "Brake Pads", "Battery", "Water Filter"
  description_of_work: string;
  spare_parts_replaced: SparePartItem[];
  labour_charges: number;
  material_charges: number;
  discount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode?: string;
  warranty_duration_months: number;
  warranty_expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export type WarrantyType = 'manufacturer' | 'repair_service';
export type ClaimStatus = 'active' | 'expired' | 'claimed' | 'disputed';

export interface Warranty {
  id: string;
  asset_id: string;
  service_record_id?: string;
  document_id?: string;
  component: string;
  warranty_type: WarrantyType;
  start_date: string;
  duration_months: number;
  expiry_date: string;
  provider: string;
  conditions?: string;
  claim_status: ClaimStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderFrequency =
  | 'monthly'
  | 'every_3_months'
  | 'every_6_months'
  | 'annually'
  | 'custom';

export interface Reminder {
  id: string;
  asset_id: string;
  asset_name?: string;
  user_id: string;
  title: string;
  activity: string;
  reference_date: string; // e.g., last service date
  frequency: ReminderFrequency;
  custom_interval_days?: number;
  advance_notice_days: number[]; // e.g. [7, 15, 30]
  next_due_date: string;
  repeat_enabled: boolean;
  is_active: boolean;
  last_notified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: string;
  reminder_id: string;
  triggered_date: string;
  status: 'notified' | 'completed' | 'dismissed';
  completed_date?: string;
  invoice_linked_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalAssets: number;
  totalDocuments: number;
  totalPurchaseExpense: number;
  totalRepairExpense: number;
  totalServiceExpense: number;
  upcomingRemindersCount: number;
  overdueRemindersCount: number;
  activeWarrantiesCount: number;
  expiringWarrantiesCount: number;
  storageBytesUsed: number;
}
