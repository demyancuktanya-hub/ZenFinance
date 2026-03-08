import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface GithubHeatmapProps {
  transactions: Transaction[];
}

export default function GithubHeatmap({ transactions }: GithubHeatmapProps) {
  const days = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 364); // Last 365 days
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  const getIntensity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const total = dayTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
    
    if (total === 0) return 'bg-white/5';
    if (total < 1000) return 'bg-emerald-900/40';
    if (total < 5000) return 'bg-emerald-700/60';
    if (total < 10000) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
  };

  // Group days into weeks for the grid
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];
    
    days.forEach((day, i) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || i === days.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return result;
  }, [days]);

  return (
    <div className="glass-card p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Финансовая активность</h2>
        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider">
          <span>Меньше</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-white/5"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900/40"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700/60"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div>
          </div>
          <span>Больше</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1 shrink-0">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                title={`${format(day, 'd MMMM yyyy', { locale: ru })}: ${transactions.filter(t => t.date === format(day, 'yyyy-MM-dd')).length} транзакций`}
                className={`w-2.5 h-2.5 rounded-sm transition-colors ${getIntensity(day)}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between text-[10px] text-white/40">
        <div className="flex gap-8">
          <span>Пн</span>
          <span>Ср</span>
          <span>Пт</span>
        </div>
        <p className="italic">Статистика за последние 365 дней</p>
      </div>
    </div>
  );
}
