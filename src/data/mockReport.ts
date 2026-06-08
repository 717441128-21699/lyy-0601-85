import dayjs from 'dayjs';
import { WeeklyReport, DailyStats, WeakType, StrongType } from '@/types';

const generateDailyStats = (): DailyStats[] => {
  const stats: DailyStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const questionCount = Math.floor(Math.random() * 30) + 10;
    const correctRate = Math.floor(Math.random() * 30) + 70;
    const avgTime = Math.floor(Math.random() * 10) + 5;
    stats.push({ date, questionCount, correctRate, avgTime });
  }
  return stats;
};

export const mockWeeklyReport: WeeklyReport = {
  weekStart: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  weekEnd: dayjs().format('YYYY-MM-DD'),
  totalQuestions: 168,
  correctCount: 142,
  correctRate: 85,
  avgTimePerQuestion: 8,
  dailyStats: generateDailyStats(),
  weakTypes: [
    {
      type: 'division',
      typeName: '除法',
      wrongCount: 12,
      totalCount: 35,
      correctRate: 66
    },
    {
      type: 'multiplication',
      typeName: '乘法',
      wrongCount: 8,
      totalCount: 42,
      correctRate: 81
    }
  ],
  strongTypes: [
    {
      type: 'addition',
      typeName: '加法',
      correctRate: 95
    },
    {
      type: 'subtraction',
      typeName: '减法',
      correctRate: 90
    }
  ]
};
