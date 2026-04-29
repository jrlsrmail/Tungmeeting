import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Hospital, 
  Settings, 
  ClipboardList,
  RotateCcw,
  RotateCw,
  Plus,
  Users,
  MapPin,
  User
} from 'lucide-react';
import Calendar from './Calendar';
import MeetingForm from './MeetingForm';
import RecentMeetingsList from './RecentMeetingsList';
import { Meeting, AppSettings } from './types';
import { cn } from './lib/utils';
import { format } from 'date-fns';

const DEFAULT_ADVISORS = ["陳雅怡", "蕭應良", "林佳蓉", "葉宜霖", "陳瑋玲", "鍾清貞", "陳堯睿", "陳昶安", "陳嘉宏", "黃兆民", "林暉育", "李昕錞", "畢祐瑄"];
const DEFAULT_LOCATIONS = ["口醫部會議室", "遠距會議", "臨床示範室"];
const DEFAULT_PARTICIPANTS = ["FR何宜蓁", "PGY謝皓胤", "PGY鄧惠璇", "PGY彭品蓁", "PGY張言駿", "PGY陳冠妤", "PGY馮筠婷", "PGY黃庭暐", "PGY何浩辰", "Int 王日羲", "Int 徐一華"];

// Enhanced Undo/Redo Hook with LocalStorage sync
function useHistory<T>(storageKey: string, initialState: T) {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Special case for our meeting dates which are serialized as strings
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => ({ ...m, date: new Date(m.date) })) as any;
        }
        return parsed;
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  const [history, setHistory] = useState<T[]>([state]);
  const [index, setIndex] = useState(0);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof newState === 'function' ? (newState as any)(prev) : newState;
      
      // Update history
      const newHistory = history.slice(0, index + 1);
      newHistory.push(next);
      
      // Limit history size to 50 for performance
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setIndex(newHistory.length - 1);
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(next));
      
      return next;
    });
  }, [history, index, storageKey]);

  const undo = useCallback(() => {
    if (index > 0) {
      const prevState = history[index - 1];
      setIndex(index - 1);
      setState(prevState);
      localStorage.setItem(storageKey, JSON.stringify(prevState));
    }
  }, [index, history, storageKey]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      const nextState = history[index + 1];
      setIndex(index + 1);
      setState(nextState);
      localStorage.setItem(storageKey, JSON.stringify(nextState));
    }
  }, [index, history, storageKey]);

  return { state, set, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}

