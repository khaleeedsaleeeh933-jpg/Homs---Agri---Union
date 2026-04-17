export type UserRole = 'president' | 'vice_president' | 'office_head' | 'member' | 'student';

export type OfficeType = 'organization' | 'follow_up' | 'media' | 'events' | 'training';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  office?: OfficeType;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  joinDate: string;
  permissions?: string[];
}

export type ComplaintStatus = 'new' | 'processing' | 'transferred' | 'solved' | 'closed';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type: string;
  status: ComplaintStatus;
  location?: string;
  submitterName?: string;
  submitterPhone?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  response?: string;
}

export type TaskStatus = 'new' | 'in_progress' | 'review' | 'completed' | 'late';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  office: OfficeType;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  completionRate: number;
  tags?: string[];
}

export type IdeaStatus = 'pending' | 'studying' | 'in_progress' | 'rejected' | 'completed';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  votes: number;
  comments: IdeaComment[];
  submittedBy: string;
  isAnonymous: boolean;
  createdAt: string;
  hasVoted?: boolean;
}

export interface IdeaComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  tags?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'announcement' | 'alert';
  publishedAt: string;
  author: string;
  isPinned: boolean;
  image?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'complaint' | 'idea' | 'general' | 'event';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  trainer: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  createdAt: string;
  isFile?: boolean;
  fileName?: string;
  isPinned?: boolean;
  room: string;
}
