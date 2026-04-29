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
  onMoveMeeting: (id: string, newDate: Date) => void;
}

export default function Calendar({ meetings, onEditMeeting, onDeleteMeeting, onMoveMeeting }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedMeetingId, setDraggedMeetingId] = useState<string | null>(null);

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

  const handleDragStart = (id: string) => {
    setDraggedMeetingId(id);
  };

  const handleDrop = (day: Date) => {
    if (draggedMeetingId) {
      onMoveMeeting(draggedMeetingId, day);
      setDraggedMeetingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newYear);
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentMonth);
    newDate.setMonth(newMonth);
    setCurrentMonth(newDate);
  };

  return (
    <div className="dashboard-card overflow-hidden flex flex-col h-full bg-white border border-slate-50 min-h-[500px]">
      <div className="accent-line !bg-slate-200"></div>
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <select 
              value={currentMonth.getFullYear()} 
              onChange={handleYearChange}
              className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer hover:text-medical-primary transition-colors"
            >
              {[2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <select 
              value={currentMonth.getMonth()} 
              onChange={handleMonthChange}
              className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer hover:text-medical-primary transition-colors"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider">MEDICAL MEETING SCHEDULE</p>
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
            className="px-4 py-1.5 text-xs font-bold border border-sky-100 bg-sky-50 text-medical-primary hover:bg-sky-100 rounded-xl transition-all shadow-sm"
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
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(day)}
              className={cn(
                "min-h-[100px] border-r border-b border-slate-100 p-1.5 flex flex-col transition-all group",
                !isCurrentMonth ? "bg-slate-50/20 text-slate-200" : "bg-white hover:bg-slate-50/30",
                draggedMeetingId && isCurrentMonth && "bg-sky-50/50",
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
                {dayMeetings.map((meeting) => {
                  const isHighlight = meeting.content === '口醫部科會' || meeting.content === '教學行政會議';
                  return (
                    <div
                      key={meeting.id}
                      draggable
                      onDragStart={() => handleDragStart(meeting.id)}
                      onClick={() => onEditMeeting(meeting)}
                      className={cn(
                        "cursor-move p-1.5 rounded-lg text-[9px] leading-tight font-bold transition-all truncate border",
                        isHighlight 
                          ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm animate-pulse" 
                          : "bg-medical-primary/5 hover:bg-medical-primary/10 text-medical-primary border-medical-primary/10",
                        draggedMeetingId === meeting.id && "opacity-50"
                      )}
                    >
                      {meeting.content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
