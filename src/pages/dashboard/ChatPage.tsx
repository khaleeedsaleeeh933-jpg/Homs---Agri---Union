import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Pin, Reply, X, MessageSquare, ChevronRight,
  Check, CheckCheck, Smile, Hash, Lock, Search, Trash2, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoom, ChatMessage } from '@/types/database';
import { toast } from 'sonner';

const OFFICE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  general:      { label: 'الغرفة العامة',       emoji: '🌐', color: '#1a6b3a', bg: '#e8f5e9' },
  organization: { label: 'مكتب التنظيم',         emoji: '📋', color: '#1565c0', bg: '#e3f2fd' },
  followup:     { label: 'مكتب المتابعة',         emoji: '📌', color: '#6a1b9a', bg: '#f3e5f5' },
  media:        { label: 'مكتب الإعلام',          emoji: '📢', color: '#e65100', bg: '#fff3e0' },
  events:       { label: 'مكتب الفعاليات',        emoji: '📅', color: '#00695c', bg: '#e0f2f1' },
  training:     { label: 'مكتب التدريب',           emoji: '🎓', color: '#4527a0', bg: '#ede7f6' },
  academic:     { label: 'الشؤون الأكاديمية',     emoji: '🏛️', color: '#b71c1c', bg: '#ffebee' },
};

const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','✅','👏','🙏','💪','📝','⚡'];