export default function App() {
  const { 
    state: meetings, 
    set: setMeetings, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<Meeting[]>('hospital_meetings_v4', []);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('hospital_settings_v4');
    const defaults = { 
      advisors: DEFAULT_ADVISORS, 
      locations: DEFAULT_LOCATIONS, 
      participants: DEFAULT_PARTICIPANTS 
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'settings'>('calendar');
  const [priorityView, setPriorityView] = useState<'calendar' | 'recent'>('calendar');

  const goHome = () => {
    setActiveView('calendar');
    setPriorityView('calendar');
    setShowForm(false);
    setEditingMeeting(null);
    setPreselectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setPreselectedDate(dateStr);
    setEditingMeeting(null);
    setShowForm(true);
  };

  useEffect(() => {
    localStorage.setItem('hospital_settings_v4', JSON.stringify(settings));
  }, [settings]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleAddMeetings = (newMeetings: Meeting[]) => {
    setMeetings(prev => [...prev, ...newMeetings]);
    setShowForm(false);
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    setEditingMeeting(null);
    setShowForm(false);
  };

  const handleDeleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    setEditingMeeting(null);
  };

  const handleDeleteAllInGroup = (groupId: string) => {
    setMeetings(prev => prev.filter(m => m.groupId !== groupId));
    setEditingMeeting(null);
  };

  const handleMoveMeeting = (id: string, newDate: Date) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, date: newDate } : m));
  };

  const handleEditRequest = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setShowForm(true);
  };

  return (
    <div className="flex h-screen bg-medical-bg overflow-hidden font-sans">
      {/* Side Rail - Desktop */}
      <aside className="hidden lg:flex w-56 flex-col bg-medical-surface border-r border-medical-border p-4 shrink-0 transition-all">
        <div 
          onClick={goHome}
          className="flex items-center gap-3 px-1 mb-10 mt-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-11 h-11 bg-medical-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100 shrink-0">
            <Hospital size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 leading-tight">童綜合口醫部</h1>
            <p className="text-sm text-slate-400 font-bold">會議排程系統</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <button 
            onClick={() => {
              setActiveView('calendar');
              setPriorityView('calendar');
            }}
            className={cn("side-rail-btn", activeView === 'calendar' && priorityView === 'calendar' && "active")}
          >
            <CalendarIcon size={18} /> 行事曆
          </button>

          <button 
            onClick={() => {
              setActiveView('calendar');
              setPriorityView('recent');
            }}
            className={cn("side-rail-btn", activeView === 'calendar' && priorityView === 'recent' && "active")}
          >
            <ClipboardList size={18} /> 近期排定會議
          </button>
          
          <button 
            onClick={() => {
              setEditingMeeting(null);
              setPreselectedDate(null);
              setShowForm(!showForm);
            }}
            className={cn(
              "side-rail-btn py-3 transition-all duration-300 text-base", 
              showForm && "bg-amber-500 text-white hover:bg-amber-600 hover:text-white shadow-lg shadow-amber-100"
            )}
          >
            <Plus size={22} /> 新增會議
          </button>

          <button 
            onClick={() => setActiveView('settings')}
            className={cn("side-rail-btn", activeView === 'settings' && "active")}
          >
            <Settings size={18} /> 系統偏好設定
          </button>
        </nav>

        <div className="mt-auto p-4 bg-amber-100/50 rounded-2xl border border-amber-100 mb-4">
          <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">系統狀態</p>
          <p className="text-sm font-bold text-slate-700">{meetings.length} 場會議</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-medical-surface border-b border-medical-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-medical-primary rounded-lg flex items-center justify-center text-white">
              <Hospital size={16} />
            </div>
            <h1 className="text-sm font-bold">口醫部會議排程</h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="p-2 bg-amber-500 text-white rounded-lg"
          >
            <Plus size={18} />
          </button>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex gap-8 items-start">
              {/* Form Section - Toggleable Desktop */}
              <AnimatePresence>
                {showForm && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0, x: -20 }}
                    animate={{ opacity: 1, width: 420, x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -20 }}
                    className="shrink-0 sticky top-0 overflow-hidden"
                  >
                    <MeetingForm 
                      onAddMeetings={handleAddMeetings}
                      onUpdateMeeting={handleUpdateMeeting}
                      onDeleteMeeting={handleDeleteMeeting}
                      onDeleteSeries={handleDeleteAllInGroup}
                      editingMeeting={editingMeeting}
                      settings={settings}
                      preselectedDate={preselectedDate}
                      onCancelEdit={() => {
                        setEditingMeeting(null);
                        setPreselectedDate(null);
                        setShowForm(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View Section */}
              <div className="flex-1 min-w-0 space-y-8">
                {activeView === 'calendar' ? (
                  <div className="flex flex-col gap-8">
                    {/* Render components based on priorityView */}
                    {priorityView === 'calendar' ? (
                      <>
                        <motion.div 
                          key="calendar"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Calendar 
                            meetings={meetings} 
                            onEditMeeting={handleEditRequest}
                            onDeleteMeeting={handleDeleteMeeting}
                            onMoveMeeting={handleMoveMeeting}
                            onDateClick={handleDateClick}
                          />
                        </motion.div>

                        <motion.div 
                          key="recent"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <RecentMeetingsList 
                            meetings={meetings}
                            onEdit={handleEditRequest}
                            onDelete={handleDeleteMeeting}
                            onDeleteSeries={handleDeleteAllInGroup}
                          />
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div 
                          key="recent-priority"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <RecentMeetingsList 
                            meetings={meetings}
                            onEdit={handleEditRequest}
                            onDelete={handleDeleteMeeting}
                            onDeleteSeries={handleDeleteAllInGroup}
                          />
                        </motion.div>

                        <motion.div 
                          key="calendar-secondary"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Calendar 
                            meetings={meetings} 
                            onEditMeeting={handleEditRequest}
                            onDeleteMeeting={handleDeleteMeeting}
                            onMoveMeeting={handleMoveMeeting}
                            onDateClick={handleDateClick}
                          />
                        </motion.div>
                      </>
                    )}
                  </div>
                ) : (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dashboard-card max-w-2xl mx-auto"
                  >
                    <div className="accent-line !bg-medical-primary"></div>
                    <h2 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">系統偏好設定</h2>
                    
                    <div className="space-y-10">
                      {/* Advisor Settings */}
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-600 flex items-center gap-2">
                           <Users size={18} className="text-medical-primary" /> 指導醫師名單預設值
                        </h3>
                        <textarea 
                          value={settings.advisors.join('\n')}
                          onChange={(e) => setSettings({ ...settings, advisors: e.target.value.split('\n').filter(Boolean) })}
                          rows={6}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono outline-none focus:border-medical-primary"
                          placeholder="每行輸入一位醫師姓名..."
                        />
                        <p className="text-xs text-slate-400 font-bold">請以換行符號隔開不同的項目。</p>
                      </div>

                      {/* Participant Settings */}
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-600 flex items-center gap-2">
                           <User size={18} className="text-medical-primary" /> 報告者/紀錄者名單預設值
                        </h3>
                        <textarea 
                          value={settings.participants.join('\n')}
                          onChange={(e) => setSettings({ ...settings, participants: e.target.value.split('\n').filter(Boolean) })}
                          rows={6}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono outline-none focus:border-medical-primary"
                          placeholder="每行輸入一個姓名..."
                        />
                        <p className="text-xs text-slate-400 font-bold">請以換行符號隔開不同的項目。</p>
                      </div>

                      {/* Location Settings */}
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-600 flex items-center gap-2">
                           <MapPin size={18} className="text-medical-primary" /> 地點選項預設值
                        </h3>
                        <textarea 
                          value={settings.locations.join('\n')}
                          onChange={(e) => setSettings({ ...settings, locations: e.target.value.split('\n').filter(Boolean) })}
                          rows={4}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono outline-none focus:border-medical-primary"
                          placeholder="每行輸入一個地點..."
                        />
                        <p className="text-xs text-slate-400 font-bold">請以換行符號隔開不同的項目。</p>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button 
                          onClick={() => setActiveView('calendar')}
                          className="btn-medical px-8"
                        >
                          儲存並返回
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay for Editing */}
      <AnimatePresence>
        {(editingMeeting || (showForm && window.innerWidth < 1024)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden flex items-end justify-center p-4"
            onClick={() => {
              setEditingMeeting(null);
              setShowForm(false);
            }}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg mb-4"
              onClick={e => e.stopPropagation()}
            >
              <MeetingForm 
                onAddMeetings={handleAddMeetings}
                onUpdateMeeting={handleUpdateMeeting}
                onDeleteMeeting={handleDeleteMeeting}
                onDeleteSeries={handleDeleteAllInGroup}
                editingMeeting={editingMeeting}
                settings={settings}
                onCancelEdit={() => {
                  setEditingMeeting(null);
                  setShowForm(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
