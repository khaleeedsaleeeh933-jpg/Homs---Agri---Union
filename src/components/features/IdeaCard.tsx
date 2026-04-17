import { ThumbsUp, MessageCircle, Tag } from 'lucide-react';
import type { Idea } from '@/types';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'قيد الانتظار', cls: 'bg-gray-100 text-gray-600' },
  studying: { label: 'قيد الدراسة', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'قيد التنفيذ', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'مرفوضة', cls: 'bg-red-100 text-red-700' },
  completed: { label: 'منجزة', cls: 'bg-green-100 text-green-700' },
};

interface Props {
  idea: Idea;
  onVote?: (id: string) => void;
  onClick?: () => void;
  isAdmin?: boolean;
}

const IdeaCard = ({ idea, onVote, onClick, isAdmin }: Props) => {
  const status = STATUS_MAP[idea.status];

  return (
    <div className="glass-card-light rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`status-badge ${status.cls}`}>{status.label}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
              <Tag size={10} />{idea.category}
            </span>
          </div>
          <h3 className="font-bold text-foreground mb-1.5 cursor-pointer hover:text-primary transition-colors" onClick={onClick}>{idea.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{idea.description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {idea.isAnonymous ? 'مجهول' : idea.submittedBy} · {new Date(idea.createdAt).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onVote?.(idea.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              idea.hasVoted
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <ThumbsUp size={14} />
            <span>{idea.votes}</span>
          </button>
          <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <MessageCircle size={14} />
            <span>{idea.comments.length}</span>
          </button>
        </div>
        {isAdmin && idea.status !== 'in_progress' && idea.status !== 'completed' && (
          <button
            onClick={onClick}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-all font-medium"
          >
            تحويل لمهمة
          </button>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;
