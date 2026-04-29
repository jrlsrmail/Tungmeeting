import React, { useState, useEffect } from 'react';
import { format, addMonths, addWeeks, addDays, getDay, startOfMonth } from 'date-fns';
import { Plus, X, Calendar as CalendarIcon, Clock, Trash2, Save, MapPin, User, Users, Info, Type } from 'lucide-react';
import { Department, DEPARTMENT_CONTENTS, Frequency, Meeting, AppSettings } from './types';
import { cn } from './lib/utils';

interface MeetingFormProps {
  onAddMeetings: (meetings: Meeting[]) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onDeleteSeries: (groupId: string) => void;
  editingMeeting: Meeting | null;
  onCancelEdit: () => void;
  settings: AppSettings;
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
  onCancelEdit,
  settings
}: MeetingFormProps) {
  const [department, setDepartment] = useState<Department>(Department.ADMIN);
  const [content, setContent] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [frequency, setFrequency] = useState<Frequency>(Frequency.SPECIFIC);
  const [selectedDay, setSelectedDay] = useState<number>(3); // Default Wednesday
  const [nthWeek, setNthWeek] = useState<number>(1); // 1st, 2nd, etc.
  
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // New Fields
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState((settings.locations || [])[0] || '口醫部會議室');
  const [customLocation, setCustomLocation] = useState('');
  const [advisors, setAdvisors] = useState<string[]>([]);
  const [customAdvisor, setCustomAdvisor] = useState('');
  const [presenter, setPresenter] = useState('');
  const [customPresenter, setCustomPresenter] = useState('');
  const [recorder, setRecorder] = useState('');
  const [customRecorder, setCustomRecorder] = useState('');
  const [remarks, setRemarks] = useState('');

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
      setStartDate(format(new Date(editingMeeting.date), 'yyyy-MM-dd'));
      setStartTime(editingMeeting.startTime);
      setEndTime(editingMeeting.endTime);
      
      // Load New Fields
      setTopic(editingMeeting.topic || '');
      if ((settings.locations || []).concat('其他').includes(editingMeeting.location || '')) {
        setLocation(editingMeeting.location || (settings.locations || [])[0] || '口醫部會議室');
        setCustomLocation('');
      } else {
        setLocation('其他');
        setCustomLocation(editingMeeting.location || '');
      }
      setAdvisors(editingMeeting.advisors?.map(a => a.replace('醫師', '')) || []);
      
      // Handle Presenter
      const rawPresenter = editingMeeting.presenter || '';
      if ((settings.participants || []).concat('其他').includes(rawPresenter)) {
        setPresenter(rawPresenter);
        setCustomPresenter('');
      } else if (rawPresenter) {
        setPresenter('其他');
        setCustomPresenter(rawPresenter);
      } else {
        setPresenter('');
        setCustomPresenter('');
      }

      // Handle Recorder
      const rawRecorder = editingMeeting.recorder || '';
      if ((settings.participants || []).concat('其他').includes(rawRecorder)) {
        setRecorder(rawRecorder);
        setCustomRecorder('');
      } else if (rawRecorder) {
        setRecorder('其他');
        setCustomRecorder(rawRecorder);
      } else {
        setRecorder('');
        setCustomRecorder('');
      }

      setRemarks(editingMeeting.remarks || '');
      setFrequency(Frequency.SPECIFIC);
    } else {
      setDepartment(Department.ADMIN);
      setContent(DEPARTMENT_CONTENTS[Department.ADMIN][0]);
      setCustomContent('');
      setTopic('');
      if (location !== '其他') {
        setLocation((settings.locations || [])[0] || '口醫部會議室');
      }
      setCustomLocation('');
      setAdvisors([]);
      setPresenter('');
      setCustomPresenter('');
      setRecorder('');
      setCustomRecorder('');
      setRemarks('');
      setFrequency(Frequency.SPECIFIC);
    }
  }, [editingMeeting, settings.locations, settings.participants]);

  const toggleAdvisor = (name: string) => {
    setAdvisors(prev => 
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const generateMeetings = () => {
    const finalContent = content === '其他' || department === Department.OTHER ? customContent : content;
    if (!finalContent) {
      alert('請填寫會議內容');
      return;
    }

    const finalLocation = location === '其他' ? customLocation : location;
    const finalAdvisors = advisors.map(a => a.endsWith('醫師') ? a : `${a}醫師`);
    if (customAdvisor) {
      const fixedName = customAdvisor.endsWith('醫師') ? customAdvisor : `${customAdvisor}醫師`;
      if (!finalAdvisors.includes(fixedName)) {
        finalAdvisors.push(fixedName);
      }
    }

    const applySuffix = (name: string) => {
      if (!name) return '';
      const roles = ['FR', 'PGY', 'Int'];
      if (roles.some(role => name.toUpperCase().startsWith(role.toUpperCase()))) return name;
      if (name.endsWith('醫師')) return name;
      return `${name}醫師`;
    };

    const finalPresenter = presenter === '其他' ? applySuffix(customPresenter) : presenter;
    const finalRecorder = recorder === '其他' ? applySuffix(customRecorder) : recorder;

    const firstDate = new Date(startDate);
    const groupId = Math.random().toString(36).substring(7);

    if (editingMeeting) {
      onUpdateMeeting({
        ...editingMeeting,
        department,
        content: finalContent,
        date: firstDate,
        startTime,
        endTime,
        topic,
        location: finalLocation,
        advisors: finalAdvisors,
        presenter: finalPresenter,
        recorder: finalRecorder,
        remarks: remarks
      });
      onCancelEdit();
      return;
    }

    const meetings: Meeting[] = [];
    
    if (frequency === Frequency.SPECIFIC) {
      meetings.push(createMeeting(firstDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
    } else {
      let count = 0;
      let currentDate = firstDate;

      // Logic to REALIGN currentDate to the selected frequency settings
      if (frequency === Frequency.MONTHLY_NTH_DAY) {
        let monthStart = startOfMonth(currentDate);
        let firstOccur = monthStart;
        while (getDay(firstOccur) !== selectedDay) {
          firstOccur = addDays(firstOccur, 1);
        }
        currentDate = addWeeks(firstOccur, nthWeek - 1);
        if (currentDate < firstDate) {
          let nextMonth = addMonths(monthStart, 1);
          let firstOccurNext = nextMonth;
          while (getDay(firstOccurNext) !== selectedDay) {
            firstOccurNext = addDays(firstOccurNext, 1);
          }
          currentDate = addWeeks(firstOccurNext, nthWeek - 1);
        }
      } else if (frequency !== Frequency.SPECIFIC) {
        let diff = selectedDay - getDay(currentDate);
        if (diff < 0) diff += 7;
        currentDate = addDays(currentDate, diff);
      }

      const monthsToGenerate = frequency === Frequency.EVERY_YEAR ? 36 : 12;
      const endGenDate = addMonths(firstDate, monthsToGenerate);

      while (currentDate < endGenDate) {
        if (frequency === Frequency.ONCE_A_MONTH) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          currentDate = addMonths(currentDate, 1);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.MONTHLY_NTH_DAY) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          let monthStart = startOfMonth(addMonths(currentDate, 1));
          let firstOccurNext = monthStart;
          while (getDay(firstOccurNext) !== selectedDay) {
            firstOccurNext = addDays(firstOccurNext, 1);
          }
          currentDate = addWeeks(firstOccurNext, nthWeek - 1);
        } else if (frequency === Frequency.TWICE_A_MONTH) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          meetings.push(createMeeting(addWeeks(currentDate, 2), finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          currentDate = addMonths(currentDate, 1);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.ONCE_EVERY_TWO_MONTHS) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          currentDate = addMonths(currentDate, 2);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.ONCE_A_QUARTER) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          currentDate = addMonths(currentDate, 3);
          let diff = selectedDay - getDay(currentDate);
          if (diff < 0) diff += 7;
          currentDate = addDays(currentDate, diff);
        } else if (frequency === Frequency.WEEKLY) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
          currentDate = addWeeks(currentDate, 1);
        } else if (frequency === Frequency.EVERY_YEAR) {
          meetings.push(createMeeting(currentDate, finalContent, groupId, finalLocation, finalAdvisors, finalPresenter, finalRecorder));
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

  const createMeeting = (
    date: Date, 
    meetingContent: string, 
    groupId: string, 
    loc: string, 
    advs: string[], 
    pres: string, 
    rec: string
  ): Meeting => {
    return {
      id: Math.random().toString(36).substring(7),
      department,
      content: meetingContent,
      date: new Date(date),
      startTime,
      endTime,
      isAutoGenerated: true,
      groupId,
      topic,
      location: loc,
      advisors: advs,
      presenter: pres,
      recorder: rec,
      remarks: remarks
    };
  };

  return (
    <div className="dashboard-card space-y-6">
      <div className="accent-line !bg-medical-primary"></div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
          {editingMeeting ? <Save size={16} className="text-medical-primary" /> : <Plus size={16} className="text-medical-primary" />}
          {editingMeeting ? '編輯會議內容' : '會議內容'}
        </h3>
        {editingMeeting && (
          <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Department Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">科別</label>
          <select 
            value={department}
            onChange={(e) => {
              const dept = e.target.value as Department;
              setDepartment(dept);
              const contents = DEPARTMENT_CONTENTS[dept];
              if (contents && contents.length > 0) {
                setContent(contents[0]);
              } else {
                setContent('其他');
              }
            }}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all appearance-none"
          >
            {Object.values(Department).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Content Selection */}
        {department !== Department.OTHER && DEPARTMENT_CONTENTS[department] && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">子項目</label>
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
            <label className="text-xs font-semibold text-slate-600 font-bold text-sky-600">自行輸入內容</label>
            <input
              type="text"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="請輸入會議內容..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all"
            />
          </div>
        )}

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Type size={12} /> 課程主題 (選填)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="請輸入課程主題..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all"
          />
        </div>

        {/* Location Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <MapPin size={12} /> 地點 (選填)
          </label>
          <div className="flex gap-2">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all font-bold text-slate-700"
            >
              {(settings.locations || []).concat('其他').map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            {location === '其他' && (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="請輸入地點..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all font-bold text-slate-700"
              />
            )}
          </div>
        </div>

        {/* Advisors Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 text-sky-700">
            <Users size={12} /> 指導醫師 (選填, 可複選)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(settings.advisors || []).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => toggleAdvisor(name)}
                className={cn(
                  "p-1.5 text-[10px] border rounded-lg transition-all",
                  advisors.includes(name)
                    ? "bg-sky-500 text-white border-sky-500 font-bold"
                    : "bg-white border-slate-100 text-slate-500 hover:border-sky-200"
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="pt-1">
            <input
              type="text"
              value={customAdvisor}
              onChange={(e) => setCustomAdvisor(e.target.value)}
              placeholder="請輸入姓名"
              className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Presenter & Recorder */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <User size={12} /> 報告者 (選填)
            </label>
            <div className="flex gap-2">
              <select
                value={presenter}
                onChange={(e) => setPresenter(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="">請選擇報告者</option>
                {(settings.participants || []).concat('其他').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {presenter === '其他' && (
                <input
                  type="text"
                  value={customPresenter}
                  onChange={(e) => setCustomPresenter(e.target.value)}
                  placeholder="輸入姓名"
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500"
                />
              )}
            </div>
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <User size={12} /> 紀錄者 (選填)
            </label>
            <div className="flex gap-2">
              <select
                value={recorder}
                onChange={(e) => setRecorder(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="">請選擇紀錄者</option>
                {(settings.participants || []).concat('其他').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {recorder === '其他' && (
                <input
                  type="text"
                  value={customRecorder}
                  onChange={(e) => setCustomRecorder(e.target.value)}
                  placeholder="輸入姓名"
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Info size={12} /> 備註 (選填)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="請輸入備註內容..."
            rows={2}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all resize-none"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">時間</h3>
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600">頻率模式</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(Frequency).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "p-2 text-[10px] border rounded-xl transition-all font-medium",
                    frequency === f 
                      ? "bg-sky-500 border-sky-600 text-white font-bold shadow-md" 
                      : "border-slate-100 hover:bg-slate-50 text-slate-500"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Recurring Options */}
            {frequency !== Frequency.SPECIFIC && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 space-y-3 p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                <div className="flex gap-4">
                  {frequency === Frequency.MONTHLY_NTH_DAY && (
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-sky-700 block">第幾個週幾</label>
                      <select 
                        value={nthWeek}
                        onChange={(e) => setNthWeek(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-sky-100 rounded-lg text-[10px] text-sky-600 font-bold"
                      >
                        {[1, 2, 3, 4, 5].map(v => (
                          <option key={v} value={v}>第 {v} 個</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-700 block uppercase tracking-wider">星期幾</label>
                    <div className="flex flex-wrap gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setSelectedDay(day.value)}
                          className={cn(
                            "flex-1 min-w-[28px] py-1 text-[10px] rounded-lg border transition-all",
                            selectedDay === day.value
                              ? "bg-sky-500 text-white border-sky-500 shadow-sm font-bold"
                              : "bg-white border-slate-200 text-slate-500 hover:border-sky-200"
                          )}
                        >
                          {day.label.replace('週', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <CalendarIcon size={12} /> {frequency === Frequency.SPECIFIC ? '會議日期' : '下一場會議日期'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-all font-mono"
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
