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
    addPoints,
    userProfile
  } = useAppStore();

  const [mode, setMode] = useState<PageMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintContent, setShowPrintContent] = useState(false);
  const [printType, setPrintType] = useState<'题目卷' | '答案卷'>('题目卷');
  const [printContent, setPrintContent] = useState('');

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
    const newlyMasteredIds = finalQuestions.filter(q => q.isCorrect).map(q => q.id);
    const points = Math.round(finalCorrect * 2);

    addPoints(points);

    newlyMasteredIds.forEach(id => {
      removeWrongQuestion(id);
    });
    setMasteredIds([]);

    Taro.showToast({
      title: `答对${finalCorrect}题，获得${points}积分`,
      icon: 'success'
    });

    console.log('[WrongBook] 错题重练完成', { correct: finalCorrect, total: finalQuestions.length, points, removedIds: newlyMasteredIds });
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

  const generatePrintContent = (type: '题目卷' | '答案卷') => {
    const today = dayjs().format('YYYY年MM月DD日');
    const typeName = filterType === 'all' ? '全部题型' : QuestionTypeNames[filterType as QuestionType];
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>口算错题${type}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .subtitle { font-size: 14px; color: #666; }
    .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; color: #666; }
    .question-list { }
    .question-item { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
    .question-number { font-weight: bold; color: #FF7A45; margin-right: 10px; }
    .question-expression { font-size: 18px; font-family: 'Courier New', monospace; }
    .answer-section { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd; }
    .answer-label { color: #52C41A; font-weight: bold; }
    .answer-value { font-family: 'Courier New', monospace; font-weight: bold; }
    .wrong-type { font-size: 12px; color: #999; margin-top: 5px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    @media print {
      body { padding: 20px; }
      .question-item { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">📚 口算错题${type}</div>
    <div class="subtitle">${typeName} · 共${filteredQuestions.length}道题</div>
  </div>
  <div class="info">
    <span>生成日期：${today}</span>
    <span>学生姓名：${userProfile.name}</span>
  </div>
  <div class="question-list">
`;

    filteredQuestions.forEach((q, idx) => {
      html += `
    <div class="question-item">
      <div>
        <span class="question-number">${idx + 1}.</span>
        <span class="question-expression">${q.expression} = ?</span>
      </div>
      ${type === '答案卷' ? `
      <div class="answer-section">
        <span class="answer-label">正确答案：</span>
        <span class="answer-value">${q.answer}</span>
        <div class="wrong-type">错误类型：${q.wrongType} · 做错${q.wrongCount}次</div>
      </div>
      ` : ''}
    </div>
`;
    });

    html += `
  </div>
  <div class="footer">
    由「口算小达人」小程序生成 · 每天练习，进步看得见！
  </div>
</body>
</html>`;

    return html;
  };

  const handlePrint = (type: '题目卷' | '答案卷') => {
    if (filteredQuestions.length === 0) {
      Taro.showToast({
        title: `当前${filterType !== 'all' ? QuestionTypeNames[filterType as QuestionType] : ''}筛选下暂无错题`,
        icon: 'none',
        duration: 2000
      });
      return;
    }
    setShowPrintModal(false);
    setPrintType(type);
    const content = generatePrintContent(type);
    setPrintContent(content);
    setShowPrintContent(true);
    console.log('[WrongBook] 生成打印内容', { type, count: filteredQuestions.length });
  };

  const backToList = () => {
    setMode('list');
    setPracticeQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setShowPrintContent(false);
  };

  if (showPrintContent) {
    return (
      <View className={styles.printContentPage}>
        <View className={styles.printContentHeader}>
          <Button className={styles.printBackBtn} onClick={() => setShowPrintContent(false)}>
            ← 返回
          </Button>
          <Text className={styles.printContentTitle}>
            {printType}预览（{filteredQuestions.length}道）
          </Text>
          <Button 
            className={styles.printActionBtn}
            onClick={() => {
              Taro.setClipboardData({
                data: printContent,
                success: () => {
                  Taro.showModal({
                    title: '打印说明',
                    content: 'HTML内容已复制到剪贴板。请粘贴到任意文本编辑器中保存为.html文件，然后用浏览器打开即可打印。',
                    confirmText: '知道了'
                  });
                }
              });
            }}
          >
            📋 复制HTML
          </Button>
        </View>
        <View className={styles.printPreview}>
          <View className={styles.printPreviewHeader}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              📚 口算错题{printType}
            </Text>
            <Text style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              {filterType === 'all' ? '全部题型' : QuestionTypeNames[filterType as QuestionType]} · 共{filteredQuestions.length}道题
            </Text>
          </View>
          {filteredQuestions.map((q, idx) => (
            <View key={q.id} className={styles.printPreviewItem}>
              <Text style={{ fontSize: '18px', fontFamily: 'monospace' }}>
                <Text style={{ fontWeight: 'bold', color: '#FF7A45', marginRight: '10px' }}>{idx + 1}.</Text>
                {q.expression} = ?
              </Text>
              {printType === '答案卷' && (
                <Text style={{ display: 'block', marginTop: '8px', fontSize: '14px', color: '#52C41A' }}>
                  正确答案：<Text style={{ fontWeight: 'bold' }}>{q.answer}</Text>
                  <Text style={{ color: '#999', marginLeft: '10px' }}>
                    （{q.wrongType} · 做错{q.wrongCount}次）
                  </Text>
                </Text>
              )}
            </View>
          ))}
        </View>
        <View className={styles.printContentFooter}>
          <Button 
            className={styles.printActionBtn}
            onClick={() => {
              Taro.setClipboardData({
                data: printContent,
                success: () => {
                  Taro.showToast({ title: '已复制HTML代码', icon: 'success' });
                }
              });
            }}
            style={{ flex: 1, marginRight: '12rpx' }}
          >
            📋 复制HTML代码
          </Button>
        </View>
      </View>
    );
  }

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
            className={classNames(styles.bottomBtn, styles.secondary)}
            onClick={() => {
              if (filteredQuestions.length === 0) {
                Taro.showToast({
                  title: `当前${filterType !== 'all' ? QuestionTypeNames[filterType as QuestionType] : ''}筛选下暂无错题`,
                  icon: 'none',
                  duration: 2000
                });
                return;
              }
              setShowPrintModal(true);
            }}
            disabled={wrongQuestions.length === 0}
          >
            🖨️ 打印错题
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
              <Text className={styles.printTitle}>
                打印错题 {filterType !== 'all' && `(${filteredQuestions.length}道)`}
              </Text>
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
    const newlyMastered = practiceQuestions.filter(q => q.isCorrect).length;
    const score = Math.round((finalCorrect / practiceQuestions.length) * 100);

    return (
      <View className={styles.pageContainer}>
        <View className={styles.contentSection}>
          <EmptyState
            icon={score >= 80 ? '🎉' : '💪'}
            title={`完成！得分 ${score} 分`}
            description={`答对 ${finalCorrect}/${practiceQuestions.length} 题，${newlyMastered} 道错题已掌握并移除`}
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
