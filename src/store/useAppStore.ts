import { create } from 'zustand';
import dayjs from 'dayjs';
import {
  AppState,
  UserProfile,
  Grade,
  QuestionType,
  Difficulty,
  WrongQuestion,
  PracticeRecord,
  Level,
  Reward,
  AppSettings,
  DailyPlan
} from '@/types';
import { getStorage, setStorage } from '@/utils/storage';
import { getWrongType } from '@/utils/mathGenerator';
import { levelsData } from '@/data/levels';
import { rewardsData } from '@/data/rewards';

const STORAGE_KEY = 'math_practice_app_state';

const defaultProfile: UserProfile = {
  name: '小达人',
  avatar: 'https://picsum.photos/id/64/200/200',
  grade: 'grade2',
  points: 0,
  totalDays: 0,
  continuousDays: 0,
  totalQuestions: 0,
  correctRate: 0,
  lastCheckIn: ''
};

const defaultSettings: AppSettings = {
  soundEnabled: true,
  speechEnabled: true,
  restReminderEnabled: true,
  restInterval: 20,
  parentPassword: '1234',
  difficulty: 'medium'
};

const getInitialState = (): AppState => {
  const saved = getStorage<AppState | null>(STORAGE_KEY, null);
  if (saved) {
    return saved;
  }
  
  const today = dayjs().format('YYYY-MM-DD');
  const defaultPlan: DailyPlan = {
    id: `plan_${today}`,
    date: today,
    questionCount: 20,
    questionTypes: ['addition', 'subtraction'],
    grade: 'grade2',
    timeLimit: 600,
    completed: false,
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };
  
  return {
    userProfile: defaultProfile,
    currentGrade: 'grade2',
    selectedQuestionTypes: ['addition', 'subtraction'],
    dailyPlan: defaultPlan,
    wrongQuestions: [],
    practiceRecords: [],
    levels: levelsData,
    rewards: rewardsData,
    settings: defaultSettings
  };
};

interface AppStore extends AppState {
  setState: (state: Partial<AppState>) => void;
  saveToStorage: () => void;
  setGrade: (grade: Grade) => void;
  setQuestionTypes: (types: QuestionType[]) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  addWrongQuestion: (question: WrongQuestion) => void;
  removeWrongQuestion: (questionId: string) => void;
  clearWrongQuestions: () => void;
  addPracticeRecord: (record: PracticeRecord) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateLevelStars: (levelId: number, stars: number) => void;
  unlockNextLevel: (levelId: number) => void;
  addPoints: (points: number) => void;
  redeemReward: (rewardId: string) => boolean;
  checkIn: () => boolean;
  updateDailyPlan: (plan: Partial<DailyPlan>) => void;
  completeDailyPlan: (totalQuestions?: number, questionTypes?: QuestionType[], timeLimit?: number, isTimeLimitFromPlan?: boolean) => boolean;
  updateSettings: (settings: Partial<AppSettings>) => void;
  verifyParentPassword: (password: string) => boolean;
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...getInitialState(),
  
  setState: (state) => set(state),
  
  saveToStorage: () => {
    const state = get();
    setStorage(STORAGE_KEY, state);
  },
  
  setGrade: (grade) => {
    set({ currentGrade: grade });
    get().saveToStorage();
  },
  
  setQuestionTypes: (types) => {
    set({ selectedQuestionTypes: types });
    get().saveToStorage();
  },
  
  setDifficulty: (difficulty) => {
    set({
      settings: { ...get().settings, difficulty }
    });
    get().saveToStorage();
  },
  
  addWrongQuestion: (question) => {
    const existing = get().wrongQuestions.find(q => q.id === question.id);
    if (existing) {
      set({
        wrongQuestions: get().wrongQuestions.map(q =>
          q.id === question.id
            ? { ...q, wrongCount: q.wrongCount + 1, lastWrongTime: question.lastWrongTime }
            : q
        )
      });
    } else {
      set({
        wrongQuestions: [...get().wrongQuestions, question]
      });
    }
    get().saveToStorage();
  },
  
  removeWrongQuestion: (questionId) => {
    set({
      wrongQuestions: get().wrongQuestions.filter(q => q.id !== questionId)
    });
    get().saveToStorage();
  },
  
  clearWrongQuestions: () => {
    set({ wrongQuestions: [] });
    get().saveToStorage();
  },
  
  addPracticeRecord: (record) => {
    const records = [...get().practiceRecords, record];
    const profile = get().userProfile;
    
    const totalQuestions = profile.totalQuestions + record.totalQuestions;
    const correctCount = records.reduce((sum, r) => sum + r.correctCount, 0);
    const totalAll = records.reduce((sum, r) => sum + r.totalQuestions, 0);
    const correctRate = totalAll > 0 ? Math.round((correctCount / totalAll) * 100) : 0;
    
    set({
      practiceRecords: records,
      userProfile: { ...profile, totalQuestions, correctRate }
    });
    get().saveToStorage();
  },
  
