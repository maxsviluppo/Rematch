export interface Item {
  id: number;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image_url: string;
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
