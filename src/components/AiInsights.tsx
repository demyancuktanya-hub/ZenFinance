import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, Stats } from '../types';
import { Sparkles, BrainCircuit, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface AiInsightsProps {
  transactions: Transaction[];
  stats: Stats;
  currencySymbol: string;
  budgets: { category: string, amount: number }[];
}

export default function AiInsights({ transactions, stats, currencySymbol, budgets }: AiInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        Проанализируй следующие финансовые данные и предоставь 3-4 кратких, полезных совета.
        Ответ должен быть на русском языке в формате Markdown. Сосредоточься на структуре расходов, потенциальной экономии и общем финансовом состоянии.
        
        Общий доход: ${currencySymbol}${stats.totalIncome}
        Общие расходы: ${currencySymbol}${stats.totalExpenses}
        Баланс: ${currencySymbol}${stats.totalIncome - stats.totalExpenses}
        
        Установленные бюджеты:
        ${budgets.map(b => `- ${b.category}: ${currencySymbol}${b.amount}`).join('\n')}
        
        Последние транзакции:
        ${transactions.slice(0, 10).map(t => `- ${t.date}: ${t.type === 'income' ? 'доход' : 'расход'} ${currencySymbol}${t.amount} в категории ${t.category} (${t.description})`).join('\n')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      setInsight(response.text || "Не удалось сгенерировать советы в данный момент.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setInsight("Ошибка подключения к ИИ-советнику. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">ИИ Финансовый советник</h2>
        </div>
        <button 
          onClick={generateInsight}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {insight ? 'Обновить советы' : 'Получить советы'}
        </button>
      </div>

      {!insight && !loading && (
        <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
          <p className="text-sm text-white/40 mb-2">Получите персональные советы на основе ваших трат</p>
          <button 
            onClick={generateInsight}
            className="text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:underline"
          >
            Проанализировать данные
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-white/5 rounded w-3/4"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
          <div className="h-4 bg-white/5 rounded w-5/6"></div>
        </div>
      )}

      {insight && !loading && (
        <div className="prose prose-sm prose-invert max-w-none text-white/80">
          <Markdown>{insight}</Markdown>
        </div>
      )}
    </div>
  );
}
