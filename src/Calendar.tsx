import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Meeting, Department } from './types';
import { cn } from './lib/utils';

interface CalendarProps {
  meetings: Meeting[];
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onMoveMeeting: (id: string, newDate: Date) => void;
  onDateClick: (date: Date) => void;
}

export default function Calendar({ meetings, onEditMeeting, onDeleteMeeting, onMoveMeeting, onDateClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedMeetingId, setDraggedMeetingId] = useState<string | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getDayMeetings = (day: Date) => {
    return meetings
      .filter((m) => isSameDay(new Date(m.date), day))
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
    <div id="calendar-container" className="dashboard-card overflow-hidden flex flex-col bg-medical-surface border border-medical-border">
      <div className="accent-line !bg-amber-200"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">
        <div className="flex items-center gap-2">
          <select 
            value={currentMonth.getFullYear()} 
            onChange={handleYearChange}
            className="text-2xl font-black text-slate-800 bg-transparent border-none outline-none cursor-pointer hover:text-medical-primary transition-colors focus:ring-0"
          >
            {[2026, 2027, 2028, 2029, 2030].map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
          <select 
            value={currentMonth.getMonth()} 
            onChange={handleMonthChange}
            className="text-2xl font-black text-slate-800 bg-transparent border-none outline-none cursor-pointer hover:text-medical-primary transition-colors focus:ring-0"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>{i + 1}月</option>
            ))}
          </select>
        </div>

        <div className="md:absolute md:left-1/2 md:-translate-x-1/2 text-center">
          <p className="text-2xl font-black text-black tracking-tight">口腔醫學部 教學活動表</p>
        </div>

        <div id="calendar-controls" className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors border border-slate-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-1.5 text-xs font-bold border border-amber-100 bg-amber-50 text-medical-primary hover:bg-amber-100 rounded-xl transition-all shadow-sm"
          >
            今天
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors border border-slate-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map((day) => (
          <div
            key={day}
            className="py-4 text-center text-sm font-black text-slate-900 bg-slate-200 border-r border-slate-300 border-b border-slate-300 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayMeetings = getDayMeetings(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              onClick={() => onDateClick(day)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(day)}
              className={cn(
                "min-h-[120px] border-r border-b border-slate-100 p-1.5 flex flex-col transition-all group cursor-pointer",
                !isCurrentMonth ? "bg-slate-50/10 text-slate-200 other-month-day" : "bg-medical-surface hover:bg-amber-50/50",
                draggedMeetingId && isCurrentMonth && "bg-amber-50/50",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-base font-bold w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                    isToday ? "bg-medical-primary text-white shadow-md shadow-amber-100" : "text-slate-500",
                    !isCurrentMonth && "opacity-20"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 mt-1 scrollbar-hide">
                {dayMeetings.map((meeting) => {
                  const isRed = meeting.department === Department.ADMIN && 
                    ['口醫部科會', '教學行政會議', '親善之家會議'].includes(meeting.content);
                  const isGreen = meeting.department === Department.CROSS_DEPT && 
                    meeting.content === '跨科臨床病例討論會';
                  
                  return (
                    <div
                      key={meeting.id}
                      draggable
                      onDragStart={() => handleDragStart(meeting.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMeeting(meeting);
                      }}
                      className={cn(
                        "cursor-move p-2 rounded-lg text-[10px] leading-snug font-bold transition-all border-2",
                        isRed && "bg-rose-100 border-rose-400 text-rose-800 shadow-sm",
                        isGreen && "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm",
                        !isRed && !isGreen && "bg-amber-100 border-amber-300 text-slate-900 shadow-sm",
                        draggedMeetingId === meeting.id && "opacity-50",
                        !isCurrentMonth && "other-month-event"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center border-b border-current border-opacity-30 pb-0.5 mb-1 font-black text-[10px]">
                           <span>[{meeting.department}]</span>
                           <span>{meeting.startTime}</span>
                        </div>
                        <div className="font-black mb-1 break-words leading-tight text-xs">{meeting.content}</div>
                        {meeting.topic && (
                          <div className="italic text-[9px] text-slate-800 break-words leading-tight mb-1 font-extrabold border-l-2 border-current pl-1"># {meeting.topic}</div>
                        )}
                        <div className="space-y-0.5 text-[9px]">
                          {meeting.location && (
                            <div className="text-slate-900 break-words leading-tight font-bold">📍 {meeting.location}</div>
                          )}
                          {meeting.advisors && meeting.advisors.length > 0 && (
                            <div className="text-slate-900 break-words leading-tight font-bold">👨‍🏫 {meeting.advisors.join(', ')}</div>
                          )}
                          {meeting.presenter && (
                            <div className="text-slate-900 break-words leading-tight font-bold">🎤 {meeting.presenter}</div>
                          )}
                          {meeting.recorder && (
                            <div className="text-slate-900 break-words leading-tight font-bold">✍️ {meeting.recorder}</div>
                          )}
                        </div>
                      </div>
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
