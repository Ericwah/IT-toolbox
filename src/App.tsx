/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Users, 
  Trophy, 
  Trash2, 
  Plus, 
  RotateCcw, 
  Settings, 
  ChevronRight,
  Download,
  ClipboardList,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Person, Group, AppTab } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('source');
  const [names, setNames] = useState<Person[]>([]);
  const [winners, setWinners] = useState<Person[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawName, setCurrentDrawName] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rawInput, setRawInput] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on first user interaction
  const playTick = () => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playWin = () => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const availablePool = useMemo(() => {
    const winnerIds = new Set(winners.map(w => w.id));
    return names.filter(n => !winnerIds.has(n.id));
  }, [names, winners]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedNames: Person[] = results.data
          .flat()
          .map((name: any) => String(name).trim())
          .filter(name => name.length > 0)
          .map(name => ({ id: Math.random().toString(36).substr(2, 9), name }));
        
        setNames(prev => [...prev, ...parsedNames]);
      },
      header: false,
    });
  };

  const handlePasteSubmit = () => {
    const parsedNames: Person[] = rawInput
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map(name => ({ id: Math.random().toString(36).substr(2, 9), name }));
    
    setNames(prev => [...prev, ...parsedNames]);
    setRawInput('');
  };

  const startDraw = () => {
    if (availablePool.length === 0 || isDrawing) return;
    
    setIsDrawing(true);
    let counter = 0;
    const duration = 3000;
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      setCurrentDrawName(availablePool[randomIndex].name);
      playTick();
      counter++;

      if (counter >= totalSteps) {
        clearInterval(interval);
        const finalWinner = availablePool[Math.floor(Math.random() * availablePool.length)];
        setCurrentDrawName(finalWinner.name);
        setWinners(prev => [finalWinner, ...prev]);
        setIsDrawing(false);
        playWin();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    }, intervalTime);
  };

  const generateGroups = () => {
    if (names.length === 0) return;
    
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push({
        id: Math.floor(i / groupSize) + 1,
        members: shuffled.slice(i, i + groupSize)
      });
    }
    
    setGroups(newGroups);
  };

  const resetAll = () => {
    if (confirm('確定要重置所有數據嗎？')) {
      setNames([]);
      setWinners([]);
      setGroups([]);
      setRawInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">IT Support Toolbox</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              onClick={resetAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-xl mb-8 w-fit">
          {[
            { id: 'source', label: '名單來源', icon: Upload },
            { id: 'draw', label: '獎品抽籤', icon: Trophy },
            { id: 'group', label: '自動分組', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppTab)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'source' && (
                <motion.div
                  key="source"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <ClipboardList className="text-indigo-600" size={20} />
                      添加名單
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">上傳 CSV 文件</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="mx-auto text-slate-400 group-hover:text-indigo-500 mb-2" size={32} />
                          <p className="text-sm text-slate-500">點擊或拖拽 CSV 文件</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">貼上姓名 (每行一個或逗號分隔)</label>
                        <textarea
                          value={rawInput}
                          onChange={(e) => setRawInput(e.target.value)}
                          placeholder="例如:&#10;張三&#10;李四&#10;王五"
                          className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                        />
                        <button 
                          onClick={handlePasteSubmit}
                          disabled={!rawInput.trim()}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          添加姓名
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">當前名單 ({names.length})</h2>
                      {names.length > 0 && (
                        <button 
                          onClick={() => setNames([])}
                          className="text-sm text-red-600 hover:underline"
                        >
                          清空名單
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {names.map((person) => (
                        <div key={person.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 group">
                          <span className="text-sm font-medium text-slate-700 truncate">{person.name}</span>
                          <button 
                            onClick={() => setNames(names.filter(n => n.id !== person.id))}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {names.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 italic">
                          尚無名單數據
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'draw' && (
                <motion.div
                  key="draw"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="text-indigo-600 w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">幸運大抽籤</h2>
                      <p className="text-slate-500 mt-2">剩餘候選人: {availablePool.length}</p>
                    </div>

                    <div className="h-40 flex items-center justify-center mb-8">
                      <AnimatePresence mode="wait">
                        {currentDrawName ? (
                          <motion.div
                            key={currentDrawName}
                            initial={{ scale: 0.8, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.2, opacity: 0, y: -10 }}
                            className={cn(
                              "text-6xl font-black tracking-tighter",
                              isDrawing ? "text-slate-300" : "text-indigo-600 drop-shadow-lg"
                            )}
                          >
                            {currentDrawName}
                          </motion.div>
                        ) : (
                          <div className="text-slate-300 text-xl font-medium italic">
                            準備好開始了嗎？
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={startDraw}
                      disabled={isDrawing || availablePool.length === 0}
                      className={cn(
                        "px-12 py-4 rounded-2xl text-xl font-bold shadow-lg transition-all transform active:scale-95",
                        isDrawing || availablePool.length === 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1"
                      )}
                    >
                      {isDrawing ? '抽籤中...' : '開始抽籤'}
                    </button>
                  </div>

                  {winners.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" size={18} />
                        中獎名單
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {winners.map((winner, idx) => (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={winner.id}
                            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm border border-indigo-100 flex items-center gap-2"
                          >
                            <span className="opacity-50 text-xs">#{winners.length - idx}</span>
                            {winner.name}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'group' && (
                <motion.div
                  key="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row items-end gap-4 mb-8">
                      <div className="flex-1 space-y-2">
                        <label className="block text-sm font-medium text-slate-700">每組人數</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="2"
                            max="20"
                            value={groupSize}
                            onChange={(e) => setGroupSize(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <span className="w-12 text-center font-bold text-indigo-600 bg-indigo-50 py-1 rounded-md border border-indigo-100">
                            {groupSize}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={generateGroups}
                        disabled={names.length === 0}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        <Users size={18} />
                        開始分組
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {groups.map((group) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-50 rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                            <span className="font-bold text-slate-900">第 {group.id} 組</span>
                            <span className="text-xs font-medium text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                              {group.members.length} 人
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {group.members.map((member) => (
                              <div key={member.id} className="text-sm text-slate-600 flex items-center gap-2">
                                <ChevronRight size={12} className="text-indigo-400" />
                                {member.name}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                      {groups.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 italic">
                          設定分組人數並點擊「開始分組」
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">統計概覽</h3>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200 text-sm">總人數</span>
                    <span className="text-2xl font-black">{names.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200 text-sm">已中獎</span>
                    <span className="text-2xl font-black text-emerald-400">{winners.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200 text-sm">待抽籤</span>
                    <span className="text-2xl font-black text-amber-400">{availablePool.length}</span>
                  </div>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" />
                使用指南
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  在「名單來源」上傳 CSV 或貼上姓名。
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  切換到「獎品抽籤」進行隨機抽取（不重複）。
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  切換到「自動分組」設定每組人數並生成。
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-xs">
          © 2026 IT Support Toolbox • Crafted for efficiency
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
