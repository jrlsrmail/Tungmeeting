import React, { useState, useEffect } from 'react';
import { format, addMonths, addWeeks, setHours, setMinutes, startOfWeek, addDays, getDay } from 'date-fns';
import { Plus, X, Calendar as CalendarIcon, Clock, Trash2, Save } from 'lucide-react';
import { Department, DEPARTMENT_CONTENTS, Frequency, Meeting } from './types';
import { cn } from './lib/utils';

interface MeetingFormProps {
  onAddMeetings: (meetings: Meeting[]) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onDeleteSeries: (groupId: string) => void;
  editingMeeting: Meeting | null;
  onCancelEdit: () => void;
}

const DAYS_OF_WEEK = [
  { label: '週一', value: 1 },
  { label: '週二', value: 2 },
  { label: '週三', value: 3 },
  { label: '週四', value: 4 },
  { label: '週五', value: 5 },
  { label: '週六', value: 6 },
  { label: '週日', value: 0 },
];

export default function MeetingForm({ 
  onAddMeetings, 
  onUpdateMeeting, 
  onDeleteMeeting,
  onDeleteSeries,
  editingMeeting, 
  onCancelEdit 
}: MeetingFormProps) {
  const [department, setDepartment] = useState<Department>(Department.ADMIN);
  const [content, setContent] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [frequency, setFrequency] = useState<Frequency>(Frequency.SPECIFIC);
  const [selectedDay, setSelectedDay] = useState<number>(3); // Default Wednesday
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { h, m };
  };

  const handleTimeChange = (type: 'start' | 'end', part: 'h' | 'm', value: string) => {
    const current = type === 'start' ? parseTime(startTime) : parseTime(endTime);
    const newVal = value.padStart(2, '0');
    const newTimeStr = part === 'h' ? `${newVal}:${current.m.toString().padStart(2, '0')}` : `${current.h.toString().padStart(2, '0')}:${newVal}`;
    if (type === 'start') setStartTime(newTimeStr);
    else setEndTime(newTimeStr);
  };

  const TimeSelect = ({ label, value, onChange }: { label: string, value: string, onChange: (part: 'h' | 'm', val: string) => void }) => {
    const { h, m } = parseTime(value);
    return (
      <div className="space-y-1.5 flex-1">
        <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          <Clock size={12} /> {label}
        </label>
        <div className="flex gap-1">
          <select 
            value={h} 
            onChange={(e) => onChange('h', e.target.value)}
            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
            ))}
          </select>
          <select 
            value={m} 
            onChange={(e) => onChange('m', e.target.value)}
            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500"
          >
            {['00', '10', '20', '30', '40', '50'].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (editingMeeting) {
      setDepartment(editingMeeting.department);
      const possibleContents = DEPARTMENT_CONTENTS[editingMeeting.department];
      if (possibleContents.includes(editingMeeting.content)) {
        setContent(editingMeeting.content);
        setCustomContent('');
      } else {
        setContent('其他');
        setCustomContent(editingMeeting.content);
      }
      setFrequency(Frequency.SPECIFIC);
      setStartDate(format(new Date(editingMeeting.date), 'yyyy-MM-dd'));
      setStartTime(editingMeeting.startTime);
      setEndTime(editingMeeting.endTime);
    } else {
      // Default reset
      setDepartment(Department.ADMIN);
      setContent(DEPARTMENT_CONTENTS[Department.ADMIN][0]);
      setCustomContent('');
      setFrequency(Frequency.SPECIFIC);
    }
  }, [editingMeeting]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value as Department;
    setDepartment(dept);
    const contents = DEPARTMENT_CONTENTS[dept];
    if (contents.length > 0) {
      setContent(contents[0]);
    } else {
      setContent('其他');
    }
  };

  const generateMeetings = () => {
    const finalContent = content === '其他' || department === Department.OTHER ? customContent : content;
    if (!finalContent) return;

    if (editingMeeting) {
      onUpdateMeeting({
        ...editingMeeting,
        department,
        content: finalContent,
        date: new Date(startDate),
        startTime,
        endTime,
      });
      onCancelEdit();
      return;
    }

    const firstDate = new Date(startDate);
    const meetings: Meeting[] = [];
    const groupId = crypto.randomUUID();

    if (frequency === Frequency.SPECIFIC) {
      meetings.push({
        id: crypto.randomUUID(),
        department,
        content: finalContent,
        date: firstDate,
        startTime,
        endTime,
        isAutoGenerated: false,
      });
    } else {
      let count = 0;
      let currentDate = firstDate;

      // If any recurring frequency, find the first occurrence of the selected day on or after startDate
      if (frequency !== Frequency.SPECIFIC) {
        let diff = selectedDay - getDay(currentDate);
        if (diff < 0) diff += 7;
        currentDate = addDays(currentDate, diff);
      }

      // Generate for the next 12 months (or more for Yearly)
      const monthsToGenerate = frequency === Frequency.EVERY_YEAR ? 36 : 12; // 3 years for yearly
      const endGenDate = addMonths(firstDate, monthsToGenerate);

      while (currentDate < endGenDate) {
        if (frequency === Frequency.ONCE_A_MONTH) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          currentDate = addMonths(currentDate, 1);
          // After moving monthly, we need to realign to the selected day of week
          // In this simple mode, we just find the nearest selectedDay in that new month
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.TWICE_A_MONTH) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          meetings.push(createMeeting(addWeeks(currentDate, 2), finalContent, groupId));
          currentDate = addMonths(currentDate, 1);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.ONCE_EVERY_TWO_MONTHS) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          currentDate = addMonths(currentDate, 2);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.ONCE_A_QUARTER) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          currentDate = addMonths(currentDate, 3);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.WEEKLY) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          currentDate = addWeeks(currentDate, 1);
        } else if (frequency === Frequency.EVERY_YEAR) {
          meetings.push(createMeeting(currentDate, finalContent, groupId));
          currentDate = addMonths(currentDate, 12);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        }
        
        count++;
        if (count > 60) break; // Safety break
      }
    }

    onAddMeetings(meetings);
  };

  const createMeeting = (date: Date, meetingContent: string, groupId: string): Meeting => {
    return {
      id: crypto.randomUUID(),
      department,
      content: meetingContent,
      date: new Date(date),
      startTime,
      endTime,
      isAutoGenerated: true,
      groupId
    };
  };

  return (
    <div className="dashboard-card space-y-6">
      <div className="accent-line !bg-medical-primary"></div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
          {editingMeeting ? <Save size={16} className="text-medical-primary" /> : <Plus size={16} className="text-medical-primary" />}
          {editingMeeting ? '編輯會議內容' : '1. 選擇會議項目'}
        </h3>
        {editingMeeting && (
          <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Department Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">主責科別</label>
          <select
            value={department}
            onChange={handleDepartmentChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
          >
            {Object.values(Department).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Content Selection */}
        {department !== Department.OTHER && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">會議內容</label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENT_CONTENTS[department].map(c => (
                <div 
                  key={c}
                  onClick={() => setContent(c)}
                  className={cn(
                    "p-2 text-[11px] border rounded-xl cursor-pointer transition-all text-center flex items-center justify-center min-h-[40px]",
                    content === c 
                      ? "bg-sky-50 border-medical-border text-medical-primary font-bold shadow-inner" 
                      : "border-slate-50 hover:bg-slate-50 text-slate-500"
                  )}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Content Input */}
        {(content === '其他' || department === Department.OTHER) && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">自定義內容</label>
            <input
              type="text"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="請輸入會議內容"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all"
            />
          </div>
        )}

        <hr className="border-slate-100 my-6" />

        <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold">2. 時間與頻率設定</h2>

        {/* Frequency & Time */}
        {!editingMeeting && (
          <div className="p-3 border-2 border-sky-100 bg-sky-50/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700">頻率模式</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(Frequency).map(f => (
                <button 
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "py-2 px-1 text-[10px] rounded border transition-all",
                    frequency === f
                      ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Day of Week Selection for Recurring */}
            {frequency !== Frequency.SPECIFIC && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-[10px] font-bold text-sky-700 block mb-1.5 flex items-center gap-1">
                  固定於每週的這一天
                </label>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setSelectedDay(day.value)}
                      className={cn(
                        "flex-1 min-w-[40px] py-1.5 text-[10px] rounded-lg border transition-all",
                        selectedDay === day.value
                          ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-sky-200"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <CalendarIcon size={12} /> {frequency === Frequency.SPECIFIC ? '日期' : '開始月份/日期'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <TimeSelect 
              label="開始" 
              value={startTime} 
              onChange={(p, v) => handleTimeChange('start', p, v)} 
            />
            <TimeSelect 
              label="結束" 
              value={endTime} 
              onChange={(p, v) => handleTimeChange('end', p, v)} 
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={generateMeetings}
            className="w-full btn-medical py-3"
          >
            {editingMeeting ? <Save size={18} /> : <Plus size={18} />}
            {editingMeeting ? '儲存變更' : (frequency === Frequency.SPECIFIC ? '新增此場會議' : '依頻率產生排程')}
          </button>
          
          {editingMeeting && (
            <div className="space-y-2 border-t border-slate-100 pt-4 mt-2">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-100"
                >
                  <Trash2 size={16} />
                  刪除會議
                </button>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] text-slate-500 text-center font-bold mb-1">選擇刪除範圍</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMeeting(editingMeeting.id);
                        onCancelEdit();
                      }}
                      className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 transition-all"
                    >
                      僅刪除此場
                    </button>
                    {editingMeeting.groupId && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSeries(editingMeeting.groupId!);
                          onCancelEdit();
                        }}
                        className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                      >
                        刪除整個系列
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-1 text-[9px] text-slate-400 hover:text-slate-600 font-medium"
                  >
                    取消刪除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
