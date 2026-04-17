import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import type { Complaint } from '@/types';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'status-new' },
  processing: { label: 'قيد المعالجة', cls: 'status-processing' },
  transferred: { label: 'محولة', cls: 'status-pending' },
  solved: { label: 'تم الحل', cls: 'status-solved' },
  closed: { label: 'مغلقة', cls: 'status-closed' },
};

interface Props {
  complaint: Complaint;
  onClick?: () => void;
}

const ComplaintCard = ({ complaint, onClick }: Props) => {
  const status = STATUS_MAP[complaint.status];
  const date = new Date(complaint.createdAt).toLocaleDateString('ar-SY', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div
      onClick={onClick}
      className="glass-card-light rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`status-badge ${status.cls}`}>{status.label}</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{complaint.type}</span>
          </div>
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{complaint.title}</h3>
          <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2">{complaint.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock size={11} />{date}</span>
            {complaint.location && <span className="flex items-center gap-1"><MapPin size={11} />{complaint.location}</span>}
            <span>#{complaint.id}</span>
          </div>
        </div>
        <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0 rotate-180" />
      </div>
    </div>
  );
};

export default ComplaintCard;
