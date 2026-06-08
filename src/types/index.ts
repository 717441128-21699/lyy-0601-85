export type Grade = 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5' | 'grade6';

export type QuestionType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  type: QuestionType;
  expression: string;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  timeSpent?: number;
  grade: Grade;
  difficulty: Difficulty;
}

export interface WrongQuestion extends Question {
  wrongCount: number;
  lastWrongTime: string;
  wrongType: string;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  grade: Grade;
  questionCount: number;
  timeLimit: number;
  passScore: number;
  stars: number;
  unlocked: boolean;
  reward: number;
}

export interface PracticeRecord {
  id: string;
  date: string;
  grade: Grade;
  questionTypes: QuestionType[];
  totalQuestions: number;
  correctCount: number;
  totalTime: number;
  wrongQuestions: string[];
  planInitiated?: boolean;
  isPlanMatch?: boolean;
  planQuestionCount?: number;
  planQuestionTypes?: QuestionType[];
  planTimeLimit?: number;
  actualTimeLimit?: number;
  completedAsPlan?: boolean;
  unmetReasons?: string[];
}

export interface PlanProgress {
  questionCountMatch: boolean;
  questionTypesMatch: boolean;
  timeLimitMatch: boolean;
  completedQuestions: number;
  correctCount: number;
  unmetReasons: string[];
}

export interface DailyPlan {
  id: string;
  date: string;
  questionCount: number;
  questionTypes: QuestionType[];
  grade: Grade;
  timeLimit: number;
  completed: boolean;
  completedAt?: string;
  updatedAt?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  image: string;
  type: 'virtual' | 'real';
  stock: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  grade: Grade;
  points: number;
  totalDays: number;
  continuousDays: number;
  totalQuestions: number;
  correctRate: number;
  lastCheckIn: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
  avgTimePerQuestion: number;
  dailyStats: DailyStats[];
  weakTypes: WeakType[];
  strongTypes: StrongType[];
}

export interface DailyStats {
  date: string;
  questionCount: number;
  correctRate: number;
  avgTime: number;
  planCompleted?: boolean;
  planQuestionCount?: number;
  planCorrectCount?: number;
  planCorrectRate?: number;
}

export interface WeakType {
  type: QuestionType;
  typeName: string;
  wrongCount: number;
  totalCount: number;
  correctRate: number;
}

export interface StrongType {
  type: QuestionType;
  typeName: string;
  correctRate: number;
}

export interface AppState {
  userProfile: UserProfile;
  currentGrade: Grade;
  selectedQuestionTypes: QuestionType[];
  dailyPlan: DailyPlan | null;
  wrongQuestions: WrongQuestion[];
  practiceRecords: PracticeRecord[];
  levels: Level[];
  rewards: Reward[];
  settings: AppSettings;
}

export interface AppSettings {
  soundEnabled: boolean;
  speechEnabled: boolean;
  restReminderEnabled: boolean;
  restInterval: number;
  parentPassword: string;
  difficulty: Difficulty;
}

export const GradeNames: Record<Grade, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级'
};

export const QuestionTypeNames: Record<QuestionType, string> = {
  addition: '加法',
  subtraction: '减法',
  multiplication: '乘法',
  division: '除法',
  mixed: '混合运算'
};

export const DifficultyNames: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};
