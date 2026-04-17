import { useState, useEffect } from 'react';
import { Users, Plus, X, Shield, Search, Phone, Mail, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile, UserRole, OfficeType } from '@/types/database';
import { toast } from 'sonner';

const ROLE_LABELS: Record<UserRole, string> = {
  president: 'رئيس الهيئة', vice_president: 'نائب الرئيس',
  office_head: 'رئيس مكتب', member: 'عضو', student: 'طالب',
};
const ROLE_COLORS: Record<UserRole, string> = {
  president: 'bg-yellow-100 text-yellow-800', vice_president: 'bg-purple-100 text-purple-800',
  office_head: 'bg-blue-100 text-blue-700', member: 'bg-green-100 text-green-700', student: 'bg-gray-100 text-gray-600',
};
const OFFICES: Record<OfficeType, string> = {
  organization: 'مكتب التنظيم', followup: 'مكتب المتابعة',
  media: 'مكتب الإعلام', events: 'مكتب الفعاليات', training: 'مكتب التدريب',
};

const UsersPage = () => {
  const { user: authUser, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'member' as UserRole, office: '' as OfficeType | '', phone: '',
  });

  const canManage = profile?.role === 'president' || profile?.role === 'vice_president';

  const fetchUsers = async () => {
    const { data } = await supabase.from('user_profiles').select('*').order('join_date', { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // Refresh users list every 15s to stay in sync
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = !search || (u.username || '').includes(search) || u.email.includes(search);
    return matchRole && matchSearch;
  });

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (form.password.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: form.email, password: form.password, name: form.name, role: form.role, office: form.office || null, phone: form.phone || null },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[${statusCode}] ${textContent || error.message}`;
          } catch { errorMessage = error.message; }
        }
        throw new Error(errorMessage);
      }

      toast.success(`تم إنشاء حساب ${form.name} بنجاح`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'member', office: '', phone: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Use SECURITY DEFINER function to bypass RLS for admin operations
  const adminUpdateProfile = async (targetUserId: string, updates: { role?: UserRole; office?: string | null; is_active?: boolean }) => {
    // Call admin_update_user_profile function for role/office changes
    if (updates.role !== undefined || updates.office !== undefined) {
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        p_target_user_id: targetUserId,
        p_role: updates.role ?? null,
        p_office: updates.office !== undefined ? (updates.office || null) : null,
        p_is_active: updates.is_active !== undefined ? updates.is_active : null,
      });
      if (error || data === false) {
        console.error('admin_update_user_profile error:', error);
        toast.error('فشل التحديث: ' + (error?.message || 'لا توجد صلاحية'));
        return false;
      }
      return true;
    }
    // For is_active only — president can update since it's own RLS bypass via function
    if (updates.is_active !== undefined) {
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        p_target_user_id: targetUserId,
        p_role: null,
        p_office: null,
        p_is_active: updates.is_active,
      });
      if (error || data === false) {
        toast.error('فشل التحديث: ' + (error?.message || 'لا توجد صلاحية'));
        return false;
      }
      return true;
    }
    return false;
  };

  const toggleActive = async (userId: string, current: boolean) => {
    const success = await adminUpdateProfile(userId, { is_active: !current });
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u));
      setSelected(prev => prev && prev.id === userId ? { ...prev, is_active: !current } : prev);
      toast.success(!current ? 'تم تفعيل الحساب' : 'تم تعليق الحساب');
    }
  };

  const changeRole = async (userId: string, newRole: UserRole) => {
    const success = await adminUpdateProfile(userId, { role: newRole });
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSelected(prev => prev && prev.id === userId ? { ...prev, role: newRole } : prev);
      toast.success('تم تحديث الدور إلى: ' + ROLE_LABELS[newRole]);
    }
  };

  const changeOffice = async (userId: string, newOffice: OfficeType | '') => {
    const success = await adminUpdateProfile(userId, { office: newOffice || null });
    if (success) {
      const officeVal = newOffice as OfficeType | undefined;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, office: officeVal || undefined } : u));
      setSelected(prev => prev && prev.id === userId ? { ...prev, office: officeVal || undefined } : prev);
      toast.success('تم تحديث المكتب');
    }
  };

  if (!canManage) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield size={48} className="mx-auto mb-3 opacity-20" />
        <p>ليس لديك صلاحية لإدارة المستخدمين</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground text-sm">{users.length} مستخدم مسجل</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />إضافة مستخدم
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="glass-card-light rounded-xl p-3 text-center border border-gray-100">
            <p className="text-xl font-black text-foreground">{users.filter(u => u.role === role).length}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setRoleFilter('all')} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${roleFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>الكل</button>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setRoleFilter(k)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${roleFilter === k ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-light rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">المستخدم</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">الدور</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">المكتب</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">الهاتف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {(u.username || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{u.username || '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{u.office ? OFFICES[u.office as OfficeType] : '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground" dir="ltr">{u.phone || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${u.is_active ? 'status-solved' : 'status-closed'}`}>{u.is_active ? 'نشط' : 'موقوف'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(u)} className="p-1.5 hover:bg-primary/10 rounded-lg" title="إدارة">
                        <Shield size={14} className="text-primary" />
                      </button>
                      <button onClick={() => toggleActive(u.id, u.is_active)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-xs text-muted-foreground" title={u.is_active ? 'إيقاف' : 'تفعيل'}>
                        {u.is_active ? '⏸' : '▶'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">إدارة المستخدم</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                {(selected.username || selected.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selected.username || '—'}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
                {selected.phone && <p className="text-xs text-muted-foreground" dir="ltr">{selected.phone}</p>}
              </div>
            </div>

            {profile?.role === 'president' && selected.id !== authUser?.id && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-foreground">تغيير الدور:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'president').map(([roleKey, label]) => (
                    <button key={roleKey} onClick={() => changeRole(selected.id, roleKey as UserRole)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${selected.role === roleKey ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground mt-3">المكتب:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => changeOffice(selected.id, '')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all col-span-2 ${!selected.office ? 'bg-gray-400 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    — بدون مكتب —
                  </button>
                  {Object.entries(OFFICES).map(([officeKey, label]) => (
                    <button key={officeKey} onClick={() => changeOffice(selected.id, officeKey as OfficeType)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${selected.office === officeKey ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { toggleActive(selected.id, selected.is_active); }}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${selected.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
              {selected.is_active ? 'تعليق الحساب' : 'تفعيل الحساب'}
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-lg">إضافة عضو جديد</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Users size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="الاسم الكامل *"
                  className="w-full border border-border rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="relative">
                <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="البريد الإلكتروني *" type="email"
                  className="w-full border border-border rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="relative">
                <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الهاتف" type="tel"
                  className="w-full border border-border rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="كلمة المرور (6 أحرف+) *" minLength={6}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white focus:ring-2 focus:ring-primary/30">
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'president').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={form.office} onChange={e => setForm(p => ({ ...p, office: e.target.value as OfficeType }))}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white focus:ring-2 focus:ring-primary/30">
                  <option value="">— بدون مكتب —</option>
                  {Object.entries(OFFICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'إضافة العضو'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-foreground py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
