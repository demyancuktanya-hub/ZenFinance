import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendChartProps {
  trends: { month: string, income: number, expenses: number }[];
  currencySymbol: string;
}

export default function TrendChart({ trends, currencySymbol }: TrendChartProps) {
  if (!trends || trends.length === 0) return null;

  const lastMonth = trends[trends.length - 1];
  const prevMonth = trends[trends.length - 2];

  const getChange = (current: number, prev: number) => {
    if (!prev) return 0;
    return ((current - prev) / prev) * 100;
  };

  const expenseChange = prevMonth ? getChange(lastMonth.expenses, prevMonth.expenses) : 0;
  const incomeChange = prevMonth ? getChange(lastMonth.income, prevMonth.income) : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Тренды финансов</h2>
          <p className="text-sm text-white/40">Динамика доходов и расходов за последние 12 месяцев</p>
        </div>
        
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Расходы (мес)</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{lastMonth.expenses.toLocaleString()}{currencySymbol}</span>
              {expenseChange !== 0 && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${expenseChange > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {expenseChange > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(expenseChange).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Доходы (мес)</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{lastMonth.income.toLocaleString()}{currencySymbol}</span>
              {incomeChange !== 0 && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${incomeChange > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {incomeChange > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(incomeChange).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => {
                const [y, m] = val.split('-');
                const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
                return months[parseInt(m) - 1];
              }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.2)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
              name="Доходы"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorExpense)" 
              name="Расходы"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
