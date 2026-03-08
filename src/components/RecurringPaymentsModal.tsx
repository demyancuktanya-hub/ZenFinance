import React, { useState, useEffect } from 'react';
import { RecurringPayment, CATEGORIES, CURRENCIES, Currency } from '../types';
import { Plus, Trash2, Calendar, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecurringPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export default function RecurringPaymentsModal({ isOpen, onClose, currencySymbol }: RecurringPaymentsModalProps) {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    category: CATEGORIES[0],
    description: '',
    type: 'expense' as 'income' | 'expense',
    day_of_month: 1
  });

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching recurring payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchPayments();
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPayment,
          amount: parseFloat(newPayment.amount)
        })
      });
      setIsAdding(false);
      setNewPayment({
        amount: '',
        category: CATEGORIES[0],
        description: '',
        type: 'expense',
        day_of_month: 1
      });
      fetchPayments();
    } catch (error) {
      console.error('Error adding recurring payment:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      fetchPayments();
    } catch (error) {
      console.error('Error deleting recurring payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Repeat className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Регулярные платежи</h2>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {isAdding ? (
              <form onSubmit={handleAdd} className="space-y-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase mb-1.5 ml-1">Сумма</label>
                    <input
                      type="number"
                      required
                      value={newPayment.amount}
                      onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase mb-1.5 ml-1">День месяца</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={newPayment.day_of_month}
                      onChange={e => setNewPayment({ ...newPayment, day_of_month: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase mb-1.5 ml-1">Категория</label>
                    <select
                      value={newPayment.category}
                      onChange={e => setNewPayment({ ...newPayment, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#1e293b]">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 uppercase mb-1.5 ml-1">Тип</label>
                    <select
                      value={newPayment.type}
                      onChange={e => setNewPayment({ ...newPayment, type: e.target.value as 'income' | 'expense' })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="expense" className="bg-[#1e293b]">Расход</option>
                      <option value="income" className="bg-[#1e293b]">Доход</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase mb-1.5 ml-1">Описание</label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={e => setNewPayment({ ...newPayment, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Напр. Подписка Netflix"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 btn-primary py-3">Сохранить</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-white/60 hover:text-white transition-colors">Отмена</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 mb-6"
              >
                <Plus className="w-5 h-5" />
                Добавить регулярный платеж
              </button>
            )}

            <div className="space-y-3">
              {payments.length === 0 && !loading && !isAdding && (
                <div className="text-center py-12 text-white/20">
                  <Repeat className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>У вас пока нет регулярных платежей</p>
                </div>
              )}
              {payments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${payment.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{payment.description || payment.category}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>{payment.category}</span>
                        <span>•</span>
                        <span>{payment.day_of_month}-е число каждого месяца</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${payment.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {payment.type === 'income' ? '+' : '-'}{payment.amount.toLocaleString()}{currencySymbol}
                    </span>
                    <button 
                      onClick={() => handleDelete(payment.id)}
                      className="p-2 text-white/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
