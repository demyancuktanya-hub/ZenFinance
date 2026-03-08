import React, { useState } from 'react';
import { X, Target, Save } from 'lucide-react';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: { name: string; target: number };
  onSave: (goal: { name: string; target: number }) => void;
  currencySymbol: string;
}

export default function SavingsGoalModal({ 
  isOpen, 
  onClose, 
  currentGoal, 
  onSave, 
  currencySymbol 
}: SavingsGoalModalProps) {
  const [formData, setFormData] = useState(currentGoal);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Цель накопления</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Название цели</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder:text-white/20"
              placeholder="Например: Новый MacBook Pro"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Целевая сумма ({currencySymbol})</label>
            <input
              required
              type="number"
              value={formData.target || ''}
              onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white"
              placeholder="0"
            />
          </div>

          <p className="text-xs text-white/40 italic">
            Прогресс будет рассчитываться автоматически на основе вашего текущего баланса.
          </p>

          <button type="submit" className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Сохранить цель
          </button>
        </form>
      </div>
    </div>
  );
}
