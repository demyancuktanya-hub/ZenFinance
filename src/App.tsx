import React, { useState, useEffect } from 'react';
import { Transaction, Stats, CATEGORIES, Currency, CURRENCIES } from './types';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import BudgetModal from './components/BudgetModal';
import SavingsGoalModal from './components/SavingsGoalModal';
import AiInsights from './components/AiInsights';
import AppIconsGenerator from './components/AppIconsGenerator';
import GithubHeatmap from './components/GithubHeatmap';
import RecurringPaymentsModal from './components/RecurringPaymentsModal';
import TrendChart from './components/TrendChart';
import InvestmentView from './components/InvestmentView';
import GithubSyncView from './components/GithubSyncView';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  Target,
  Image as ImageIcon,
  Github,
  Repeat,
  Download,
  Menu,
  X,
  Briefcase,
  Cloud
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'motion/react';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1,
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value]);

  return <>{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpenses: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>('RUB');
  const [savingsGoal, setSavingsGoal] = useState({ name: '', target: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Все');
  const [budgets, setBudgets] = useState<{ category: string, amount: number }[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'icons' | 'investments' | 'github_sync'>('dashboard');
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [githubUser, setGithubUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const insightsRef = React.useRef<HTMLDivElement>(null);
  const chartsRef = React.useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [tRes, sRes, bRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/stats'),
        fetch('/api/budgets')
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      const bData = await bRes.json();
      setTransactions(tData);
      setStats(sData || { totalIncome: 0, totalExpenses: 0 });
      setBudgets(bData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGithubUser = async (token: string) => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGithubUser(data);
      } else {
        setGithubToken(null);
        localStorage.removeItem('github_token');
      }
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
    }
  };

  useEffect(() => {
    fetchData();
    if (githubToken) {
      fetchGithubUser(githubToken);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const token = event.data.token;
        setGithubToken(token);
        localStorage.setItem('github_token', token);
        fetchGithubUser(token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [githubToken]);

  const handleConnectGithub = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting GitHub URL:', error);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: transactions
      .filter(t => t.category === cat && t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  const balance = stats.totalIncome - stats.totalExpenses;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'Все' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const barData = [
    { name: 'Доходы', amount: stats.totalIncome, fill: '#10B981' },
    { name: 'Расходы', amount: stats.totalExpenses, fill: '#EF4444' }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#1e293b]/50 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ZenFinance</h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto p-2 text-white/40 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Дашборд
          </button>
          <button 
            onClick={() => { setActiveView('icons'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'icons' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Иконки для GitHub
          </button>
          <button 
            onClick={() => { setActiveView('investments'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'investments' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Инвестиции
          </button>
          <button 
            onClick={() => { setActiveView('github_sync'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'github_sync' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Синхронизация GitHub
          </button>
          <button 
            onClick={() => { setIsBudgetModalOpen(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <PieChartIcon className="w-4 h-4" />
            Бюджеты
          </button>
          <button 
            onClick={() => { setIsRecurringModalOpen(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Регулярные
          </button>
          <button 
            onClick={() => { handleConnectGithub(); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              githubToken ? 'text-emerald-400 bg-emerald-500/5' : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            {githubUser ? githubUser.login : 'Подключить GitHub'}
          </button>
          <button 
            onClick={() => { alert('Раздел Настройки находится в разработке'); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
        </nav>

        <div className="mt-auto p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Pro План</p>
          <p className="text-xs text-white/60 mb-3">Получите продвинутые советы ИИ и безлимитные бюджеты.</p>
          <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors">
            Обновить сейчас
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
        {activeView === 'icons' ? (
          <AppIconsGenerator 
            onBack={() => setActiveView('dashboard')} 
            githubToken={githubToken}
            onConnectGithub={handleConnectGithub}
          />
        ) : activeView === 'investments' ? (
          <InvestmentView currency={currency} />
        ) : activeView === 'github_sync' ? (
          <GithubSyncView 
            githubToken={githubToken} 
            githubUser={githubUser} 
            onConnect={handleConnectGithub} 
          />
        ) : (
          <>
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
              <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="flex items-center gap-4 lg:hidden">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <Wallet className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold text-white">Финансовый обзор</h1>
                  <p className="text-sm text-white/60">С возвращением! Вот что происходит с вашими деньгами.</p>
                </div>
                <div className="flex items-center gap-3 lg:hidden">
                  <button 
                    onClick={handleExport}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    title="Экспорт в CSV"
                  >
                    <Download className="w-5 h-5 text-white/80" />
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-3 flex-1 sm:flex-none">
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {Object.entries(CURRENCIES).map(([code, { label, symbol }]) => (
                      <option key={code} value={code} className="bg-[#1e293b]">
                        {symbol} {label}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleExport}
                    className="hidden lg:flex p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    title="Экспорт в CSV"
                  >
                    <Download className="w-5 h-5 text-white/80" />
                  </button>
                  <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors relative">
                    <Bell className="w-5 h-5 text-white/80" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f172a]"></span>
                  </button>
                </div>

                <div className="relative flex-1 lg:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Поиск..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-white/30 transition-all"
                  />
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="hidden lg:flex btn-primary items-center gap-2 px-6 py-2.5"
                >
                  <Plus className="w-4 h-4" />
                  Добавить транзакцию
                </button>
              </div>
            </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 bg-indigo-600 text-white overflow-hidden relative shadow-indigo-500/20"
          >
            <div className="relative z-10">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">Общий баланс</p>
              <h3 className="text-3xl font-bold mb-4">
                {CURRENCIES[currency].symbol}
                <AnimatedNumber value={stats.totalIncome - stats.totalExpenses} />
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="px-1.5 py-0.5 bg-white/20 rounded flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  +2.4%
                </span>
                <span>чем в прошлом месяце</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Общий доход</p>
            </div>
            <h3 className="text-2xl font-bold text-white">{CURRENCIES[currency].symbol}{(stats.totalIncome ?? 0).toLocaleString()}</h3>
            <p className="text-xs text-white/40 mt-2">
              {transactions.filter(t => t.type === 'income').length} транзакций в этом месяце
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Общие расходы</p>
            </div>
            <h3 className="text-2xl font-bold text-white">{CURRENCIES[currency].symbol}{(stats.totalExpenses ?? 0).toLocaleString()}</h3>
            <p className="text-xs text-white/40 mt-2">
              {transactions.filter(t => t.type === 'expense').length} транзакций в этом месяце
            </p>
          </motion.div>
        </div>

        {/* Trends Section */}
        <div className="mb-8">
          <TrendChart trends={stats.trends || []} currencySymbol={CURRENCIES[currency].symbol} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-6" ref={chartsRef}>
            <div className="glass-card p-6 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-500 border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Сравнение потоков</h2>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Доход</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Расход</span>
                  </div>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff40', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e1b4b', color: '#fff' }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-500 border-white/10">
              <h2 className="text-lg font-semibold mb-6 text-white">Расходы по категориям</h2>
              <div className="h-[300px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e1b4b', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40 text-sm">
                    Нет данных о расходах для визуализации
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {categoryData.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs text-white/40 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">История транзакций</h2>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 focus:outline-none hover:bg-white/10 transition-colors cursor-pointer"
              >
                <option value="Все">Все категории</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#1e293b]">{cat}</option>
                ))}
              </select>
            </div>

            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction} 
              currencySymbol={CURRENCIES[currency].symbol}
              budgets={budgets}
            />
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6" ref={insightsRef}>
            <GithubHeatmap transactions={transactions} />
            
            <AiInsights 
              transactions={transactions} 
              stats={stats} 
              currencySymbol={CURRENCIES[currency].symbol}
              budgets={budgets}
            />
            
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">Быстрые действия</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => chartsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 border border-white/5"
                >
                  <div className="p-2 bg-white/10 rounded-lg shadow-sm">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-xs font-medium text-white/80">Отчеты</span>
                </button>
                <button 
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 border border-white/5"
                >
                  <div className="p-2 bg-white/10 rounded-lg shadow-sm">
                    <PieChartIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-white/80">Бюджеты</span>
                </button>
                <button 
                  onClick={() => setActiveView('icons')}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 border border-white/5"
                >
                  <div className="p-2 bg-white/10 rounded-lg shadow-sm">
                    <ImageIcon className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-xs font-medium text-white/80">Иконки</span>
                </button>
              </div>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsGoalModalOpen(true)}
              className="glass-card p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-sm font-medium mb-4">Цель накопления</p>
              <div className="flex justify-between text-xs mb-2">
                <span>{savingsGoal.name || 'Установите цель'}</span>
                <span>{savingsGoal.target > 0 ? Math.min(100, Math.round(((balance > 0 ? balance : 0) / savingsGoal.target) * 100)) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsGoal.target > 0 ? Math.min(100, ((balance > 0 ? balance : 0) / savingsGoal.target) * 100) : 0}%` }}
                  className="h-full bg-white"
                ></motion.div>
              </div>
              <p className="text-[10px] text-white/60">
                {savingsGoal.target === 0 
                  ? 'Нажмите, чтобы задать свою первую цель.'
                  : balance >= savingsGoal.target 
                    ? 'Поздравляем! Цель достигнута!' 
                    : `Вам осталось ${CURRENCIES[currency].symbol}${Math.max(0, savingsGoal.target - (balance > 0 ? balance : 0)).toLocaleString()} до цели.`}
              </p>
            </motion.div>
          </div>
        </div>
        </>
        )}
      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddTransaction} 
        currencySymbol={CURRENCIES[currency].symbol}
      />

      <BudgetModal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        currencySymbol={CURRENCIES[currency].symbol}
      />

      {isGoalModalOpen && (
        <SavingsGoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          currentGoal={savingsGoal}
          onSave={setSavingsGoal}
          currencySymbol={CURRENCIES[currency].symbol}
        />
      )}

      <RecurringPaymentsModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        currencySymbol={CURRENCIES[currency].symbol}
      />
    </div>
  );
}
