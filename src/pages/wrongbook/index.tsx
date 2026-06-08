import React, { useState, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { Question, WrongQuestion, QuestionType } from '@/types';
import { QuestionTypeNames, GradeNames } from '@/types';
import dayjs from 'dayjs';
import QuestionCard from '@/components/QuestionCard';
import AnswerPad from '@/components/AnswerPad';
import ProgressBar from '@/components/ProgressBar';
import EmptyState from '@/components/EmptyState';

type PageMode = 'list' | 'practice' | 'result';
type FilterType = 'all' | QuestionType;

const WrongBookPage: React.FC = () => {
  const {
    wrongQuestions,
    removeWrongQuestion,
    clearWrongQuestions,
    addPoints
  } = useAppStore();

  const [mode, setMode] = useState<PageMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [practiceQuestions, setPracticeQuestions] = useState<WrongQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResultAnimation, setShowResultAnimation] = useState<'correct' | 'wrong' | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [practiceStartTime, setPracticeStartTime] = useState(0);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  const filterTypes: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'addition', label: '加法' },
    { key: 'subtraction', label: '减法' },
    { key: 'multiplication', label: '乘法' },
    { key: 'division', label: '除法' },
    { key: 'mixed', label: '混合' }
  ];

  const filteredQuestions = wrongQuestions.filter(q =>
    filterType === 'all' || q.type === filterType
  );

  const typeStats = (['addition', 'subtraction', 'multiplication', 'division', 'mixed'] as QuestionType[]).map(type => ({
    type,
    name: QuestionTypeNames[type],
    count: wrongQuestions.filter(q => q.type === type).length
  })).filter(s => s.count > 0);

  const mostWrongType = typeStats.length > 0
    ? typeStats.reduce((prev, curr) => curr.count > prev.count ? curr : prev)
    : null;

  const currentQuestion = practiceQuestions[currentIndex];
  const answeredCount = practiceQuestions.filter(q => q.userAnswer !== undefined).length;
  const correctCount = practiceQuestions.filter(q => q.isCorrect).length;

  const startPractice = () => {
    if (filteredQuestions.length === 0) {
      Taro.showToast({ title: '暂无错题', icon: 'none' });
      return;
    }
    const questions = filteredQuestions.map(q => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined,
      timeSpent: undefined
    }));
    setPracticeQuestions(questions);
    setCurrentIndex(0);
    setAnswer('');
    setMode('practice');
    setShowResultAnimation(null);
    setQuestionStartTime(Date.now());
    setPracticeStartTime(Date.now());
    setMasteredIds([]);
    console.log('[WrongBook] 开始错题重练', { count: questions.length });
  };

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || answer === '' || answer === '-') return;

    const userAnswer = parseInt(answer, 10);
    const isCorrect = userAnswer === currentQuestion.answer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    setShowResultAnimation(isCorrect ? 'correct' : 'wrong');

    const updatedQuestions = [...practiceQuestions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userAnswer,
      isCorrect,
      timeSpent
    };
    setPracticeQuestions(updatedQuestions);

    if (isCorrect) {
      setMasteredIds(prev => [...prev, currentQuestion.id]);
    }

    setTimeout(() => {
      setShowResultAnimation(null);
      if (currentIndex < practiceQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setQuestionStartTime(Date.now());
      } else {
        finishPractice(updatedQuestions);
      }
    }, 800);
  }, [currentQuestion, answer, questionStartTime, practiceQuestions, currentIndex]);

  const finishPractice = (finalQuestions: WrongQuestion[]) => {
    setMode('result');
    const finalCorrect = finalQuestions.filter(q => q.isCorrect).length;
    const masteredCount = masteredIds.length + (finalCorrect - masteredIds.length);
    const points = Math.round(finalCorrect * 2);

    addPoints(points);

    masteredIds.forEach(id => {
      removeWrongQuestion(id);
    });

    Taro.showToast({
      title: `答对${finalCorrect}题，获得${points}积分`,
      icon: 'success'
    });

    console.log('[WrongBook] 错题重练完成', { correct: finalCorrect, total: finalQuestions.length, points });
  };

  const handleRemove = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？',
      success: (res) => {
        if (res.confirm) {
          removeWrongQuestion(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleClearAll = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有错题吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          clearWrongQuestions();
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  };

  const handlePrint = (type: string) => {
    setShowPrintModal(false);
    Taro.showToast({ title: `已生成${type}，可在浏览器中打印`, icon: 'success' });
    console.log('[WrongBook] 打印错题', { type, count: filteredQuestions.length });
  };

  const backToList = () => {
    setMode('list');
    setPracticeQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
  };

  if (mode === 'list') {
    if (wrongQuestions.length === 0) {
      return (
        <View className={styles.pageContainer}>
          <View className={styles.contentSection}>
            <EmptyState
              icon="🎉"
              title="太棒了！"
              description="暂时没有错题，继续保持哦！"
            />
          </View>
        </View>
      );
    }

    return (
      <View className={styles.pageContainer}>
        <View className={styles.contentSection}>
          <Text className={styles.pageTitle}>
            <Text className={styles.titleEmoji}>📕</Text>
            错题本
          </Text>

          <View className={styles.statsCard}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{wrongQuestions.length}</Text>
              <Text className={styles.statLabel}>总错题数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{typeStats.length}</Text>
              <Text className={styles.statLabel}>薄弱题型</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{mostWrongType?.count || 0}</Text>
              <Text className={styles.statLabel}>最多错题</Text>
            </View>
          </View>

          <View className={styles.filterSection}>
            {filterTypes.map(ft => (
              <Button
                key={ft.key}
                className={classNames(styles.filterBtn, filterType === ft.key && styles.active)}
                onClick={() => setFilterType(ft.key)}
              >
                {ft.label}
              </Button>
            ))}
          </View>

          {typeStats.length > 0 && (
            <View className={styles.weakTypesSection}>
              <Text className={styles.sectionTitle}>💡 易错类型统计</Text>
              {typeStats.map(stat => (
                <View key={stat.type} className={styles.weakTypeItem}>
                  <Text className={styles.weakTypeName}>
                    <Text className={styles.weakTypeIcon}>📊</Text>
                    {stat.name}
                  </Text>
                  <View className={styles.weakTypeStats}>
                    <Text className={styles.weakCount}>{stat.count}道</Text>
                    <Text className={styles.weakRate}>
                      占{wrongQuestions.length > 0 ? Math.round((stat.count / wrongQuestions.length) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className={styles.wrongList}>
            {filteredQuestions.map((q, idx) => (
              <View key={q.id} className={styles.wrongItem}>
                <View className={styles.wrongHeader}>
                  <Text className={styles.wrongType}>{q.wrongType}</Text>
                  <View className={styles.wrongMeta}>
                    <Text className={styles.wrongCount}>错{q.wrongCount}次</Text>
                    <Text>·</Text>
                    <Text>{dayjs(q.lastWrongTime).format('MM-DD')}</Text>
                  </View>
                </View>
                <Text className={styles.wrongExpression}>{q.expression}</Text>
                <View className={styles.wrongAnswerRow}>
                  <View className={styles.answerItem}>
                    <Text className={styles.answerLabel}>你的答案</Text>
                    <Text className={classNames(styles.answerValue, styles.userAnswer)}>{q.userAnswer}</Text>
                  </View>
                  <View className={styles.answerItem}>
                    <Text className={styles.answerLabel}>正确答案</Text>
                    <Text className={classNames(styles.answerValue, styles.correctAnswer)}>{q.answer}</Text>
                  </View>
                </View>
                <View className={styles.wrongActions}>
                  <Button
                    className={classNames(styles.actionBtn, styles.secondary)}
                    onClick={() => handleRemove(q.id)}
                  >
                    删除
                  </Button>
                  <Button
                    className={classNames(styles.actionBtn, styles.primary)}
                    onClick={startPractice}
                  >
                    开始重练
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.bottomActions}>
          <Button
            className={classNames(styles.bottomBtn, styles.danger)}
            onClick={handleClearAll}
            disabled={wrongQuestions.length === 0}
          >
            清空错题
          </Button>
          <Button
            className={classNames(styles.bottomBtn, styles.primary)}
            onClick={startPractice}
            disabled={wrongQuestions.length === 0}
          >
            错题重练
          </Button>
        </View>

        {showPrintModal && (
          <View className={styles.printModalOverlay} onClick={() => setShowPrintModal(false)}>
            <View className={styles.printModal} onClick={(e) => e.stopPropagation()}>
              <Text className={styles.printTitle}>选择打印方式</Text>
              <View className={styles.printOptions}>
                <Button className={styles.printOption} onClick={() => handlePrint('题目卷')}>
                  📄 打印题目卷（仅题目）
                </Button>
                <Button className={styles.printOption} onClick={() => handlePrint('答案卷')}>
                  ✅ 打印答案卷（含答案）
                </Button>
              </View>
              <Button className={styles.closeBtn} onClick={() => setShowPrintModal(false)}>
                取消
              </Button>
            </View>
          </View>
        )}
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
                total={practiceQuestions.length}
                showText={true}
              />
            </View>
          </View>
          <View className={styles.headerActions}>
            <Button className={styles.iconBtn} onClick={backToList}>✕</Button>
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
      </View>
    );
  }

  if (mode === 'result') {
    const finalCorrect = practiceQuestions.filter(q => q.isCorrect).length;
    const score = Math.round((finalCorrect / practiceQuestions.length) * 100);

    return (
      <View className={styles.pageContainer}>
        <View className={styles.contentSection}>
          <EmptyState
            icon={score >= 80 ? '🎉' : '💪'}
            title={`完成！得分 ${score} 分`}
            description={`答对 ${finalCorrect}/${practiceQuestions.length} 题，${masteredIds.length} 道错题已掌握并移除`}
            actionText="返回错题本"
            onAction={backToList}
          />
        </View>
      </View>
    );
  }

  return null;
};

export default WrongBookPage;
