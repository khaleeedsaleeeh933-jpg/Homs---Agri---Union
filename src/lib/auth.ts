import type { User, UserRole } from '@/types';
import { MOCK_USERS } from './mockData';

const AUTH_KEY = 'agr_homs_user';

export const login = (email: string, password: string): User | null => {
  // Mock authentication - any password works for demo
  const user = MOCK_USERS.find(u => u.email === email);
  if (user && password.length >= 4) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'president') return true;
  if (user.permissions?.includes('all')) return true;
  return user.permissions?.includes(permission) ?? false;
};

export const canManageOffice = (user: User | null, office: string): boolean => {
  if (!user) return false;
  if (user.role === 'president' || user.role === 'vice_president') return true;
  if (user.role === 'office_head' && user.office === office) return true;
  return false;
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    president: 'رئيس الهيئة',
    vice_president: 'نائب الرئيس',
    office_head: 'رئيس مكتب',
    member: 'عضو',
    student: 'طالب',
  };
  return labels[role];
};

export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    president: 'bg-amber-100 text-amber-800',
    vice_president: 'bg-purple-100 text-purple-800',
    office_head: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-700',
    student: 'bg-gray-100 text-gray-700',
  };
  return colors[role];
};

// Demo credentials for login page
export const DEMO_CREDENTIALS = [
  { email: 'president@agr-homs.edu.sy', role: 'رئيس الهيئة', name: 'أحمد محمد الحسن' },
  { email: 'vp@agr-homs.edu.sy', role: 'نائب الرئيس', name: 'سارة خالد الرحمون' },
  { email: 'events@agr-homs.edu.sy', role: 'رئيس مكتب الفعاليات', name: 'محمد علي سليمان' },
  { email: 'member1@agr-homs.edu.sy', role: 'عضو', name: 'عمر حسين عبيدو' },
  { email: 'student@agr-homs.edu.sy', role: 'طالب', name: 'طالب' },
];
