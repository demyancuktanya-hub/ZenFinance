import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, Delete, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PinAuthProps {
  onAuthenticated: () => void;
}

export default function PinAuth({ onAuthenticated }: PinAuthProps) {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(localStorage.getItem('app_pin'));
  const [isSettingUp, setIsSettingUp] = useState(!localStorage.getItem('app_pin'));
  const [setupStep, setSetupStep] = useState(1); // 1: Enter new, 2: Confirm
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);

      if (newPin.length === 4) {
        if (isSettingUp) {
          if (setupStep === 1) {
            setTempPin(newPin);
            setPin('');
            setSetupStep(2);
          } else {
            if (newPin === tempPin) {
              localStorage.setItem('app_pin', newPin);
              setStoredPin(newPin);
              setIsSettingUp(false);
              onAuthenticated();
            } else {
              setError('ПИН-коды не совпадают');
              setPin('');
              setSetupStep(1);
            }
          }
        } else {
          if (newPin === storedPin) {
            onAuthenticated();
          } else {
            setError('Неверный ПИН-код');
            setPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {pin.length === 4 && !error ? (
              <Unlock className="w-10 h-10 text-emerald-400" />
            ) : (
              <Lock className="w-10 h-10 text-indigo-400" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {isSettingUp 
            ? (setupStep === 1 ? 'Установите ПИН-код' : 'Подтвердите ПИН-код') 
            : 'Введите ПИН-код'}
        </h1>
        <p className="text-white/40 text-sm mb-10">
          {isSettingUp 
            ? 'Защитите свои финансовые данные' 
            : 'Для доступа к ZenFinance'}
        </p>

        <div className="flex justify-center gap-4 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length >= i 
                  ? 'bg-indigo-500 border-indigo-500 scale-125 shadow-lg shadow-indigo-500/50' 
                  : 'border-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-rose-400 text-sm mb-6 font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-full aspect-square bg-white/5 hover:bg-white/10 active:bg-indigo-600/20 rounded-2xl text-2xl font-semibold transition-all border border-white/5"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumberClick('0')}
            className="w-full aspect-square bg-white/5 hover:bg-white/10 active:bg-indigo-600/20 rounded-2xl text-2xl font-semibold transition-all border border-white/5"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <Delete className="w-8 h-8" />
          </button>
        </div>

        {isSettingUp && (
          <button 
            onClick={() => onAuthenticated()}
            className="mt-10 text-white/20 hover:text-white/40 text-xs uppercase tracking-widest font-bold transition-colors"
          >
            Пропустить (не рекомендуется)
          </button>
        )}
      </motion.div>
    </div>
  );
}
