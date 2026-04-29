import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Meeting } from './types';
import { cn } from './lib/utils';

interface CalendarProps {
  meetings: Meeting[];
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
}

export default function Calendar({ meetings, onEditMeeting, onDeleteMeeting }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(m => isSameDay(new Date(m.date), day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="dashboard-card overflow-hidden flex flex-col h-full bg-white border border-slate-50 min-h-[500px]">
      <div className="accent-line !bg-slate-200"></div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {format(currentMonth, 'yyyy年 MMMM', { locale: undefined })}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">會議排程預覽</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all text-slate-600 active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-1.5 text-xs font-bold border border-sky-100 bg-sky-50 text-medical-primary hover:bg-sky-100 rounded-xl transition-all"
          >
            今天
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all text-slate-600 active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 border-l border-t border-slate-100 rounded-lg overflow-hidden">
        {days.map((day, idx) => {
          const dayMeetings = getMeetingsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[100px] border-r border-b border-slate-100 p-1.5 flex flex-col transition-all group",
                !isCurrentMonth ? "bg-slate-50/20 text-slate-200" : "bg-white hover:bg-slate-50/30",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg leading-none transition-all",
                  isToday(day) ? "bg-medical-primary text-white shadow-md shadow-sky-100" : isCurrentMonth ? "text-slate-400" : "text-slate-200"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 mt-2 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => onEditMeeting(meeting)}
                    className="cursor-pointer p-1.5 rounded-lg bg-medical-primary/5 hover:bg-medical-primary/10 text-medical-primary text-[9px] leading-tight font-bold transition-all truncate border border-medical-primary/10"
                  >
                    {meeting.content}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
