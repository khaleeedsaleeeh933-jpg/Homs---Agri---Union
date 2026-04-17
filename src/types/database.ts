export type UserRole = 'president' | 'vice_president' | 'office_head' | 'member' | 'student';
export type OfficeType = 'organization' | 'followup' | 'media' | 'events' | 'training';
export type ComplaintStatus = 'new' | 'processing' | 'transferred' | 'solved' | 'closed';
export type TaskStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'late';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type IdeaStatus = 'new' | 'studying' | 'implementing' | 'rejected' | 'done';
export type IdeaCategory = 'technical' | 'organizational' | 'events' | 'training' | 'general';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  office: OfficeType | null;
  phone: string | null;
  is_active: boolean;
  join_date: string;
  avatar_url: string | null;
  permissions: string[];
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type: string;
  status: ComplaintStatus;
  location: string | null;
  submitter_name: string | null;
  submitter_phone: string | null;
  submitter_id: string | null;
  response: string | null;
  qr_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  office: OfficeType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  completion_rate: number;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  submitter_id: string | null;
  submitter_name: string | null;
  is_anonymous: boolean;
  votes_count: number;
  comments_count: number;
  created_at: string;
  user_voted?: boolean;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registered_count: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  image_url: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'announcement' | 'alert';
  is_pinned: boolean;
  author: string;
  published_at: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  trainer: string;
  duration: string | null;
  schedule: string | null;
  capacity: number;
  enrolled_count: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  category: string;
  image_url: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'general' | 'office' | 'direct';
  office: OfficeType | null;
  description: string | null;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  is_pinned: boolean;
  reply_to_id: string | null;
  reply_to_content: string | null;
  reply_to_sender: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}
