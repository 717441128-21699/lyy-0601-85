import { Level } from '@/types';

export const levelsData: Level[] = [
  {
    id: 1,
    name: '初入数学王国',
    description: '10以内的加减法',
    grade: 'grade1',
    questionCount: 10,
    timeLimit: 180,
    passScore: 60,
    stars: 0,
    unlocked: true,
    reward: 10
  },
  {
    id: 2,
    name: '小小数学家',
    description: '20以内的加减法',
    grade: 'grade1',
    questionCount: 15,
    timeLimit: 240,
    passScore: 70,
    stars: 0,
    unlocked: false,
    reward: 15
  },
  {
    id: 3,
    name: '计算小能手',
    description: '50以内的加减法',
    grade: 'grade2',
    questionCount: 15,
    timeLimit: 240,
    passScore: 70,
    stars: 0,
    unlocked: false,
    reward: 20
  },
  {
    id: 4,
    name: '乘法入门',
    description: '九九乘法表',
    grade: 'grade2',
    questionCount: 20,
    timeLimit: 300,
    passScore: 75,
    stars: 0,
    unlocked: false,
    reward: 25
  },
  {
    id: 5,
    name: '除法挑战',
    description: '简单除法运算',
    grade: 'grade3',
    questionCount: 20,
    timeLimit: 300,
    passScore: 75,
    stars: 0,
    unlocked: false,
    reward: 30
  },
  {
    id: 6,
    name: '四则运算',
    description: '100以内混合运算',
    grade: 'grade3',
    questionCount: 20,
    timeLimit: 360,
    passScore: 80,
    stars: 0,
    unlocked: false,
    reward: 35
  },
  {
    id: 7,
    name: '速算达人',
    description: '多位数乘法',
    grade: 'grade4',
    questionCount: 20,
    timeLimit: 360,
    passScore: 80,
    stars: 0,
    unlocked: false,
    reward: 40
  },
  {
    id: 8,
    name: '数学精英',
    description: '多位数除法',
    grade: 'grade4',
    questionCount: 20,
    timeLimit: 420,
    passScore: 80,
    stars: 0,
    unlocked: false,
    reward: 45
  },
  {
    id: 9,
    name: '计算大师',
    description: '复杂混合运算',
    grade: 'grade5',
    questionCount: 25,
    timeLimit: 480,
    passScore: 85,
    stars: 0,
    unlocked: false,
    reward: 50
  },
  {
    id: 10,
    name: '数学王者',
    description: '终极挑战',
    grade: 'grade6',
    questionCount: 30,
    timeLimit: 600,
    passScore: 90,
    stars: 0,
    unlocked: false,
    reward: 100
  }
];
