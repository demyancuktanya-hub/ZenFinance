import React, { useState, useEffect } from 'react';
import { Investment, Currency, CURRENCIES } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Briefcase, 
  LineChart, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InvestmentViewProps {
  currency: Currency;
}

export default function InvestmentView({ currency }: InvestmentViewProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    amount: '',
    type: 'stock' as Investment['type'],
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: ''
  });

  const fetchInvestments = async () => {
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      setInvestments(data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvestment,
          amount: parseFloat(newInvestment.amount),
          current_value: parseFloat(newInvestment.current_value || newInvestment.amount)
        })
      });
      if (res.ok) {
        fetchInvestments();
        setIsModalOpen(false);
        setNewInvestment({
          name: '',
          amount: '',
          type: 'stock',
          purchase_date: new Date().toISOString().split('T')[0],
          current_value: ''
        });
      }
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/investments/${id}`, { method: 'DELETE' });
      fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalCurrentValue = investments.reduce((acc, inv) => acc + inv.current_value, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const pieData = [
    { name: 'Акции', value: investments.filter(i => i.type === 'stock').reduce((acc, i) => acc + i.current_value, 0) },
    { name: 'Крипто', value: investments.filter(i => i.type === 'crypto').reduce((acc, i) => acc + i.current_value, 0) },
    { name: 'Облигации', value: investments.filter(i => i.type === 'bond').reduce((acc, i) => acc + i.current_value, 0) },
    { name: 'Другое', value: investments.filter(i => i.type === 'other').reduce((acc, i) => acc + i.current_value, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Инвестиционный портфель</h1>
          <p className="text-sm text-white/60">Отслеживайте свои активы и их рост в реальном времени.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить актив
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Всего инвестировано</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {CURRENCIES[currency].symbol}{totalInvested.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <LineChart className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Текущая стоимость</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {CURRENCIES[currency].symbol}{totalCurrentValue.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-card p-6 border-l-4 ${totalProfit >= 0 ? 'border-emerald-500' : 'border-rose-500'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {totalProfit >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
            </div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Прибыль / Убыток</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalProfit >= 0 ? '+' : ''}{CURRENCIES[currency].symbol}{totalProfit.toLocaleString()}
            </h3>
            <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
              ({totalProfit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%)
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Ваши активы</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <th className="px-6 py-4">Актив</th>
                  <th className="px-6 py-4">Тип</th>
                  <th className="px-6 py-4">Инвестировано</th>
                  <th className="px-6 py-4">Текущая цена</th>
                  <th className="px-6 py-4 text-right">Доходность</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      У вас пока нет инвестиций. Начните формировать портфель!
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => {
                    const profit = inv.current_value - inv.amount;
                    const percent = (profit / inv.amount) * 100;
                    return (
                      <tr key={inv.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-white">{inv.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">{inv.purchase_date}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-medium text-white/60 uppercase">
                            {inv.type === 'stock' ? 'Акция' : inv.type === 'crypto' ? 'Крипто' : inv.type === 'bond' ? 'Облигация' : 'Другое'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/60">
                          {CURRENCIES[currency].symbol}{inv.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {CURRENCIES[currency].symbol}{inv.current_value.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {percent.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-white/20 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Распределение</h2>
          </div>
          <div className="h-[250px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm italic">
                Нет данных для отображения
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-white/60">{d.name}</span>
                </div>
                <span className="font-medium text-white">
                  {((d.value / totalCurrentValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Новый актив</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Название актива</label>
                  <input
                    required
                    type="text"
                    value={newInvestment.name}
                    onChange={e => setNewInvestment({...newInvestment, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Напр. Apple Inc. или Bitcoin"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Тип</label>
                    <select
                      value={newInvestment.type}
                      onChange={e => setNewInvestment({...newInvestment, type: e.target.value as Investment['type']})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    >
                      <option value="stock" className="bg-[#1e293b]">Акция</option>
                      <option value="crypto" className="bg-[#1e293b]">Крипто</option>
                      <option value="bond" className="bg-[#1e293b]">Облигация</option>
                      <option value="other" className="bg-[#1e293b]">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Дата покупки</label>
                    <input
                      type="date"
                      value={newInvestment.purchase_date}
                      onChange={e => setNewInvestment({...newInvestment, purchase_date: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Сумма вложений</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newInvestment.amount}
                      onChange={e => setNewInvestment({...newInvestment, amount: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Текущая цена</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newInvestment.current_value}
                      onChange={e => setNewInvestment({...newInvestment, current_value: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="Оставьте пустым, если равна вложениям"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full btn-primary py-3 mt-4">
                  Добавить в портфель
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
