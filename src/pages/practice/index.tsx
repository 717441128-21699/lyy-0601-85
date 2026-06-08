import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button, Switch, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { generateQuestionSet, getWrongType } from '@/utils/mathGenerator';
import { speakQuestion, stopSpeak } from '@/utils/speech';
import { Question, Grade, QuestionType, WrongQuestion, PracticeRecord } from '@/types';
import { GradeNames, QuestionTypeNames, DifficultyNames } from '@/types';
import dayjs from 'dayjs';
import QuestionCard from '@/components/QuestionCard';
import AnswerPad from '@/components/AnswerPad';
import ProgressBar from '@/components/ProgressBar';
import CountDownTimer from '@/components/CountDownTimer';
import DraftBoard from '@/components/DraftBoard';
import StarRating from '@/components/StarRating';

type PageMode = 'config' | 'practice' | 'result';

const PracticePage: React.FC = () => {
  const {
    currentGrade,
    selectedQuestionTypes,
    settings,
    dailyPlan,
    setGrade,
    setQuestionTypes,
    addWrongQuestion,
    addPracticeRecord,
    addPoints,
    completeDailyPlan
  } = useAppStore();

  const today = dayjs().format('YYYY-MM-DD');
  const hasTodayPlan = dailyPlan && dailyPlan.date === today;

  const [mode, setMode] = useState<PageMode>('config');
  const [selectedGrade, setSelectedGrade] = useState<Grade>(currentGrade);
  const [types, setTypes] = useState<QuestionType[]>(
    hasTodayPlan ? dailyPlan!.questionTypes : selectedQuestionTypes
  );
  const [quantity, setQuantity] = useState(
    hasTodayPlan ? dailyPlan!.questionCount : 20
  );
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(
    hasTodayPlan ? dailyPlan!.timeLimit > 0 : true
  );
  const [timeLimit, setTimeLimit] = useState(
    hasTodayPlan ? (dailyPlan!.timeLimit > 0 ? dailyPlan!.timeLimit : 600) : 600
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showResultAnimation, setShowResultAnimation] = useState<'correct' | 'wrong' | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [practiceStartTime, setPracticeStartTime] = useState(0);

  const [showDraftBoard, setShowDraftBoard] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [practiceDuration, setPracticeDuration] = useState(0);
  const [finalEarnedPointsState, setFinalEarnedPointsState] = useState(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const grades: Grade[] = ['grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6'];
  const questionTypes: QuestionType[] = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'];
  const quantities = [10, 15, 20, 30, 50];

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(q => q.userAnswer !== undefined).length;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const wrongQuestions = questions.filter(q => q.userAnswer !== undefined && !q.isCorrect);
  const totalTime = Math.round((Date.now() - practiceStartTime) / 1000);
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const calculateEarnedPoints = (correct: number, total: number) => {
    const s = total > 0 ? Math.round((correct / total) * 100) : 0;
    return Math.round(correct * 1 + (s >= 90 ? 10 : s >= 80 ? 5 : 0));
  };
  const earnedPoints = calculateEarnedPoints(correctCount, questions.length);

  useEffect(() => {
    return () => {
      stopSpeak();
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === 'practice' && settings.restReminderEnabled) {
      durationTimerRef.current = setInterval(() => {
        setPracticeDuration(prev => {
          const next = prev + 1;
          if (next >= settings.restInterval * 60) {
            setShowRestModal(true);
            setIsTimerRunning(false);
            if (durationTimerRef.current) {
              clearInterval(durationTimerRef.current);
            }
          }
          return next;
        });
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [mode, settings.restReminderEnabled, settings.restInterval]);

  const toggleType = (type: QuestionType) => {
    if (types.includes(type)) {
      if (types.length > 1) {
        setTypes(types.filter(t => t !== type));
      }
    } else {
      setTypes([...types, type]);
    }
  };

  const startPractice = () => {
    if (types.length === 0) {
      Taro.showToast({ title: '请至少选择一种题型', icon: 'none' });
      return;
    }

    const newQuestions = generateQuestionSet(selectedGrade, types, settings.difficulty, quantity);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setAnswer('');
    setMode('practice');
    setIsTimerRunning(true);
    setQuestionStartTime(Date.now());
    setPracticeStartTime(Date.now());
    setPracticeDuration(0);
    setShowResultAnimation(null);

    setGrade(selectedGrade);
    setQuestionTypes(types);

    console.log('[Practice] 开始练习', { grade: selectedGrade, types, quantity, timeLimit });
  };

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || answer === '' || answer === '-') return;

    const userAnswer = parseInt(answer, 10);
    const isCorrect = userAnswer === currentQuestion.answer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    setShowResultAnimation(isCorrect ? 'correct' : 'wrong');

    if (settings.speechEnabled && !isCorrect) {
      setTimeout(() => speakQuestion(currentQuestion.expression + currentQuestion.answer), 500);
    }

    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userAnswer,
      isCorrect,
      timeSpent
    };
    setQuestions(updatedQuestions);

    if (!isCorrect) {
      const wrongQ: WrongQuestion = {
        ...updatedQuestions[currentIndex],
        wrongCount: 1,
        lastWrongTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        wrongType: getWrongType(currentQuestion, userAnswer)
      };
      addWrongQuestion(wrongQ);
    }

    setTimeout(() => {
      setShowResultAnimation(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setQuestionStartTime(Date.now());
      } else {
        finishPractice(updatedQuestions);
      }
    }, 800);

    console.log('[Practice] 提交答案', { question: currentQuestion.expression, userAnswer, isCorrect, timeSpent });
  }, [currentQuestion, answer, questionStartTime, questions, currentIndex, settings.speechEnabled, addWrongQuestion]);

  const finishPractice = (finalQuestions: Question[]) => {
    setIsTimerRunning(false);
    setMode('result');
    stopSpeak();

    const finalCorrect = finalQuestions.filter(q => q.isCorrect).length;
    const finalTotal = finalQuestions.length;
    const finalTime = Math.round((Date.now() - practiceStartTime) / 1000);
    const finalEarnedPoints = calculateEarnedPoints(finalCorrect, finalTotal);

    const record: PracticeRecord = {
      id: `record_${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD'),
      grade: selectedGrade,
      questionTypes: types,
      totalQuestions: finalTotal,
      correctCount: finalCorrect,
      totalTime: finalTime,
      wrongQuestions: finalQuestions.filter(q => !q.isCorrect).map(q => q.id)
    };

    addPracticeRecord(record);
    addPoints(finalEarnedPoints);
    setFinalEarnedPointsState(finalEarnedPoints);

    if (finalCorrect / finalTotal >= 0.6) {
      completeDailyPlan(finalTotal, types);
    }

    console.log('[Practice] 练习完成', { score: Math.round((finalCorrect / finalTotal) * 100), correctCount: finalCorrect, totalQuestions: finalTotal, earnedPoints: finalEarnedPoints });
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    const unanswered = questions.filter(q => q.userAnswer === undefined);
    if (unanswered.length > 0) {
      Taro.showToast({ title: '时间到！', icon: 'none' });
    }
    finishPractice(questions);
  };

  const handleSpeakQuestion = () => {
    if (currentQuestion && settings.speechEnabled) {
      speakQuestion(currentQuestion.expression);
    }
  };

  const handleRestConfirm = () => {
    setShowRestModal(false);
    setPracticeDuration(0);
    setIsTimerRunning(true);
    setQuestionStartTime(Date.now());
  };

  const restartPractice = () => {
    startPractice();
  };

  const backToConfig = () => {
    setMode('config');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    stopSpeak();
  };

  const getStars = () => {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  const getScoreTitle = () => {
    if (score >= 90) return '太棒了！🎉';
    if (score >= 80) return '很不错！👍';
    if (score >= 70) return '继续加油！💪';
    if (score >= 60) return '还需努力！📚';
    return '别灰心，再来一次！🔄';
  };

  if (mode === 'config') {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.configSection}>
          <Text className={styles.pageTitle}>
            <Text className={styles.titleEmoji}>🧮</Text>
            口算练习
          </Text>

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>📚 选择年级</Text>
            <View className={styles.optionGrid}>
              {grades.map((grade) => (
                <Button
                  key={grade}
                  className={classNames(styles.optionBtn, selectedGrade === grade && styles.active)}
                  onClick={() => setSelectedGrade(grade)}
                >
                  {GradeNames[grade]}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>✏️ 选择题型</Text>
            <View className={styles.optionGrid}>
              {questionTypes.map((type) => (
                <Button
                  key={type}
                  className={classNames(styles.optionBtn, types.includes(type) && styles.active)}
                  onClick={() => toggleType(type)}
                >
                  {QuestionTypeNames[type]}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>🔢 题目数量</Text>
            <View className={styles.quantityOptions}>
              {quantities.map((q) => (
                <Button
                  key={q}
                  className={classNames(styles.quantityBtn, quantity === q && styles.active)}
                  onClick={() => setQuantity(q)}
                >
                  {q}道
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.card}>
            <View className={styles.switchRow}>
              <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>⏱️ 限时答题</Text>
              <Switch
                checked={timeLimitEnabled}
                onChange={(e) => setTimeLimitEnabled(e.detail.value)}
                color="#FF7A45"
              />
            </View>
            {timeLimitEnabled && (
              <View className={styles.timeLimitInput}>
                <Text className={styles.label}>设置时间:</Text>
                <Input
                  className={styles.input}
                  type="number"
                  value={String(timeLimit / 60)}
                  onInput={(e) => setTimeLimit(Math.max(1, parseInt(e.detail.value, 10) || 1) * 60)}
                />
                <Text className={styles.unit}>分钟</Text>
              </View>
            )}
          </View>

          <View className={styles.card}>
            <View className={styles.switchRow}>
              <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>📊 难度等级</Text>
              <Text className={styles.textPrimary} style={{ fontWeight: 600 }}>
                {DifficultyNames[settings.difficulty]}
              </Text>
            </View>
          </View>

          <Button
            className={styles.startBtn}
            onClick={startPractice}
            disabled={types.length === 0}
          >
            开始练习 🚀
          </Button>
        </View>
      </View>
    );
  }

  if (mode === 'practice' && currentQuestion) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.practiceHeader}>
          <View className={styles.headerLeft}>
            <View className={styles.progressWrap}>
              <ProgressBar
                current={answeredCount + 1}
                total={questions.length}
                showText={true}
              />
            </View>
          </View>
          {timeLimitEnabled && (
            <CountDownTimer
              totalSeconds={timeLimit}
              isRunning={isTimerRunning}
              onTimeUp={handleTimeUp}
            />
          )}
          <View className={styles.headerActions}>
            <Button className={styles.iconBtn} onClick={handleSpeakQuestion}>🔊</Button>
            <Button className={styles.iconBtn} onClick={() => setShowDraftBoard(true)}>📝</Button>
          </View>
        </View>

        <View className={styles.questionSection}>
          <View
            className={classNames(
              styles.questionCardWrapper,
              styles.questionAnimate,
              showResultAnimation === 'correct' && styles.correctAnimation,
              showResultAnimation === 'wrong' && styles.wrongAnimation
            )}
          >
            <QuestionCard
              question={{
                ...currentQuestion,
                userAnswer: answer !== '' && answer !== '-' ? parseInt(answer, 10) : undefined
              }}
              showResult={showResultAnimation !== null}
              index={currentIndex}
            />
          </View>
        </View>

        <View className={styles.keyboardSection}>
          <AnswerPad
            value={answer}
            onChange={setAnswer}
            onSubmit={submitAnswer}
            disabled={showResultAnimation !== null}
          />
        </View>

        <DraftBoard
          visible={showDraftBoard}
          onClose={() => setShowDraftBoard(false)}
        />

        {showRestModal && (
          <View className={styles.restModalOverlay}>
            <View className={styles.restModal}>
              <Text className={styles.restEmoji}>🧘</Text>
              <Text className={styles.restTitle}>该休息啦！</Text>
              <Text className={styles.restDesc}>
                你已经连续学习了{settings.restInterval}分钟，让眼睛休息一下吧！
              </Text>
              <Button className={styles.restBtn} onClick={handleRestConfirm}>
                好的，继续加油！
              </Button>
            </View>
          </View>
        )}
      </View>
    );
  }

  if (mode === 'result') {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.resultSection}>
          <View className={styles.scoreBadge}>
            <View className={styles.scoreCircle}>
              <Text className={styles.scoreNumber}>{score}</Text>
              <Text className={styles.scoreLabel}>分</Text>
            </View>
            <StarRating count={getStars()} total={3} size="lg" animated={true} />
            <Text className={styles.scoreTitle}>{getScoreTitle()}</Text>
            <Text className={styles.scoreSubtitle}>
              完成{questions.length}道题，答对{correctCount}道
            </Text>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <Text className={styles.statIcon}>✅</Text>
              <Text className={styles.statValue}>{correctCount}/{questions.length}</Text>
              <Text className={styles.statLabel}>正确率</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statIcon}>⏱️</Text>
              <Text className={styles.statValue}>{totalTime}秒</Text>
              <Text className={styles.statLabel}>总用时</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statIcon}>⚡</Text>
              <Text className={styles.statValue}>{questions.length > 0 ? (totalTime / questions.length).toFixed(1) : 0}秒</Text>
              <Text className={styles.statLabel}>平均每题</Text>
            </View>
          </View>

          <View className={styles.pointsReward}>
            <Text className={styles.pointsIcon}>🏆</Text>
            <Text className={styles.pointsText}>获得 {finalEarnedPointsState} 积分奖励！</Text>
          </View>

          {wrongQuestions.length > 0 && (
            <View className={styles.card}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionHeaderTitle}>❌ 错题回顾 ({wrongQuestions.length}道)</Text>
              </View>
              <View className={styles.wrongList}>
                {wrongQuestions.map((q, idx) => (
                  <View key={q.id} className={styles.wrongItem}>
                    <Text className={styles.wrongExpression}>{idx + 1}. {q.expression}</Text>
                    <View className={styles.wrongAnswer}>
                      <Text className={styles.userAnswer}>{q.userAnswer}</Text>
                      <Text>→</Text>
                      <Text className={styles.correctAnswer}>{q.answer}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className={styles.bottomActions}>
          <Button className={classNames(styles.actionBtn, styles.secondary)} onClick={backToConfig}>
            返回首页
          </Button>
          <Button className={classNames(styles.actionBtn, styles.primary)} onClick={restartPractice}>
            再来一组
          </Button>
        </View>
      </View>
    );
  }

  return null;
};

export default PracticePage;
