import React, { useEffect, useState } from 'react';
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { X } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  currencySymbol: string;
}

export default function AddTransactionModal({ isOpen, onClose, onAdd, currencySymbol }: AddTransactionModalProps) {
  const initialState = {
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialState);

  // Update category when type changes
  useEffect(() => {
    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!categories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [formData.type]);

  if (!isOpen) return null;

  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData(initialState);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div>
            <h2 className="text-xl font-semibold text-white">Добавить транзакцию</h2>
            <p className="text-xs text-white/40">Введите данные транзакции</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                formData.type === 'expense' ? 'bg-white/10 text-rose-400 shadow-sm border border-white/10' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Расход
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                formData.type === 'income' ? 'bg-white/10 text-emerald-400 shadow-sm border border-white/10' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Доход
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Сумма ({currencySymbol})</label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-white/20"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Категория</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-white appearance-none cursor-pointer"
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#1e293b]">{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Дата</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Описание</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-white placeholder:text-white/20"
              placeholder="На что потратили?"
            />
          </div>

          <button type="submit" className="w-full btn-primary py-4 mt-4 text-lg">
            Сохранить транзакцию
          </button>
        </form>
      </div>
    </div>
  );
}
