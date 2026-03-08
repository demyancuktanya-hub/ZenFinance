import React, { useState } from 'react';
import { Github, Cloud, CheckCircle2, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface GithubSyncViewProps {
  githubToken: string | null;
  githubUser: any;
  onConnect: () => void;
}

export default function GithubSyncView({ githubToken, githubUser, onConnect }: GithubSyncViewProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean, url?: string, error?: string } | null>(null);

  const handleSync = async () => {
    if (!githubToken) return;
    
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken, repoName: 'ZenFinance' })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ success: true, url: data.url });
      } else {
        setSyncResult({ success: false, error: data.error });
      }
    } catch (error: any) {
      setSyncResult({ success: false, error: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Синхронизация с GitHub</h1>
        <p className="text-white/60">Перенесите свой проект на GitHub для бесплатного хостинга и независимости.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Статус GitHub</h3>
              <p className="text-xs text-white/40">
                {githubUser ? `Подключено как @${githubUser.login}` : 'Не подключено'}
              </p>
            </div>
          </div>

          {!githubToken ? (
            <button 
              onClick={onConnect}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              Подключить GitHub
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-400">Аккаунт успешно подключен</span>
              </div>
              
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Синхронизация...
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5" />
                    Загрузить код в GitHub
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-white/10">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4">Что произойдет?</h4>
            <ul className="space-y-3">
              {[
                'Создастся новый репозиторий "ZenFinance"',
                'Все файлы проекта будут загружены в GitHub',
                'Вы сможете развернуть проект на Vercel или Netlify',
                'Иконка на главном экране заработает идеально'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {syncResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border ${
                syncResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-rose-500/10 border-rose-500/20'
              }`}
            >
              {syncResult.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Успешно синхронизировано!</span>
                  </div>
                  <p className="text-sm text-white/60">Ваш код теперь доступен в GitHub. Вы можете открыть репозиторий и настроить хостинг.</p>
                  <a 
                    href={syncResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:underline"
                  >
                    Открыть репозиторий <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-rose-400">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-bold">Ошибка синхронизации</span>
                  </div>
                  <p className="text-sm text-white/60">{syncResult.error}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
