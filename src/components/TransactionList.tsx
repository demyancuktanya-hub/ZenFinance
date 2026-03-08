import React from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  currencySymbol: string;
  budgets: { category: string, amount: number }[];
}

export default function TransactionList({ transactions, onDelete, currencySymbol, budgets }: TransactionListProps) {
  const getCategoryTotal = (category: string) => {
    return transactions
      .filter(t => t.category === category && t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Последние транзакции</h2>
      </div>
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              <th className="px-6 py-4">Транзакция</th>
              <th className="px-6 py-4">Категория</th>
              <th className="px-6 py-4">Дата</th>
              <th className="px-6 py-4 text-right">Сумма</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {transactions.length === 0 ? (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    Транзакций пока нет. Добавьте первую!
                  </td>
                </motion.tr>
              ) : (
                transactions.map((t) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={t.id} 
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-white">{t.description || t.category}</p>
                          <p className="text-xs text-white/40 capitalize">{t.type === 'income' ? 'доход' : 'расход'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-white/60">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">
                      {format(new Date(t.date), 'MMM d, yyyy')}
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold text-sm ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      <div className="flex items-center justify-end gap-2">
                        {t.type === 'expense' && budgets.find(b => b.category === t.category && b.amount > 0 && getCategoryTotal(t.category) > b.amount) && (
                          <div className="group/alert relative">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-amber-500 text-white text-[10px] rounded opacity-0 group-hover/alert:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Бюджет превышен!
                            </div>
                          </div>
                        )}
                        {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-white/20 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              Транзакций пока нет
            </div>
          ) : (
            transactions.map((t) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={t.id}
                className="p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{t.description || t.category}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider">
                      <span>{t.category}</span>
                      <span>•</span>
                      <span>{format(new Date(t.date), 'd MMM')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-right font-semibold text-sm ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(0)}
                  </div>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
