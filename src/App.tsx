import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, User, Users, LayoutGrid, RotateCcw } from 'lucide-react';

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
  const [mascotMissing, setMascotMissing] = useState(false);

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

  const overallStats = useMemo(() => {
    const totalPossible = (totalStudents * (totalStudents - 1)) / 2;
    // Only count matches within the current student range
    const completed = Object.keys(matches).filter(id => {
      if (!matches[id]) return false;
      const [s1, s2] = id.split('-').map(Number);
      return s1 <= totalStudents && s2 <= totalStudents;
    }).length;
    const progress = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    return { completed, total: totalPossible, progress };
  }, [matches, totalStudents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3e7da] flex items-center justify-center font-sans">
        <div className="animate-pulse text-[#907463]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fffaf3] text-[var(--ink)] font-sans flex overflow-hidden">
      {/* Main Content Area - Maximized for Grid */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#fffaf3]">
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden bg-[#f3e7da]/70">
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
                  className="grid gap-[1px] shadow-2xl rounded-xl overflow-hidden border-4 border-[var(--line)] bg-[#e8d8ca]" 
                  style={{ 
                    width: 'min(92vw - 10rem, 92vh)',
                    height: 'min(92vw - 10rem, 92vh)',
                    gridTemplateColumns: `repeat(${totalStudents + 1}, 1fr)`,
                    gridTemplateRows: `repeat(${totalStudents + 1}, 1fr)`
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-center bg-[#f2e4d6] border-b-2 border-r-2 border-[var(--line)]"></div>
                  {students.map(s => (
                    <div 
                      key={s} 
                      className={`flex items-center justify-center text-[10px] md:text-sm transition-all border-b-2 ${s % 5 === 0 ? 'border-r-2 border-[#cfb8a6]' : 'border-r border-[#eadccf]'} ${hoveredCell?.s2 === s ? 'text-[var(--scarf-deep)] bg-[#dbead8] scale-110 z-10 font-black' : s % 5 === 0 ? 'text-[#6f5647] bg-[#f2e4d6] font-extrabold' : 'text-[#907463] bg-[#f8efe6] font-black'}`}
                      title={studentNames[s] || `Student ${s}`}
                    >
                      {s}
                    </div>
                  ))}

                  {/* Data Rows */}
                  {students.map(s1 => (
                    <React.Fragment key={s1}>
                      <div 
                        className={`flex items-center justify-center text-[10px] md:text-sm transition-all border-r-2 ${s1 % 5 === 0 ? 'border-b-2 border-[#cfb8a6]' : 'border-b border-[#eadccf]'} ${hoveredCell?.s1 === s1 ? 'text-[var(--scarf-deep)] bg-[#dbead8] scale-110 z-10 font-black' : s1 % 5 === 0 ? 'text-[#6f5647] bg-[#f2e4d6] font-extrabold' : 'text-[#907463] bg-[#f8efe6] font-black'}`}
                        title={studentNames[s1] || `Student ${s1}`}
                      >
                        {s1}
                      </div>
                      {students.map(s2 => {
                        if (s1 === s2) return (
                          <div 
                            key={s2} 
                            className="border border-[#eadccf]/50"
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
                                ? 'bg-[var(--scarf)] border-[var(--scarf-deep)] z-10 shadow-inner' 
                                : 'bg-[#fffaf3] border-[#eadccf] hover:border-[#cfb8a6]'
                            } ${isCellHovered ? 'ring-2 ring-[var(--scarf)] z-30 scale-125 shadow-xl' : ''} 
                              ${(isRowHighlighted || isColHighlighted) && !isDone ? 'bg-[#edf5eb]/40 z-10' : ''}
                              ${hasRightGuide ? 'border-r-[#cfb8a6] border-r-2' : ''}
                              ${hasBottomGuide ? 'border-b-[#cfb8a6] border-b-2' : ''}`}
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
                      <div className="bg-[#fffaf3] p-8 rounded-[2.5rem] border-2 border-[#eadccf] shadow-xl mb-6 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-8">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="w-12 h-12 rounded-2xl bg-[var(--fur-deep)] text-white flex items-center justify-center text-xl font-black shadow-lg">
                                {selectedStudent}
                              </div>
                              <input 
                                type="text"
                                placeholder="..."
                                value={studentNames[selectedStudent] || ''}
                                onChange={(e) => updateStudentName(selectedStudent, e.target.value)}
                                className="text-4xl font-black text-[var(--ink)] border-none focus:ring-0 p-0 bg-transparent w-full placeholder:text-[#ccb5a3]"
                              />
                            </div>
                          </div>
                          <div className="text-right bg-[#edf5eb] px-6 py-4 rounded-3xl border border-[#d3e4d0]">
                            <div className="text-4xl font-black text-[var(--scarf-deep)]">{studentStats[selectedStudent].completed}</div>
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
                                    ? 'bg-[var(--scarf)] border-[var(--scarf-deep)] text-white shadow-lg scale-[1.02]' 
                                    : 'bg-[#fffaf3] border-[#eadccf] text-[#6f5647] hover:border-[#cfb8a6] hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-colors ${isDone ? 'bg-[#fffaf3]/20 text-white' : 'bg-[#f1e4d8] text-[#907463] group-hover:bg-[#e8d8ca]'}`}>
                                    {opponent}
                                  </div>
                                  <div className="text-left">
                                    <span className={`block font-black truncate max-w-[140px] text-base ${isDone ? 'text-white' : 'text-[var(--ink)]'}`}>
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
                    <div className="flex-1 flex flex-col items-center justify-center text-[#b89b88] py-20 border-4 border-dashed border-[#eadccf] rounded-[3rem] bg-[#f3e7da]/40">
                      <div className="w-24 h-24 rounded-full bg-[#fffaf3] shadow-inner flex items-center justify-center mb-6">
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
      <aside className="w-64 border-l border-[var(--line)] bg-[#f3e7da] flex flex-col shrink-0 overflow-hidden shadow-2xl z-20">
        <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
          {/* Progress Section - Circular & Prominent */}
          <section className="bg-[#fffaf3] p-6 rounded-3xl border border-[var(--line)] shadow-sm flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-[#eadccf]"
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
                  animate={{ strokeDashoffset: 364.4 - (364.4 * overallStats.progress) / 100 }}
                  className="text-[var(--scarf)]"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[var(--ink)] leading-none">{overallStats.progress}%</span>
                <span className="mt-1 text-[11px] font-bold text-[#907463] tracking-wide">
                  {overallStats.completed} / {overallStats.total}
                </span>
              </div>
            </div>
          </section>

          {/* Stats Bento Grid */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-[#fffaf3] p-4 rounded-2xl border border-[var(--line)] shadow-sm flex flex-col items-center justify-center">
              <div className="text-[#907463] mb-1"><Users size={16} /></div>
              <div className="text-xl font-black text-[var(--ink)]">{totalStudents}</div>
            </div>
            <button 
              onClick={resetMatches}
              className="bg-[#fffaf3] p-4 rounded-2xl border border-[var(--line)] shadow-sm flex flex-col items-center justify-center hover:bg-[#f8e4dc] hover:border-[#e3b8a8] transition-all group"
            >
              <div className="text-[#b89b88] group-hover:text-[#b46a50] mb-1 transition-colors"><RotateCcw size={16} /></div>
              <div className="text-xs font-black text-[#907463] group-hover:text-[#99553f] transition-colors">RESET</div>
            </button>
          </section>

          {/* View Mode Toggle - Horizontal & Clear */}
          <section className="space-y-3">
            <div className="flex bg-[#fffaf3] rounded-2xl p-1.5 border border-[var(--line)] shadow-sm">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'grid' ? 'bg-[var(--fur-deep)] text-white shadow-lg' : 'text-[#907463] hover:text-[#7d6454]'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('personal')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'personal' ? 'bg-[var(--fur-deep)] text-white shadow-lg' : 'text-[#907463] hover:text-[#7d6454]'}`}
              >
                <User size={14} />
              </button>
            </div>
          </section>

          {/* Student Count Control */}
          <section className="space-y-3">
            <div className="flex items-center gap-4 bg-[#fffaf3] p-3 rounded-2xl border border-[var(--line)] shadow-sm">
              <button 
                onClick={() => setTotalStudents(prev => Math.max(2, prev - 1))}
                className="w-8 h-8 rounded-lg bg-[#f3e7da] flex items-center justify-center text-[#907463] hover:bg-[#f1e4d8] transition-colors"
              >-</button>
              <input 
                type="number" 
                value={totalStudents}
                onChange={(e) => setTotalStudents(Math.max(2, Math.min(30, parseInt(e.target.value) || 2)))}
                className="flex-1 bg-transparent border-none focus:ring-0 font-black text-xl text-[var(--ink)] text-center p-0"
                min="2" max="30"
              />
              <button 
                onClick={() => setTotalStudents(prev => Math.min(30, prev + 1))}
                className="w-8 h-8 rounded-lg bg-[#f3e7da] flex items-center justify-center text-[#907463] hover:bg-[#f1e4d8] transition-colors"
              >+</button>
            </div>
          </section>

          {/* Student Selector (Only in personal mode) */}
          {viewMode === 'personal' && (
            <section className="space-y-3 pt-4 border-t border-[var(--line)]">
              <div className="grid grid-cols-4 gap-2">
                {students.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStudent(s)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                      selectedStudent === s 
                        ? 'bg-[var(--fur-deep)] border-[var(--fur-deep)] text-white shadow-xl scale-105 z-10' 
                        : 'bg-[#fffaf3] border-[#eadccf] text-[#7d6454] hover:border-[#cfb8a6]'
                    }`}
                  >
                    <span className="text-sm font-black">{s}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Mascot */}
          <section className="pt-1">
            <div className="rounded-[1.75rem] border border-[#d7c5b6] bg-[#f7efe4] p-3 shadow-sm">
            {!mascotMissing ? (
              <img
                src="/mascot-working-bear.png"
                alt="Mascot bear"
                className="w-full h-auto max-h-56 object-contain select-none pointer-events-none"
                loading="lazy"
                onError={() => setMascotMissing(true)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-[#cfb8a6] bg-[#fffaf3] p-3 text-center text-xs font-semibold text-[#907463]">
                Add mascot file: /public/mascot-working-bear.png
              </div>
            )}
            </div>
          </section>
          </div>
      </aside>
    </div>
  );
}

