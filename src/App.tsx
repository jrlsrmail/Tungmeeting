/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ClipboardList, Hospital, Settings } from 'lucide-react';
import Calendar from './Calendar';
import MeetingForm from './MeetingForm';
import RecentMeetingsList from './RecentMeetingsList';
import { Meeting } from './types';

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('hospital_meetings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, date: new Date(m.date) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    localStorage.setItem('hospital_meetings', JSON.stringify(meetings));
  }, [meetings]);

  const handleAddMeetings = (newMeetings: Meeting[]) => {
    setMeetings(prev => [...prev, ...newMeetings]);
  };

  const handleUpdateMeeting = (updated: Meeting) => {
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
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
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">教學會議排程</h1>
            <p className="text-[10px] text-slate-400 font-mono">MedSched v3.0</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <button className="side-rail-btn active">
            <CalendarIcon size={18} /> 行事曆預覽
          </button>
          <button className="side-rail-btn">
            <ClipboardList size={18} /> 會議列表管理
          </button>
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
            <h1 className="text-base font-bold">教學會議排程</h1>
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
                className="w-full lg:w-[400px] shrink-0 sticky top-0"
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] lg:hidden flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md"
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

