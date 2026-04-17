import { Calendar, User, Flag } from 'lucide-react';
import type { Task } from '@/types';
import { OFFICES } from '@/lib/mockData';

const PRIORITY_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  low: { label: 'منخفضة', cls: 'text-gray-500 bg-gray-50', icon: '●' },
  medium: { label: 'متوسطة', cls: 'text-blue-600 bg-blue-50', icon: '●' },
  high: { label: 'عالية', cls: 'text-orange-600 bg-orange-50', icon: '●' },
  urgent: { label: 'عاجلة', cls: 'text-red-600 bg-red-50', icon: '●' },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'status-new' },
  in_progress: { label: 'قيد التنفيذ', cls: 'status-processing' },
  review: { label: 'بانتظار المراجعة', cls: 'status-pending' },
  completed: { label: 'مكتملة', cls: 'status-solved' },
  late: { label: 'متأخرة', cls: 'bg-red-100 text-red-700' },
};

interface Props {
  task: Task;
  onClick?: () => void;
}

const TaskCard = ({ task, onClick }: Props) => {
  const priority = PRIORITY_MAP[task.priority];
  const status = STATUS_MAP[task.status];
  const isLate = task.status === 'late';

  return (
    <div
      onClick={onClick}
      className={`glass-card-light rounded-2xl p-4 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${isLate ? 'border-red-200' : 'border-gray-100'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`status-badge ${status.cls}`}>{status.label}</span>
            <span className={`status-badge text-xs px-2 py-0.5 ${priority.cls} rounded-full font-medium`}>
              <Flag size={9} className="inline ml-1" />{priority.label}
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm leading-snug">{task.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">الإنجاز</span>
              <span className="text-xs font-semibold text-primary">{task.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${task.completionRate === 100 ? 'bg-green-500' : isLate ? 'bg-red-400' : 'bg-primary'}`}
                style={{ width: `${task.completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User size={11} />{task.assignedTo.split(' ')[0]}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />{new Date(task.dueDate).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })}</span>
            <span className="text-primary">{OFFICES[task.office]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
