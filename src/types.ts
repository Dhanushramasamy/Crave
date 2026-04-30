export interface SpaceItem {
  id: string;
  created_at: string;
  name: string;
  category: string;
  room: string;
  description?: string;
  image_url?: string;
  sketch_data?: string;
  type: 'photo' | 'sketch' | 'text';
}

export const ROOMS = ['All', 'Living Room', 'Office', 'Bathroom', 'Bedroom', 'Kitchen', 'Outdoor', 'Other'];
