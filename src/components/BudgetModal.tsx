import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, Currency, CURRENCIES } from '../types';
import { X, Save, Target } from 'lucide-react';

interface Budget {
  category: string;
  amount: number;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export default function BudgetModal({ isOpen, onClose, currencySymbol }: BudgetModalProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBudgets();
    }
  }, [isOpen]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (category: string, amount: number) => {
    setSaving(true);
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount })
      });
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Управление бюджетами</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm text-white/40 mb-6">
            Установите ежемесячные лимиты для каждой категории, чтобы лучше контролировать свои расходы.
          </p>

          {loading ? (
            <div className="py-20 text-center text-white/20">Загрузка бюджетов...</div>
          ) : (
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map(category => {
                const budget = budgets.find(b => b.category === category);
                return (
                  <div key={category} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{category}</p>
                      <p className="text-xs text-white/40">Лимит на месяц</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">{currencySymbol}</span>
                      <input 
                        type="number"
                        defaultValue={budget?.amount || 0}
                        onBlur={(e) => handleSaveBudget(category, parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 text-center">
          <button 
            onClick={onClose}
            className="btn-primary px-8 py-3"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
