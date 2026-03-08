export type SeedStatus = 'available' | 'low_stock' | 'out_of_stock';

export interface Seed {
  id: string;
  name: string;
  variety: string;
  quantity: number;
  unit: string;
  batch_number: string;
  expiry_date: string;
  status: SeedStatus;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  seed_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  user_id: string;
  seed_name?: string; // Joined
  recipient_id?: string; // Linked to recipients table
  recipient_name?: string; // For legacy or display
  barangay?: string;
  contact_number?: string;
}

export interface Recipient {
  id: string;
  full_name: string;
  barangay: string;
  contact_number: string;
  farm_location?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}
