export interface Transaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

export interface Budget {
  category: string;
  amount: number;
}

export interface Stats {
  totalIncome: number;
  totalExpenses: number;
  trends?: { month: string, income: number, expenses: number }[];
}

export interface RecurringPayment {
  id: number;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  day_of_month: number;
  last_processed?: string;
}

export interface Investment {
  id: number;
  name: string;
  amount: number;
  type: 'stock' | 'crypto' | 'bond' | 'other';
  purchase_date: string;
  current_value: number;
}

export type Currency = 'RUB' | 'USD' | 'EUR';

export const CURRENCIES: Record<Currency, { symbol: string, label: string }> = {
  RUB: { symbol: '₽', label: 'Рубли' },
  USD: { symbol: '$', label: 'Доллары' },
  EUR: { symbol: '€', label: 'Евро' }
};

export const INCOME_CATEGORIES = [
  'Зарплата',
  'Фриланс',
  'Подарки',
  'Другое'
];

export const EXPENSE_CATEGORIES = [
  'Еда',
  'Транспорт',
  'Жилье',
  'Развлечения',
  'Здоровье',
  'Покупки',
  'Коммунальные услуги',
  'Другое'
];

export const CATEGORIES = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];
