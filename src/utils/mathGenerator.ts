import { Question, Grade, QuestionType, Difficulty } from '@/types';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

const getNumberRange = (grade: Grade, difficulty: Difficulty): { min: number; max: number } => {
  const ranges: Record<Grade, Record<Difficulty, { min: number; max: number }>> = {
    grade1: {
      easy: { min: 1, max: 10 },
      medium: { min: 1, max: 20 },
      hard: { min: 1, max: 50 }
    },
    grade2: {
      easy: { min: 1, max: 20 },
      medium: { min: 1, max: 50 },
      hard: { min: 1, max: 100 }
    },
    grade3: {
      easy: { min: 1, max: 50 },
      medium: { min: 1, max: 100 },
      hard: { min: 10, max: 200 }
    },
    grade4: {
      easy: { min: 10, max: 100 },
      medium: { min: 10, max: 200 },
      hard: { min: 50, max: 500 }
    },
    grade5: {
      easy: { min: 50, max: 200 },
      medium: { min: 100, max: 500 },
      hard: { min: 100, max: 1000 }
    },
    grade6: {
      easy: { min: 100, max: 500 },
      medium: { min: 200, max: 1000 },
      hard: { min: 500, max: 2000 }
    }
  };
  return ranges[grade][difficulty];
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateAddition = (range: { min: number; max: number }): { expression: string; answer: number } => {
  const a = randomInt(range.min, range.max);
  const b = randomInt(range.min, range.max);
  return {
    expression: `${a} + ${b} =`,
    answer: a + b
  };
};

const generateSubtraction = (range: { min: number; max: number }): { expression: string; answer: number } => {
  let a = randomInt(range.min, range.max);
  let b = randomInt(range.min, range.max);
  if (a < b) [a, b] = [b, a];
  return {
    expression: `${a} - ${b} =`,
    answer: a - b
  };
};

const generateMultiplication = (grade: Grade, difficulty: Difficulty): { expression: string; answer: number } => {
  let a: number, b: number;
  if (grade === 'grade2' || grade === 'grade3') {
    a = randomInt(1, 9);
    b = randomInt(1, 9);
  } else if (grade === 'grade4') {
    if (difficulty === 'easy') {
      a = randomInt(1, 9);
      b = randomInt(10, 20);
    } else if (difficulty === 'medium') {
      a = randomInt(2, 9);
      b = randomInt(10, 50);
    } else {
      a = randomInt(10, 20);
      b = randomInt(10, 20);
    }
  } else {
    if (difficulty === 'easy') {
      a = randomInt(10, 20);
      b = randomInt(2, 9);
    } else if (difficulty === 'medium') {
      a = randomInt(10, 50);
      b = randomInt(2, 9);
    } else {
      a = randomInt(10, 99);
      b = randomInt(10, 99);
    }
  }
  return {
    expression: `${a} × ${b} =`,
    answer: a * b
  };
};

const generateDivision = (grade: Grade, difficulty: Difficulty): { expression: string; answer: number } => {
  let a: number, b: number, answer: number;
  if (grade === 'grade3' || grade === 'grade4') {
    answer = randomInt(1, 9);
    b = randomInt(1, 9);
    a = answer * b;
  } else if (grade === 'grade5') {
    if (difficulty === 'easy') {
      answer = randomInt(2, 20);
      b = randomInt(2, 9);
      a = answer * b;
    } else if (difficulty === 'medium') {
      answer = randomInt(5, 30);
      b = randomInt(2, 9);
      a = answer * b;
    } else {
      answer = randomInt(10, 50);
      b = randomInt(10, 20);
      a = answer * b;
    }
  } else {
    if (difficulty === 'easy') {
      answer = randomInt(5, 30);
      b = randomInt(2, 9);
      a = answer * b;
    } else if (difficulty === 'medium') {
      answer = randomInt(10, 100);
      b = randomInt(2, 9);
      a = answer * b;
    } else {
      answer = randomInt(10, 100);
      b = randomInt(10, 50);
      a = answer * b;
    }
  }
  return {
    expression: `${a} ÷ ${b} =`,
    answer
  };
};

const generateMixed = (grade: Grade, difficulty: Difficulty, range: { min: number; max: number }): { expression: string; answer: number } => {
  const ops = ['+', '-', '×', '÷'];
  const op1 = ops[randomInt(0, grade === 'grade3' ? 1 : 3)];
  const op2 = ops[randomInt(0, grade === 'grade3' ? 1 : 3)];
  
  let a = randomInt(range.min, range.max);
  let b = randomInt(range.min, range.max);
  let c = randomInt(range.min, range.max);
  
  let expression: string;
  let answer: number;
  
  if (op1 === '+' && op2 === '+') {
    expression = `${a} + ${b} + ${c} =`;
    answer = a + b + c;
  } else if (op1 === '+' && op2 === '-') {
    if (a + b < c) c = randomInt(range.min, a + b);
    expression = `${a} + ${b} - ${c} =`;
    answer = a + b - c;
  } else if (op1 === '-' && op2 === '+') {
    if (a < b) [a, b] = [b, a];
    expression = `${a} - ${b} + ${c} =`;
    answer = a - b + c;
  } else if (op1 === '-' && op2 === '-') {
    if (a < b) [a, b] = [b, a];
    if (a - b < c) c = randomInt(range.min, a - b);
    expression = `${a} - ${b} - ${c} =`;
    answer = a - b - c;
  } else if (op1 === '×' && op2 === '+') {
    a = randomInt(2, 9);
    b = randomInt(2, 9);
    expression = `${a} × ${b} + ${c} =`;
    answer = a * b + c;
  } else if (op1 === '×' && op2 === '-') {
    a = randomInt(2, 9);
    b = randomInt(2, 9);
    if (a * b < c) c = randomInt(range.min, a * b);
    expression = `${a} × ${b} - ${c} =`;
    answer = a * b - c;
  } else if (op1 === '+' && op2 === '×') {
    b = randomInt(2, 9);
    c = randomInt(2, 9);
    expression = `${a} + ${b} × ${c} =`;
    answer = a + b * c;
  } else {
    expression = `${a} + ${b} + ${c} =`;
    answer = a + b + c;
  }
  
  return { expression, answer };
};

export const generateQuestion = (
  grade: Grade,
  type: QuestionType,
  difficulty: Difficulty
): Question => {
  const range = getNumberRange(grade, difficulty);
  let result: { expression: string; answer: number };
  
  switch (type) {
    case 'addition':
      result = generateAddition(range);
      break;
    case 'subtraction':
      result = generateSubtraction(range);
      break;
    case 'multiplication':
      result = generateMultiplication(grade, difficulty);
      break;
    case 'division':
      result = generateDivision(grade, difficulty);
      break;
    case 'mixed':
      result = generateMixed(grade, difficulty, range);
      break;
    default:
      result = generateAddition(range);
  }
  
  return {
    id: generateId(),
    type,
    expression: result.expression,
    answer: result.answer,
    grade,
    difficulty
  };
};

export const generateQuestionSet = (
  grade: Grade,
  types: QuestionType[],
  difficulty: Difficulty,
  count: number
): Question[] => {
  const questions: Question[] = [];
  const actualTypes = types.length > 0 ? types : ['addition'];
  
  for (let i = 0; i < count; i++) {
    const type = actualTypes[i % actualTypes.length];
    questions.push(generateQuestion(grade, type, difficulty));
  }
  
  return questions.sort(() => Math.random() - 0.5);
};

export const getWrongType = (question: Question, userAnswer: number): string => {
  if (userAnswer === undefined) return '未作答';
  
  const diff = Math.abs(question.answer - userAnswer);
  if (diff === 1) return '计算差1';
  if (diff === 10) return '位数错误';
  if (question.type === 'multiplication' && diff > 10) return '乘法口诀不熟';
  if (question.type === 'division' && diff > 10) return '除法逆运算不熟';
  if (question.type === 'mixed') return '运算顺序错误';
  if (userAnswer < question.answer) return '结果偏小';
  if (userAnswer > question.answer) return '结果偏大';
  
  return '计算错误';
};
