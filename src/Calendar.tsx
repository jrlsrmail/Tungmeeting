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
    <div className="dashboard-card overflow-hidden flex flex-col h-full bg-medical-surface border border-medical-border min-h-[500px]">
      <div className="accent-line !bg-amber-200"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
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
          <p className="text-xs text-slate-400 font-bold tracking-wider">MEETING SCHEDULE</p>
        </div>
        <div className="flex gap-2">
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

      <div className="flex-1 grid grid-cols-7 border-t border-l border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map((day) => (
          <div
            key={day}
            className="py-4 text-center text-sm font-black text-slate-500 bg-slate-50/50 border-r border-slate-100 border-b border-slate-100 uppercase tracking-widest"
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
                !isCurrentMonth ? "bg-slate-50/20 text-slate-200" : "bg-medical-surface hover:bg-amber-50/50",
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
              
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[140px] scrollbar-hide">
                {dayMeetings.map((meeting) => {
                  const isHighlight = meeting.content === '口醫部科會' || meeting.content === '教學行政會議';
                  const isGrandRound = meeting.department === Department.GRAND_ROUND;
                  
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
                        "cursor-move p-2 rounded-lg text-xs leading-snug font-bold transition-all border",
                        isHighlight 
                          ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm" 
                          : "bg-medical-primary/5 hover:bg-medical-primary/10 text-medical-primary border-medical-primary/10",
                        draggedMeetingId === meeting.id && "opacity-50"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center border-b border-current border-opacity-10 pb-0.5 mb-0.5">
                           <span>[{meeting.department}]</span>
                           <span>{meeting.startTime}</span>
                        </div>
                        <div className="truncate font-black">{meeting.content}</div>
                        {isGrandRound && meeting.topic && (
                          <div className="truncate italic text-[7px] text-slate-400"># {meeting.topic}</div>
                        )}
                        {meeting.location && (
                          <div className="truncate text-slate-500">📍 {meeting.location}</div>
                        )}
                        {meeting.advisors && meeting.advisors.length > 0 && (
                          <div className="truncate text-slate-500">👨‍🏫 {meeting.advisors.join(', ')}</div>
                        )}
                        {meeting.presenter && (
                          <div className="truncate text-slate-500">🎤 {meeting.presenter}</div>
                        )}
                        {meeting.recorder && (
                          <div className="truncate text-slate-500">✍️ {meeting.recorder}</div>
                        )}
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
