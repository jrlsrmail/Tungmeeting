import React from 'react';
import { format, isAfter, startOfToday } from 'date-fns';
import { Trash2, Edit2, Clock } from 'lucide-react';
import { Meeting } from './types';
import { cn } from './lib/utils';

interface RecentMeetingsListProps {
  meetings: Meeting[];
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
}

export default function RecentMeetingsList({ meetings, onEdit, onDelete }: RecentMeetingsListProps) {
  const today = startOfToday();
  const upcomingMeetings = meetings
    .filter(m => isAfter(new Date(m.date), today) || format(new Date(m.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-card bg-white border border-slate-100 flex flex-col h-full">
      <div className="accent-line !bg-slate-300"></div>
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">近期會議清單</h2>
      
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-hide">
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            目前暫無近期會議
          </div>
        ) : (
          upcomingMeetings.map((meeting) => (
            <div 
              key={meeting.id}
              className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center group transition-all hover:bg-sky-50/50 hover:border-sky-100"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] text-medical-primary font-bold font-mono flex items-center gap-1">
                  <Clock size={10} />
                  {format(new Date(meeting.date), 'yyyy.MM.dd')} {meeting.startTime}
                </span>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {meeting.department}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {meeting.content}
                </span>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(meeting)}
                  className="p-2 bg-white border border-slate-200 hover:bg-sky-100 hover:border-sky-200 text-slate-400 hover:text-medical-primary rounded-xl transition-all"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('確定刪除？')) onDelete(meeting.id);
                  }}
                  className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">共 {meetings.length} 場會議</span>
        <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center shadow-lg shadow-sky-100 text-white cursor-pointer hover:bg-medical-secondary transition-all">
          <span className="text-xl leading-none">+</span>
        </div>
      </div>
    </div>
  );
}
