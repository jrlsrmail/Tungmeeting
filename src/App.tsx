import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Hospital, 
  Settings, 
  ClipboardList,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import Calendar from './Calendar';
import MeetingForm from './MeetingForm';
import RecentMeetingsList from './RecentMeetingsList';
import { Meeting } from './types';

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
  
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

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
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    setEditingMeeting(null);
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

  return (
    <div className="flex h-screen bg-medical-bg overflow-hidden font-sans">
      {/* Side Rail - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-100 p-4 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-10 h-10 bg-medical-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
            <Hospital size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[12px] font-bold text-slate-800 leading-tight truncate">童綜合醫院口醫部</h1>
            <p className="text-[10px] text-slate-400 font-mono">會議排程系統</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <button className="side-rail-btn active">
            <CalendarIcon size={18} /> 行事曆預覽
          </button>
          <button className="side-rail-btn">
            <ClipboardList size={18} /> 會議列表管理
          </button>
          <div className="pt-4 pb-2 px-2 border-t border-slate-50 mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">操作歷史 (Ctrl+Z/Y)</p>
            <div className="flex gap-2">
              <button 
                onClick={undo} 
                disabled={!canUndo}
                className="flex-1 py-2 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all font-bold text-[10px] gap-1"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={14} /> 復原
              </button>
              <button 
                onClick={redo} 
                disabled={!canRedo}
                className="flex-1 py-2 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all font-bold text-[10px] gap-1"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw size={14} /> 重做
              </button>
            </div>
          </div>
          <button className="side-rail-btn">
            <Settings size={18} /> 系統偏好設定
          </button>
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
          <p className="text-[10px] text-slate-500 font-medium mb-1 uppercase tracking-wider">今日狀態</p>
          <p className="text-sm font-bold text-slate-700">{meetings.length} 場會議排定</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-medical-primary rounded-lg flex items-center justify-center text-white">
              <Hospital size={16} />
            </div>
            <h1 className="text-base font-bold">口醫部會議排程</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={undo} disabled={!canUndo} className="p-2 text-slate-400 disabled:opacity-20"><RotateCcw size={18} /></button>
            <button onClick={redo} disabled={!canRedo} className="p-2 text-slate-400 disabled:opacity-20"><RotateCw size={18} /></button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Form Section */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-[450px] shrink-0 lg:sticky lg:top-0 h-fit"
              >
                <MeetingForm 
                  onAddMeetings={handleAddMeetings}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                  onDeleteSeries={handleDeleteAllInGroup}
                  editingMeeting={editingMeeting}
                  onCancelEdit={() => setEditingMeeting(null)}
                />
              </motion.div>

              {/* Data Section */}
              <div className="flex-1 w-full space-y-8 min-w-0">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Calendar 
                    meetings={meetings} 
                    onEditMeeting={setEditingMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                    onMoveMeeting={handleMoveMeeting}
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-1 gap-8"
                >
                  <RecentMeetingsList 
                    meetings={meetings}
                    onEdit={setEditingMeeting}
                    onDelete={handleDeleteMeeting}
                    onDeleteSeries={handleDeleteAllInGroup}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay for Editing */}
      <AnimatePresence>
        {editingMeeting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden flex items-end sm:items-center justify-center p-4"
            onClick={() => setEditingMeeting(null)}
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
                onCancelEdit={() => setEditingMeeting(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
