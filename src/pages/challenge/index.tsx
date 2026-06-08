import React, { useState, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { generateQuestionSet, getWrongType } from '@/utils/mathGenerator';
import { Question, Level, WrongQuestion, PracticeRecord } from '@/types';
import { QuestionTypeNames, GradeNames } from '@/types';
import dayjs from 'dayjs';
import QuestionCard from '@/components/QuestionCard';
import AnswerPad from '@/components/AnswerPad';
import ProgressBar from '@/components/ProgressBar';
import CountDownTimer from '@/components/CountDownTimer';
import StarRating from '@/components/StarRating';

type PageMode = 'list' | 'detail' | 'practice' | 'result';

const ChallengePage: React.FC = () => {
  const {
    levels,
    settings,
    addWrongQuestion,
    addPracticeRecord,
    addPoints,
    updateLevelStars,
    unlockNextLevel
  } = useAppStore();

  const [mode, setMode] = useState<PageMode>('list');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showResultAnimation, setShowResultAnimation] = useState<'correct' | 'wrong' | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [practiceStartTime, setPracticeStartTime] = useState(0);

  const [earnedStars, setEarnedStars] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isPassed, setIsPassed] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(q => q.userAnswer !== undefined).length;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const totalTime = Math.round((Date.now() - practiceStartTime) / 1000);
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const openLevelDetail = (level: Level) => {
    if (!level.unlocked) {
      Taro.showToast({ title: '请先完成上一关', icon: 'none' });
      return;
    }
    setSelectedLevel(level);
    setMode('detail');
  };

  const startChallenge = () => {
    if (!selectedLevel) return;

    const types = selectedLevel.grade === 'grade1' || selectedLevel.grade === 'grade2'
      ? ['addition', 'subtraction']
      : selectedLevel.grade === 'grade3'
      ? ['addition', 'subtraction', 'multiplication', 'division']
      : ['addition', 'subtraction', 'multiplication', 'division', 'mixed'];

    const newQuestions = generateQuestionSet(
      selectedLevel.grade,
      types,
      settings.difficulty,
      selectedLevel.questionCount
    );

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setAnswer('');
    setMode('practice');
    setIsTimerRunning(true);
    setQuestionStartTime(Date.now());
    setPracticeStartTime(Date.now());
    setShowResultAnimation(null);

    console.log('[Challenge] 开始闯关', { level: selectedLevel.name, questionCount: selectedLevel.questionCount });
  };

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || answer === '' || answer === '-' || !selectedLevel) return;

    const userAnswer = parseInt(answer, 10);
    const isCorrect = userAnswer === currentQuestion.answer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    setShowResultAnimation(isCorrect ? 'correct' : 'wrong');

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
        finishChallenge(updatedQuestions);
      }
    }, 800);
  }, [currentQuestion, answer, questionStartTime, questions, currentIndex, selectedLevel, addWrongQuestion]);

  const finishChallenge = (finalQuestions: Question[]) => {
    if (!selectedLevel) return;

    setIsTimerRunning(false);
    setMode('result');

    const finalCorrect = finalQuestions.filter(q => q.isCorrect).length;
    const finalTotal = finalQuestions.length;
    const finalTime = Math.round((Date.now() - practiceStartTime) / 1000);
    const finalScore = Math.round((finalCorrect / finalTotal) * 100);
    const passed = finalScore >= selectedLevel.passScore;

    let stars = 0;
    if (finalScore >= 90) stars = 3;
    else if (finalScore >= 80) stars = 2;
    else if (finalScore >= selectedLevel.passScore) stars = 1;

    const points = passed ? selectedLevel.reward * stars : Math.floor(selectedLevel.reward / 2);

    setEarnedStars(stars);
    setEarnedPoints(points);
    setIsPassed(passed);

    if (passed) {
      updateLevelStars(selectedLevel.id, stars);
      unlockNextLevel(selectedLevel.id);
      addPoints(points);

      const record: PracticeRecord = {
        id: `record_${Date.now()}`,
        date: dayjs().format('YYYY-MM-DD'),
        grade: selectedLevel.grade,
        questionTypes: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
        totalQuestions: finalTotal,
        correctCount: finalCorrect,
        totalTime: finalTime,
        wrongQuestions: finalQuestions.filter(q => !q.isCorrect).map(q => q.id)
      };
      addPracticeRecord(record);
    }

    console.log('[Challenge] 闯关完成', {
      level: selectedLevel.name,
      score: finalScore,
      stars,
      points,
      passed
    });
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    Taro.showToast({ title: '时间到！', icon: 'none' });
    finishChallenge(questions);
  };

  const backToList = () => {
    setMode('list');
    setSelectedLevel(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
  };

  const retryLevel = () => {
    startChallenge();
  };

  const nextLevel = () => {
    if (!selectedLevel) return;
    const next = levels.find(l => l.id === selectedLevel.id + 1);
    if (next && next.unlocked) {
      setSelectedLevel(next);
      setMode('detail');
    } else {
      backToList();
    }
  };

  const getResultEmoji = () => {
    if (!isPassed) return '😢';
    if (earnedStars === 3) return '🏆';
    if (earnedStars === 2) return '🎉';
    return '✨';
  };

  const getResultTitle = () => {
    if (!isPassed) return '挑战失败';
    if (earnedStars === 3) return '完美通关！';
    if (earnedStars === 2) return '优秀！';
    return '通关成功！';
  };

  if (mode === 'list') {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.listSection}>
          <Text className={styles.pageTitle}>
            <Text className={styles.titleEmoji}>🎮</Text>
            闯关挑战
          </Text>

          {levels.map((level) => (
            <View
              key={level.id}
              className={classNames(styles.levelCard, !level.unlocked && styles.locked)}
              onClick={() => openLevelDetail(level)}
            >
              <View className={styles.levelNumber}>
                {level.unlocked ? level.id : <Text className={styles.lockIcon}>🔒</Text>}
              </View>
              <View className={styles.levelInfo}>
                <Text className={styles.levelName}>{level.name}</Text>
                <Text className={styles.levelDesc}>{level.description}</Text>
                <View className={styles.levelMeta}>
                  <Text className={styles.metaItem}>
                    📚 {GradeNames[level.grade]}
                  </Text>
                  <Text className={styles.metaItem}>
                    🔢 {level.questionCount}道题
                  </Text>
                  <Text className={styles.metaItem}>
                    ⏱️ {Math.floor(level.timeLimit / 60)}分钟
                  </Text>
                  {level.stars > 0 && (
                    <StarRating count={level.stars} total={3} size="sm" />
                  )}
                </View>
              </View>
              <View className={styles.levelReward}>
                <Text className={styles.rewardPoints}>🏆 {level.reward}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (mode === 'detail' && selectedLevel) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.detailOverlay} onClick={backToList}>
          <View className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailHeader}>
              <Text className={styles.detailNumber}>第{selectedLevel.id}关</Text>
              <Text className={styles.detailName}>{selectedLevel.name}</Text>
              <Text className={styles.detailDesc}>{selectedLevel.description}</Text>
            </View>
            <View className={styles.detailBody}>
              <View className={styles.detailStats}>
                <View className={styles.statItem}>
                  <Text className={styles.statIcon}>📚</Text>
                  <Text className={styles.statValue}>{GradeNames[selectedLevel.grade]}</Text>
                  <Text className={styles.statLabel}>年级</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statIcon}>🔢</Text>
                  <Text className={styles.statValue}>{selectedLevel.questionCount}</Text>
                  <Text className={styles.statLabel}>题目数</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statIcon}>⏱️</Text>
                  <Text className={styles.statValue}>{Math.floor(selectedLevel.timeLimit / 60)}</Text>
                  <Text className={styles.statLabel}>分钟</Text>
                </View>
              </View>
              <View className={styles.passInfo}>
                <Text className={styles.passText}>
                  通关条件: 正确率 ≥ {selectedLevel.passScore}%
                </Text>
              </View>
              <Button className={styles.startBtn} onClick={startChallenge}>
                开始挑战 🚀
              </Button>
              <Button className={styles.closeBtn} onClick={backToList}>
                返回列表
              </Button>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'practice' && currentQuestion && selectedLevel) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.practiceHeader}>
          <View className={styles.headerLeft}>
            <Text className={styles.levelBadge}>第{selectedLevel.id}关</Text>
            <View className={styles.progressWrap}>
              <ProgressBar
                current={answeredCount + 1}
                total={questions.length}
                showText={true}
              />
            </View>
          </View>
          <CountDownTimer
            totalSeconds={selectedLevel.timeLimit}
            isRunning={isTimerRunning}
            onTimeUp={handleTimeUp}
          />
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
      </View>
    );
  }

  if (mode === 'result' && selectedLevel) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.resultSection}>
          <View className={styles.resultHeader}>
            <Text className={styles.resultEmoji}>{getResultEmoji()}</Text>
            <Text className={styles.resultTitle}>{getResultTitle()}</Text>
            <Text className={styles.resultSubtitle}>
              {selectedLevel.name}
            </Text>
          </View>

          <View className={styles.starsContainer}>
            <StarRating count={earnedStars} total={3} size="lg" animated={true} />
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <Text className={styles.statCardIcon}>✅</Text>
              <Text className={styles.statCardValue}>{correctCount}/{questions.length}</Text>
              <Text className={styles.statCardLabel}>正确数</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statCardIcon}>📊</Text>
              <Text className={styles.statCardValue}>{score}%</Text>
              <Text className={styles.statCardLabel}>正确率</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statCardIcon}>⏱️</Text>
              <Text className={styles.statCardValue}>{totalTime}秒</Text>
              <Text className={styles.statCardLabel}>总用时</Text>
            </View>
          </View>

          <View className={styles.rewardSection}>
            <Text className={styles.rewardTitle}>获得奖励</Text>
            <View className={styles.rewardValue}>
              <Text>🏆</Text>
              <Text>{earnedPoints} 积分</Text>
            </View>
          </View>
        </View>

        <View className={styles.bottomActions}>
          <Button className={classNames(styles.actionBtn, styles.secondary)} onClick={backToList}>
            返回列表
          </Button>
          {isPassed ? (
            <Button className={classNames(styles.actionBtn, styles.primary)} onClick={nextLevel}>
              下一关 →
            </Button>
          ) : (
            <Button className={classNames(styles.actionBtn, styles.primary)} onClick={retryLevel}>
              再试一次
            </Button>
          )}
        </View>
      </View>
    );
  }

  return null;
};

export default ChallengePage;
