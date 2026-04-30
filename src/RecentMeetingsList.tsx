import React, { useState } from 'react';
import { format, isAfter, startOfToday } from 'date-fns';
import { Trash2, Edit2, Clock, X, MapPin, User, Users, Info, Type, Hospital } from 'lucide-react';
import { Meeting, Department } from './types';
import { cn } from './lib/utils';

interface RecentMeetingsListProps {
  meetings: Meeting[];
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  onDeleteSeries: (groupId: string) => void;
}

export default function RecentMeetingsList({ 
  meetings, 
  onEdit, 
  onDelete,
  onDeleteSeries
}: RecentMeetingsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const today = startOfToday();
  const upcomingMeetings = meetings
    .filter(m => isAfter(new Date(m.date), today) || format(new Date(m.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="accent-line !bg-medical-accent"></div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <Clock size={18} className="text-medical-accent" /> 近期排定會議
          </h3>
          <p className="text-xs text-slate-400 font-medium">UPCOMING MEETINGS</p>
        </div>
      </div>

      <div className="space-y-3">
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <CalendarIcon className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-xs text-slate-400 font-medium">目前尚無排定會議</p>
          </div>
        ) : (
          upcomingMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 bg-amber-100/30 border border-amber-100 rounded-2xl flex flex-col gap-3 group transition-all hover:bg-amber-100/50 hover:shadow-lg hover:shadow-amber-200/50 hover:border-amber-200"
            >
              {deletingId === meeting.id ? (
                <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600">確定刪除此項？</span>
                    <button onClick={() => setDeletingId(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(meeting.id);
                        setDeletingId(null);
                      }}
                      className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[9px] font-bold rounded-lg transition-colors border border-rose-200"
                    >
                      僅刪除此場
                    </button>
                    {meeting.groupId && (
                      <button
                        onClick={() => {
                          onDeleteSeries(meeting.groupId!);
                          setDeletingId(null);
                        }}
                        className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold rounded-lg transition-colors shadow-sm"
                      >
                        刪除整個系列
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full uppercase">
                          {format(new Date(meeting.date), 'yyyy.MM.dd')}
                        </span>
                        <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                          {meeting.startTime} - {meeting.endTime}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 mt-1">
                        <span className="text-medical-primary">[{meeting.department}]</span>
                        {meeting.content}
                      </h4>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onEdit(meeting)}
                        className="p-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-200 text-slate-400 hover:text-medical-primary rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(meeting.id)}
                        className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 border-t border-slate-100 pt-4 text-sm">
                    {meeting.topic && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Type size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-700 truncate">主題：{meeting.topic}</span>
                      </div>
                    )}
                    {meeting.location && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate font-bold text-slate-900">地點：{meeting.location}</span>
                      </div>
                    )}
                    {meeting.advisors && meeting.advisors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Users size={14} className="text-slate-400" />
                        <span className="truncate font-bold text-slate-900">指導：{meeting.advisors.join(', ')}</span>
                      </div>
                    )}
                    {meeting.presenter && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User size={14} className="text-slate-400" />
                        <span className="truncate font-bold text-slate-900">報告：{meeting.presenter}</span>
                      </div>
                    )}
                    {meeting.recorder && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User size={14} className="text-slate-400" />
                        <span className="truncate font-bold text-slate-900">紀錄：{meeting.recorder}</span>
                      </div>
                    )}
                    {meeting.remarks && (
                      <div className="col-span-full flex items-start gap-1.5 text-slate-500 mt-1 italic">
                        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="font-bold text-slate-700">備註：{meeting.remarks}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper to keep icons imported
function CalendarIcon({ className, size }: { className?: string, size?: number }) {
  return <Hospital className={className} size={size} />;
}