  updateUserProfile: (profile) => {
    set({
      userProfile: { ...get().userProfile, ...profile }
    });
    get().saveToStorage();
  },
  
  updateLevelStars: (levelId, stars) => {
    set({
      levels: get().levels.map(level =>
        level.id === levelId
          ? { ...level, stars: Math.max(level.stars, stars) }
          : level
      )
    });
    get().saveToStorage();
  },
  
  unlockNextLevel: (levelId) => {
    set({
      levels: get().levels.map(level =>
        level.id === levelId + 1
          ? { ...level, unlocked: true }
          : level
      )
    });
    get().saveToStorage();
  },
  
  addPoints: (points) => {
    const profile = get().userProfile;
    set({
      userProfile: { ...profile, points: profile.points + points }
    });
    get().saveToStorage();
  },
  
  redeemReward: (rewardId) => {
    const reward = get().rewards.find(r => r.id === rewardId);
    const profile = get().userProfile;
    
    if (!reward || reward.stock <= 0 || profile.points < reward.points) {
      return false;
    }
    
    set({
      userProfile: { ...profile, points: profile.points - reward.points },
      rewards: get().rewards.map(r =>
        r.id === rewardId
          ? { ...r, stock: r.stock - 1 }
          : r
      )
    });
    get().saveToStorage();
    return true;
  },
  
  checkIn: () => {
    const today = dayjs().format('YYYY-MM-DD');
    const profile = get().userProfile;
    
    if (profile.lastCheckIn === today) {
      return false;
    }
    
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const continuousDays = profile.lastCheckIn === yesterday
      ? profile.continuousDays + 1
      : 1;
    
    const bonusPoints = continuousDays >= 7 ? 50 : continuousDays >= 3 ? 20 : 10;
    
    set({
      userProfile: {
        ...profile,
        totalDays: profile.totalDays + 1,
        continuousDays,
        lastCheckIn: today,
        points: profile.points + bonusPoints
      }
    });
    get().saveToStorage();
    return true;
  },
  
  updateDailyPlan: (plan) => {
    const currentPlan = get().dailyPlan;
    if (currentPlan) {
      set({ dailyPlan: { ...currentPlan, ...plan, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } });
      get().saveToStorage();
    }
  },
  
  completeDailyPlan: (totalQuestions?: number, questionTypes?: QuestionType[], timeLimit?: number, isTimeLimitFromPlan?: boolean) => {
    const plan = get().dailyPlan;
    const today = dayjs().format('YYYY-MM-DD');
    
    if (plan && plan.date === today) {
      if (totalQuestions !== undefined && totalQuestions < plan.questionCount) {
        console.log('[Plan] 题量不足', { actual: totalQuestions, required: plan.questionCount });
        return false;
      }
      
      if (questionTypes && plan.questionTypes.length > 0) {
        const hasAllTypes = plan.questionTypes.every(type => questionTypes.includes(type));
        const noExtraTypes = questionTypes.every(type => plan.questionTypes.includes(type));
        if (!hasAllTypes || !noExtraTypes) {
          console.log('[Plan] 题型不匹配', { actual: questionTypes, required: plan.questionTypes });
          return false;
        }
      }
      
      if (isTimeLimitFromPlan !== undefined && !isTimeLimitFromPlan) {
        console.log('[Plan] 限时来源不是计划');
        return false;
      }
      
      if (timeLimit !== undefined && plan.timeLimit !== undefined && timeLimit !== plan.timeLimit) {
        console.log('[Plan] 限时值不匹配', { actual: timeLimit, required: plan.timeLimit });
        return false;
      }
      
      set({
        dailyPlan: {
          ...plan,
          completed: true,
          completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      });
      get().saveToStorage();
      console.log('[Plan] 今日计划已完成');
      return true;
    }
    return false;
  },
  
  updateSettings: (settings) => {
    set({
      settings: { ...get().settings, ...settings }
    });
    get().saveToStorage();
  },
  
  verifyParentPassword: (password) => {
    return get().settings.parentPassword === password;
  }
}));

export const useCurrentGrade = () => useAppStore(state => state.currentGrade);
export const useSelectedQuestionTypes = () => useAppStore(state => state.selectedQuestionTypes);
export const useUserProfile = () => useAppStore(state => state.userProfile);
export const useWrongQuestions = () => useAppStore(state => state.wrongQuestions);
export const useLevels = () => useAppStore(state => state.levels);
export const useRewards = () => useAppStore(state => state.rewards);
export const useSettings = () => useAppStore(state => state.settings);
export const useDailyPlan = () => useAppStore(state => state.dailyPlan);
export const usePracticeRecords = () => useAppStore(state => state.practiceRecords);
