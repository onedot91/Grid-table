import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, User, Users, Trophy, LayoutGrid, List, RotateCcw } from 'lucide-react';

const TOTAL_STUDENTS = 22;
const STUDENTS = Array.from({ length: TOTAL_STUDENTS }, (_, i) => i + 1);

const LOCAL_MATCHES_KEY = 'match_tracker_data';

export default function App() {
  const [totalStudents, setTotalStudents] = useState(22);
  const [matches, setMatches] = useState<Record<string, boolean>>({});
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'personal'>('grid');
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ s1: number; s2: number } | null>(null);
  const [studentNames, setStudentNames] = useState<Record<number, string>>({});

  const students = useMemo(() => Array.from({ length: totalStudents }, (_, i) => i + 1), [totalStudents]);

  useEffect(() => {
    fetchMatches();
    // Load names from localStorage if available
    const savedNames = localStorage.getItem('match_tracker_names');
    if (savedNames) {
      try {
        setStudentNames(JSON.parse(savedNames));
      } catch (e) {
        console.error("Failed to parse saved names", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('match_tracker_names', JSON.stringify(studentNames));
  }, [studentNames]);

  const loadLocalMatches = (): Record<string, boolean> => {
    const saved = localStorage.getItem(LOCAL_MATCHES_KEY);
    if (!saved) return {};

    try {
      return JSON.parse(saved);
    } catch (err) {
      console.error("Failed to parse local matches", err);
      return {};
    }
  };

  const saveLocalMatches = (nextMatches: Record<string, boolean>) => {
    localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(nextMatches));
  };

  const resetMatches = async () => {
    console.log("Reset button clicked");
    if (window.confirm('Reset all match data?')) {
      setMatches({});
      localStorage.removeItem(LOCAL_MATCHES_KEY);
      alert('Matches have been reset.');
    }
  };

  const fetchMatches = async () => {
    const localMatches = loadLocalMatches();
    setMatches(localMatches);
    setLoading(false);
  };

  const updateStudentName = (id: number, name: string) => {
    setStudentNames(prev => ({ ...prev, [id]: name }));
  };

  const toggleMatch = (s1: number, s2: number) => {
    if (s1 === s2 || s1 < 1 || s1 > totalStudents || s2 < 1 || s2 > totalStudents) return;
    
    const p1 = Math.min(s1, s2);
    const p2 = Math.max(s1, s2);
    const id = `${p1}-${p2}`;
    console.log("Toggling match:", id);

    setMatches(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveLocalMatches(next);
      return next;
    });
  };

  const studentStats = useMemo(() => {
    const stats: Record<number, { completed: number; total: number }> = {};
    students.forEach(s => {
      stats[s] = { completed: 0, total: totalStudents - 1 };
    });

    Object.keys(matches).forEach(id => {
      if (matches[id]) {
        const [s1, s2] = id.split('-').map(Number);
        if (stats[s1] && stats[s2]) {
          stats[s1].completed++;
          stats[s2].completed++;
        }
      }
    });
    return stats;
  }, [matches, students, totalStudents]);

  const overallProgress = useMemo(() => {
    const totalPossible = (totalStudents * (totalStudents - 1)) / 2;
    // Only count matches within the current student range
    const completed = Object.keys(matches).filter(id => {
      if (!matches[id]) return false;
      const [s1, s2] = id.split('-').map(Number);
      return s1 <= totalStudents && s2 <= totalStudents;
    }).length;
    return totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
  }, [matches, totalStudents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-neutral-900 font-sans flex overflow-hidden">
      {/* Main Content Area - Maximized for Grid */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-white">
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden bg-neutral-50/50">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex items-center justify-center p-4"
              >
                <div 
                  className="grid gap-[1px] shadow-2xl rounded-xl overflow-hidden border-4 border-neutral-200 bg-neutral-200" 
                  style={{ 
                    width: 'min(85vw - 12rem, 85vh)',
                    height: 'min(85vw - 12rem, 85vh)',
                    gridTemplateColumns: `repeat(${totalStudents + 1}, 1fr)`,
                    gridTemplateRows: `repeat(${totalStudents + 1}, 1fr)`
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-center bg-white border-b-2 border-r-2 border-neutral-200"></div>
                  {students.map(s => (
                    <div 
                      key={s} 
                      className={`flex items-center justify-center text-[10px] md:text-sm font-black transition-all border-b-2 ${s % 5 === 0 ? 'border-r-2 border-neutral-300' : 'border-r border-neutral-100'} ${hoveredCell?.s2 === s ? 'text-emerald-600 bg-emerald-100/50 scale-110 z-10' : 'text-neutral-400 bg-white'}`}
                      title={studentNames[s] || `Student ${s}`}
                    >
                      {s}
                    </div>
                  ))}

                  {/* Data Rows */}
                  {students.map(s1 => (
                    <React.Fragment key={s1}>
                      <div 
                        className={`flex items-center justify-center text-[10px] md:text-sm font-black transition-all border-r-2 ${s1 % 5 === 0 ? 'border-b-2 border-neutral-300' : 'border-b border-neutral-100'} ${hoveredCell?.s1 === s1 ? 'text-emerald-600 bg-emerald-100/50 scale-110 z-10' : 'text-neutral-400 bg-white'}`}
                        title={studentNames[s1] || `Student ${s1}`}
                      >
                        {s1}
                      </div>
                      {students.map(s2 => {
                        if (s1 === s2) return (
                          <div 
                            key={s2} 
                            className="border border-neutral-100/50"
                            style={{
                              background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)'
                            }}
                          ></div>
                        );
                        const id = `${Math.min(s1, s2)}-${Math.max(s1, s2)}`;
                        const isDone = matches[id];
                        
                        // Highlighting logic
                        const isCellHovered = hoveredCell?.s1 === s1 && hoveredCell?.s2 === s2;
                        const isRowHighlighted = hoveredCell?.s1 === s1;
                        const isColHighlighted = hoveredCell?.s2 === s2;
                        
                        // 5-unit border logic
                        const hasRightGuide = s2 % 5 === 0 && s2 !== totalStudents;
                        const hasBottomGuide = s1 % 5 === 0 && s1 !== totalStudents;

                        return (
                          <button
                            key={s2}
                            onMouseEnter={() => setHoveredCell({ s1, s2 })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => toggleMatch(s1, s2)}
                            className={`transition-all duration-75 border-[0.5px] relative ${
                              isDone 
                                ? 'bg-emerald-500 border-emerald-400 z-10 shadow-inner' 
                                : 'bg-white border-neutral-100 hover:border-neutral-300'
                            } ${isCellHovered ? 'ring-2 ring-emerald-500 z-30 scale-125 shadow-xl' : ''} 
                              ${(isRowHighlighted || isColHighlighted) && !isDone ? 'bg-emerald-50/40 z-10' : ''}
                              ${hasRightGuide ? 'border-r-neutral-300 border-r-2' : ''}
                              ${hasBottomGuide ? 'border-b-neutral-300 border-b-2' : ''}`}
                            title={`${studentNames[s1] || `S${s1}`} vs ${studentNames[s2] || `S${s2}`}`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="personal-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full max-w-4xl mx-auto flex flex-col"
              >
                <AnimatePresence mode="wait">
                  {selectedStudent ? (
                    <motion.div
                      key={selectedStudent}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-neutral-100 shadow-xl mb-6 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-8">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl font-black shadow-lg">
                                {selectedStudent}
                              </div>
                              <input 
                                type="text"
                                placeholder="..."
                                value={studentNames[selectedStudent] || ''}
                                onChange={(e) => updateStudentName(selectedStudent, e.target.value)}
                                className="text-4xl font-black text-neutral-900 border-none focus:ring-0 p-0 bg-transparent w-full placeholder:text-neutral-200"
                              />
                            </div>
                          </div>
                          <div className="text-right bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100">
                            <div className="text-4xl font-black text-emerald-600">{studentStats[selectedStudent].completed}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                          {students.filter(s => s !== selectedStudent).map(opponent => {
                            const id = `${Math.min(selectedStudent, opponent)}-${Math.max(selectedStudent, opponent)}`;
                            const isDone = matches[id];
                            return (
                              <button
                                key={opponent}
                                onClick={() => toggleMatch(selectedStudent, opponent)}
                                className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all group ${
                                  isDone 
                                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg scale-[1.02]' 
                                    : 'bg-white border-neutral-100 text-neutral-700 hover:border-neutral-300 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-colors ${isDone ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200'}`}>
                                    {opponent}
                                  </div>
                                  <div className="text-left">
                                    <span className={`block font-black truncate max-w-[140px] text-base ${isDone ? 'text-white' : 'text-neutral-900'}`}>
                                      {studentNames[opponent] || opponent}
                                    </span>
                                  </div>
                                </div>
                                {isDone && <Check size={24} strokeWidth={4} className="text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 py-20 border-4 border-dashed border-neutral-100 rounded-[3rem] bg-neutral-50/30">
                      <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center mb-6">
                        <Users size={48} className="opacity-20" />
                      </div>
                      <p className="font-black text-2xl tracking-tight">Select a student from the sidebar</p>
                      <p className="text-sm font-bold uppercase tracking-widest mt-2 opacity-50">to manage their matches</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar - Redesigned for better space usage */}
      <aside className="w-64 border-l border-neutral-200 bg-neutral-50 flex flex-col shrink-0 overflow-hidden shadow-2xl z-20">
        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Progress Section - Circular & Prominent */}
          <section className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-neutral-100"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="364.4"
                  initial={{ strokeDashoffset: 364.4 }}
                  animate={{ strokeDashoffset: 364.4 - (364.4 * overallProgress) / 100 }}
                  className="text-emerald-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-neutral-900 leading-none">{overallProgress}%</span>
              </div>
            </div>
          </section>

          {/* Stats Bento Grid */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center">
              <div className="text-neutral-400 mb-1"><Users size={16} /></div>
              <div className="text-xl font-black text-neutral-900">{totalStudents}</div>
            </div>
            <button 
              onClick={resetMatches}
              className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center hover:bg-red-50 hover:border-red-100 transition-all group"
            >
              <div className="text-neutral-300 group-hover:text-red-400 mb-1 transition-colors"><RotateCcw size={16} /></div>
              <div className="text-xs font-black text-neutral-400 group-hover:text-red-500 transition-colors">RESET</div>
            </button>
          </section>

          {/* View Mode Toggle - Horizontal & Clear */}
          <section className="space-y-3">
            <div className="flex bg-white rounded-2xl p-1.5 border border-neutral-200 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'grid' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('personal')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'personal' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                <User size={14} />
              </button>
            </div>
          </section>

          {/* Student Count Control */}
          <section className="space-y-3">
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
              <button 
                onClick={() => setTotalStudents(prev => Math.max(2, prev - 1))}
                className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors"
              >-</button>
              <input 
                type="number" 
                value={totalStudents}
                onChange={(e) => setTotalStudents(Math.max(2, Math.min(30, parseInt(e.target.value) || 2)))}
                className="flex-1 bg-transparent border-none focus:ring-0 font-black text-xl text-neutral-900 text-center p-0"
                min="2" max="30"
              />
              <button 
                onClick={() => setTotalStudents(prev => Math.min(30, prev + 1))}
                className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors"
              >+</button>
            </div>
          </section>

          {/* Student Selector (Only in personal mode) */}
          {viewMode === 'personal' && (
            <section className="space-y-3 pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-4 gap-2">
                {students.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStudent(s)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                      selectedStudent === s 
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-xl scale-105 z-10' 
                        : 'bg-white border-neutral-100 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-sm font-black">{s}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-6 bg-white border-t border-neutral-100">
          <div className="flex items-center justify-center text-neutral-400">
            <Trophy size={14} />
          </div>
        </div>
      </aside>
    </div>
  );
}