const ChatPage = () => {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isStudent = profile?.role === 'student';

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase.from('chat_rooms').select('*').order('created_at');
    if (data) {
      const accessible = isStudent ? [] : (data as ChatRoom[]);
      setRooms(accessible);
      if (!activeRoom && accessible.length > 0) setActiveRoom(accessible[0]);
    }
  }, [isStudent]);

  const fetchMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(150);
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => fetchMessages(activeRoom.id), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeRoom?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!content.trim() || !activeRoom || !user || !profile) return;
    const trimmed = content.trim();
    setContent('');
    const prev = replyTo;
    setReplyTo(null);

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      room_id: activeRoom.id,
      sender_id: user.id,
      sender_name: profile.username || profile.email,
      sender_avatar: profile.avatar_url,
      content: trimmed,
      is_pinned: false,
      reply_to_id: prev?.id || null,
      reply_to_content: prev?.content || null,
      reply_to_sender: prev?.sender_name || null,
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, optimistic]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    const { error } = await supabase.from('chat_messages').insert({
      room_id: activeRoom.id,
      sender_id: user.id,
      sender_name: profile.username || profile.email,
      sender_avatar: profile.avatar_url,
      content: trimmed,
      reply_to_id: prev?.id || null,
      reply_to_content: prev?.content || null,
      reply_to_sender: prev?.sender_name || null,
    });

    if (error) {
      toast.error('فشل إرسال الرسالة');
      setMessages(p => p.filter(m => m.id !== optimistic.id));
    }
  };

  const togglePin = async (msg: ChatMessage) => {
    await supabase.from('chat_messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
    setMessages(p => p.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m));
    toast.success(msg.is_pinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الرسالة ✅');
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('chat_messages').delete().eq('id', msgId);
    setMessages(p => p.filter(m => m.id !== msgId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const canPin = profile?.role && ['president','vice_president','office_head'].includes(profile.role);
  const pinnedMessages = messages.filter(m => m.is_pinned);

  const filteredRooms = rooms.filter(r => {
    const cfg = OFFICE_CONFIG[r.office || r.type];
    return !roomSearch || (cfg?.label || r.name).includes(roomSearch);
  });

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  if (isStudent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageSquare size={36} className="opacity-30" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">المحادثات مقفلة</p>
          <p className="text-sm mt-1">المحادثات متاحة لأعضاء الهيئة فقط</p>
        </div>
      </div>
    );
  }

  const activeCfg = activeRoom ? (OFFICE_CONFIG[activeRoom.office || activeRoom.type] || OFFICE_CONFIG.general) : null;

  return (
    <div className="h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden border border-border shadow-xl animate-fade-in" style={{ direction: 'rtl' }}>

      {/* ── Rooms Sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`
        fixed top-0 right-0 h-full z-50 w-72
        lg:relative lg:z-auto lg:flex lg:flex-col lg:w-72 lg:shrink-0
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0 flex flex-col' : 'translate-x-full lg:translate-x-0'}
      `} style={{ background: 'linear-gradient(160deg, #0a2314 0%, #0f3d20 50%, #1a5530 100%)' }}>

        {/* Sidebar header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Hash size={18} className="text-green-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">غرف المحادثة</p>
            <p className="text-green-400 text-xs">{rooms.length} غرفة نشطة</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Search rooms */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={roomSearch} onChange={e => setRoomSearch(e.target.value)}
              placeholder="بحث..." className="w-full bg-white/10 text-white text-xs placeholder:text-white/30 pr-8 pl-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-green-400/50"
            />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {/* General first */}
          {filteredRooms.filter(r => r.type === 'general').map(room => (
            <RoomItem key={room.id} room={room} active={activeRoom?.id === room.id}
              onClick={() => { setActiveRoom(room); setSidebarOpen(false); }}
              lastMsg={messages.filter(m => m.room_id === room.id).at(-1)} />
          ))}

          {filteredRooms.filter(r => r.type !== 'general').length > 0 && (
            <div className="px-2 pt-3 pb-1">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">المكاتب</p>
            </div>
          )}
          {filteredRooms.filter(r => r.type !== 'general').map(room => (
            <RoomItem key={room.id} room={room} active={activeRoom?.id === room.id}
              onClick={() => { setActiveRoom(room); setSidebarOpen(false); }}
              lastMsg={messages.filter(m => m.room_id === room.id).at(-1)} />
          ))}
        </div>

        {/* User info */}
        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(profile?.username || profile?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{profile?.username || profile?.email}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <p className="text-green-400 text-[10px]">متصل</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]" style={{ direction: 'rtl' }}>

        {/* Chat Header */}
        <div className="h-14 flex items-center justify-between px-4 shrink-0 shadow-sm" style={{ background: '#fff' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
            {activeCfg && activeRoom ? (
              <>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ background: activeCfg.bg }}>
                  {activeCfg.emoji}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{activeCfg.label}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={10} />
                    {messages.length > 0 ? `${messages.length} رسالة` : 'ابدأ المحادثة'}
                  </p>
                </div>
              </>
            ) : <p className="text-gray-400 text-sm">اختر غرفة للبدء</p>}
          </div>

          <div className="flex items-center gap-2">
            {pinnedMessages.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                <Pin size={11} />
                <span>{pinnedMessages.length} مثبتة</span>
              </div>
            )}
          </div>
        </div>

        {/* Pinned banner */}
        {pinnedMessages.length > 0 && (
          <div className="bg-white border-b border-amber-100 px-4 py-2 flex items-center gap-2 shrink-0">
            <Pin size={13} className="text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-amber-700">{pinnedMessages.at(-1)?.sender_name}: </span>
              <span className="text-xs text-gray-600 truncate">{pinnedMessages.at(-1)?.content}</span>
            </div>
            <span className="text-xs text-amber-500 shrink-0">{pinnedMessages.length > 1 ? `+${pinnedMessages.length - 1}` : ''}</span>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d6c8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}>
          {!activeRoom ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                <MessageSquare size={40} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">اختر غرفة للبدء</p>
              <p className="text-sm">استخدم القائمة على اليمين للتنقل بين غرف المحادثة</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg bg-white" style={{ background: activeCfg?.bg }}>
                {activeCfg?.emoji}
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700">{activeCfg?.label}</p>
                <p className="text-sm text-gray-400 mt-1">لا توجد رسائل بعد — كن الأول!</p>
              </div>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dayMsgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 bg-[#f0f2f5] px-3 py-1 rounded-full border border-gray-200">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {dayMsgs.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const isTemp = msg.id.startsWith('temp-');
                  const isHovered = hoveredMsg === msg.id;

                  return (
                    <div key={msg.id}
                      className={`flex gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => { setHoveredMsg(null); setShowEmoji(null); }}>

                      {/* Avatar */}
                      {!isOwn && (
                        <div className="shrink-0 self-end mb-1">
                          {msg.sender_avatar ? (
                            <img src={msg.sender_avatar} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                              style={{ background: activeCfg?.color || '#1a6b3a' }}>
                              {msg.sender_name.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[65%] sm:max-w-[55%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Sender name (others only) */}
                        {!isOwn && (
                          <span className="text-[11px] font-semibold mb-1 px-1" style={{ color: activeCfg?.color }}>
                            {msg.sender_name}
                          </span>
                        )}

                        {/* Reply preview */}
                        {msg.reply_to_content && (
                          <div className={`text-xs mb-1 px-3 py-2 rounded-xl border-r-4 max-w-full ${
                            isOwn ? 'bg-white/20 border-white/60 text-white/90' : 'bg-white border-green-500 text-gray-600'
                          }`} style={isOwn ? { borderColor: 'rgba(255,255,255,0.5)' } : { borderColor: activeCfg?.color }}>
                            <p className="font-bold text-[10px] mb-0.5" style={isOwn ? { color: 'rgba(255,255,255,0.8)' } : { color: activeCfg?.color }}>{msg.reply_to_sender}</p>
                            <p className="line-clamp-1 opacity-80">{msg.reply_to_content}</p>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`relative px-3.5 py-2 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${
                          isOwn
                            ? 'text-white rounded-tl-sm'
                            : 'bg-white text-gray-900 rounded-tr-sm'
                        } ${isTemp ? 'opacity-60' : ''}`}
                          style={isOwn ? { background: activeCfg?.color || '#1a6b3a' } : {}}>

                          {msg.is_pinned && (
                            <Pin size={10} className={`inline ml-1.5 ${isOwn ? 'text-white/50' : 'text-amber-500'}`} />
                          )}
                          <span>{msg.content}</span>

                          {/* Time + status */}
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              isTemp
                                ? <Check size={11} className="text-white/40" />
                                : <CheckCheck size={11} className="text-white/70" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className={`self-center flex gap-0.5 transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                        <ActionBtn title="رد" onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}>
                          <Reply size={13} />
                        </ActionBtn>
                        {canPin && (
                          <ActionBtn title={msg.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'} onClick={() => togglePin(msg)}
                            active={msg.is_pinned}>
                            <Pin size={13} />
                          </ActionBtn>
                        )}
                        {isOwn && (
                          <ActionBtn title="حذف" onClick={() => deleteMessage(msg.id)} danger>
                            <Trash2 size={13} />
                          </ActionBtn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview bar */}
        {replyTo && (
          <div className="mx-0 bg-white border-t border-gray-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
            <div className="w-1 h-10 rounded-full shrink-0" style={{ background: activeCfg?.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: activeCfg?.color }}>{replyTo.sender_name}</p>
              <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Input area */}
        {activeRoom ? (
          <div className="px-3 py-3 bg-[#f0f2f5] border-t border-gray-200 shrink-0">
            <div className="flex items-end gap-2">
              <div className="flex-1 flex items-end bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={content}
                  onChange={e => {
                    setContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالة..."
                  rows={1}
                  className="flex-1 resize-none px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent leading-relaxed"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!content.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95 shadow-md shrink-0"
                style={{ background: content.trim() ? (activeCfg?.color || '#1a6b3a') : '#9ca3af' }}>
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 pr-1">Enter للإرسال · Shift+Enter للسطر الجديد</p>
          </div>
        ) : (
          <div className="p-4 bg-[#f0f2f5] border-t border-gray-200 text-center text-sm text-gray-400 shrink-0">
            <Lock size={14} className="inline ml-1" />
            اختر غرفة محادثة للبدء
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────

const RoomItem = ({ room, active, onClick, lastMsg }: {
  room: ChatRoom; active: boolean; onClick: () => void; lastMsg?: ChatMessage;
}) => {
  const cfg = OFFICE_CONFIG[room.office || room.type] || OFFICE_CONFIG.general;
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all duration-200 ${
      active ? 'bg-white/15 shadow-sm' : 'hover:bg-white/8'
    }`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
        style={{ background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }}>
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-white/80'}`}>{cfg.label}</p>
        {lastMsg ? (
          <p className="text-[11px] text-white/40 truncate">{lastMsg.content}</p>
        ) : (
          <p className="text-[11px] text-white/30">لا توجد رسائل بعد</p>
        )}
      </div>
      {active && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
    </button>
  );
};

const ActionBtn = ({ children, onClick, title, active, danger }: {
  children: React.ReactNode; onClick: () => void; title: string; active?: boolean; danger?: boolean;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-all duration-150 ${
      danger ? 'hover:bg-red-100 text-gray-400 hover:text-red-500'
      : active ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
      : 'bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700'
    } shadow-sm border border-gray-100`}>
    {children}
  </button>
);

export default ChatPage;
