export interface Item {
  id: number;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image_url: string;
  images?: string[];
  category?: string;
  status: 'available' | 'sold';
  created_at: string;
}

export interface Request {
  id: number;
  buyer_id: string;
  query: string;
  min_price: number;
  max_price: number;
  location: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Proposal extends Omit<Item, 'status'> {
  proposal_id: number;
  request_id: number;
  item_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
}

export interface Transaction {
  id: number;
  proposal_id: number;
  buyer_id: string;
  seller_id: string;
  item_id: number;
  status: 'checkout' | 'paid' | 'shipping' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  
  buyer_name: string;
  buyer_surname: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_city: string;
  buyer_cap: string;
  
  tracking_id?: string;
  courier?: string;
  shipping_deadline: string;
  shipped_at?: string;
  
  seller_iban?: string;
  
  review_rating?: number;
  review_comment?: string;
  
  title: string;
  price: number;
  image_url: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}
