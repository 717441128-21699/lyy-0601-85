import React, { useState, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { QuestionType, GradeNames, QuestionTypeNames } from '@/types';
import dayjs from 'dayjs';
import CheckInCalendar from '@/components/CheckInCalendar';

type PageMode = 'view' | 'edit';

const PlanPage: React.FC = () => {
  const {
    dailyPlan,
    currentGrade,
    userProfile,
    practiceRecords,
    updateDailyPlan,
    completeDailyPlan
  } = useAppStore();

  const [mode, setMode] = useState<PageMode>('view');
  const [showCalendar, setShowCalendar] = useState(false);
  const [editCount, setEditCount] = useState(dailyPlan?.questionCount || 20);
  const [editTypes, setEditTypes] = useState<QuestionType[]>(
    dailyPlan?.questionTypes || ['addition', 'subtraction']
  );
  const [editTimeLimit, setEditTimeLimit] = useState(dailyPlan?.timeLimit || 600);

  const today = dayjs().format('YYYY-MM-DD');
  const isCompleted = dailyPlan?.completed && dailyPlan?.date === today;

  const questionCountOptions = [10, 20, 30, 50];
  const timeLimitOptions = [
    { value: 300, label: '5分钟' },
    { value: 600, label: '10分钟' },
    { value: 900, label: '15分钟' },
    { value: 1200, label: '20分钟' },
    { value: 1800, label: '30分钟' },
    { value: 0, label: '不限时' }
  ];

  const allTypes: { type: QuestionType; emoji: string }[] = [
    { type: 'addition', emoji: '➕' },
    { type: 'subtraction', emoji: '➖' },
    { type: 'multiplication', emoji: '✖️' },
    { type: 'division', emoji: '➗' },
    { type: 'mixed', emoji: '🔢' }
  ];

  const handleStartPractice = useCallback(() => {
    Taro.switchTab({ url: '/pages/practice/index?from=plan' });
  }, []);

  const handleToggleType = useCallback((type: QuestionType) => {
    setEditTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  const handleSavePlan = useCallback(() => {
    updateDailyPlan({
      questionCount: editCount,
      questionTypes: editTypes,
      timeLimit: editTimeLimit,
      grade: currentGrade
    });
    setMode('view');
    Taro.showToast({ title: '计划已保存', icon: 'success' });
  }, [editCount, editTypes, editTimeLimit, currentGrade, updateDailyPlan]);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '不限时';
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  const historyRecords = practiceRecords
    .filter(r => dayjs(r.date).isAfter(dayjs().subtract(7, 'day')))
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 7);

  const isDateCompleted = (date: string) => {
    return practiceRecords.some(r => r.date === date && r.totalQuestions > 0);
  };

  const getDateLabel = (dateStr: string) => {
    const date = dayjs(dateStr);
    if (date.isSame(dayjs(), 'day')) return '今天';
    if (date.isSame(dayjs().subtract(1, 'day'), 'day')) return '昨天';
    return date.format('MM/DD');
  };

  const completedDays = practiceRecords
    .filter(r => r.completedAsPlan)
    .map(r => r.date)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  const todayAllRecords = practiceRecords.filter(r => r.date === today);
  const todayPlanRecords = todayAllRecords.filter(r => r.planInitiated);
  const todayTotalQuestions = todayPlanRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
  const todayCorrectCount = todayPlanRecords.reduce((sum, r) => sum + r.correctCount, 0);
  const todayCorrectRate = todayTotalQuestions > 0 ? Math.round((todayCorrectCount / todayTotalQuestions) * 100) : 0;
  
  const todayPlanCompleted = todayPlanRecords.some(r => r.completedAsPlan);
  const lastUnmetReasons = todayPlanRecords.length > 0 
    ? todayPlanRecords[todayPlanRecords.length - 1].unmetReasons 
    : [];

  const getProgressStatus = () => {
    if (isCompleted) return { text: '已完成', status: 'completed' };
    if (todayPlanRecords.length === 0) return { text: '未开始', status: 'pending' };
    if (todayTotalQuestions < dailyPlan!.questionCount) return { text: '进行中', status: 'progress' };
    if (lastUnmetReasons && lastUnmetReasons.length > 0) return { text: '未达成', status: 'failed' };
    return { text: '已完成', status: 'completed' };
  };

  const progressStatus = getProgressStatus();
  const progressPercent = Math.min(100, Math.round((todayTotalQuestions / (dailyPlan?.questionCount || 20)) * 100));

  return (
    <View className={styles.pageContainer}>
      <View className={styles.contentSection}>
        <View className={styles.pageTitle}>
          <Text className={styles.titleEmoji}>📝</Text>
          <Text>每日计划</Text>
        </View>

        <View className={styles.streakSection} onClick={() => setShowCalendar(true)}>
          <Text className={styles.streakIcon}>🔥</Text>
          <View className={styles.streakInfo}>
            <View className={styles.streakDays}>
              {userProfile.continuousDays} 天
            </View>
            <View className={styles.streakText}>
              已连续打卡 {userProfile.continuousDays} 天，本周完成 {completedDays} 天
            </View>
          </View>
          <Text className={styles.sectionIcon}>›</Text>
        </View>

        {dailyPlan && mode === 'view' && (
          <View className={styles.todayPlanCard}>
            <View className={styles.planHeader}>
              <View>
                <View className={styles.planTitle}>今日练习计划</View>
                <View className={styles.planDate}>
                  {GradeNames[dailyPlan.grade]} · {dayjs().format('MM月DD日 dddd')}
                </View>
              </View>
              <View
                className={classNames(
                  styles.statusBadge,
                  progressStatus.status === 'completed' ? styles.completedBadge :
                  progressStatus.status === 'progress' ? styles.progressBadge :
                  progressStatus.status === 'failed' ? styles.failedBadge :
                  styles.pendingBadge
                )}
              >
                {progressStatus.status === 'completed' ? '✓ 已完成' :
                 progressStatus.status === 'progress' ? '⏳ 进行中' :
                 progressStatus.status === 'failed' ? '⚠️ 未达成' :
                 '待完成'}
              </View>
            </View>

            {todayTotalQuestions > 0 && (
              <View className={styles.progressSection}>
                <View className={styles.progressHeader}>
                  <Text className={styles.progressLabel}>今日进度</Text>
                  <Text className={styles.progressValue}>
                    {todayTotalQuestions} / {dailyPlan.questionCount} 题
                  </Text>
                </View>
                <View className={styles.progressBar}>
                  <View 
                    className={classNames(
                      styles.progressFill,
                      progressStatus.status === 'completed' ? styles.progressComplete :
                      progressStatus.status === 'failed' ? styles.progressFailed :
                      styles.progressInProgress
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
                <View className={styles.progressStats}>
                  <Text className={styles.progressStat}>
                    正确率: {todayCorrectRate}%
                  </Text>
                  <Text className={styles.progressStat}>
                    {todayPlanRecords.length} 次计划练习
                  </Text>
                </View>
              </View>
            )}

            {lastUnmetReasons.length > 0 && !isCompleted && (
              <View className={styles.unmetReasonsSection}>
                <Text className={styles.unmetReasonsTitle}>⚠️ 上次未达成原因：</Text>
                {lastUnmetReasons.map((reason, idx) => (
                  <Text key={idx} className={styles.unmetReasonItem}>• {reason}</Text>
                ))}
              </View>
            )}

            <View className={styles.planDetails}>
              <View className={styles.planDetailItem}>
                <View className={styles.planDetailValue}>{dailyPlan.questionCount}</View>
                <View className={styles.planDetailLabel}>道题</View>
              </View>
              <View className={styles.planDetailItem}>
                <View className={styles.planDetailValue}>
                  {formatTime(dailyPlan.timeLimit)}
                </View>
                <View className={styles.planDetailLabel}>限时</View>
              </View>
              <View className={styles.planDetailItem}>
                <View className={styles.planDetailValue}>{dailyPlan.questionTypes.length}</View>
                <View className={styles.planDetailLabel}>种题型</View>
              </View>
            </View>

            <View className={styles.planTypes}>
              {dailyPlan.questionTypes.map(type => (
                <View className={styles.typeTag} key={type}>
                  <Text>{allTypes.find(t => t.type === type)?.emoji}</Text>
                  <Text>{QuestionTypeNames[type]}</Text>
                </View>
              ))}
            </View>

            {todayAllRecords.length > 0 && (
              <View className={styles.todayRecordsSection}>
                <Text className={styles.sectionTitle}>今日练习记录</Text>
                {todayAllRecords.map((record, idx) => (
                  <View key={record.id} className={styles.recordItem}>
                    <View className={styles.recordInfo}>
                      <Text className={styles.recordType}>
                        {record.questionTypes.map(t => QuestionTypeNames[t]).join('/')}
                      </Text>
                      <Text className={styles.recordMeta}>
                        {record.totalQuestions}题 · {record.totalTime}秒 · 正确率{Math.round((record.correctCount / record.totalQuestions) * 100)}%
                      </Text>
                    </View>
                    <View className={classNames(
                      styles.recordBadge,
                      record.completedAsPlan ? styles.recordSuccess : 
                      record.planInitiated ? styles.recordFailed : styles.recordNormal
                    )}>
                      {record.completedAsPlan ? '✓ 按计划' : 
                       record.planInitiated ? '未达成' : '自由练习'}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Button
              className={classNames(styles.startBtn, { [styles.disabled]: isCompleted })}
              onClick={handleStartPractice}
              disabled={isCompleted}
            >
              <Text>{isCompleted ? '🎉' : '✏️'}</Text>
              <Text>{isCompleted ? '今日已完成' : todayTotalQuestions > 0 ? '继续练习' : '开始练习'}</Text>
            </Button>
          </View>
        )}

        {mode === 'view' && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionTitleLeft}>
                <Text className={styles.sectionIcon}>⚙️</Text>
                <Text>计划设置</Text>
              </View>
              <Button className={styles.editBtn} onClick={() => setMode('edit')}>
                编辑
              </Button>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>📊</Text>
                <Text>题目数量</Text>
              </View>
              <View className={styles.questionCountOptions}>
                {questionCountOptions.map(count => (
                  <View
                    key={count}
                    className={classNames(
                      styles.countOption,
                      dailyPlan?.questionCount === count && styles.active
                    )}
                  >
                    {count}题
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>🔢</Text>
                <Text>题型选择</Text>
              </View>
              <View className={styles.typeOptions}>
                {allTypes.map(({ type, emoji }) => (
                  <View
                    key={type}
                    className={classNames(
                      styles.typeOption,
                      dailyPlan?.questionTypes.includes(type) && styles.active
                    )}
                  >
                    <Text>{emoji}</Text>
                    <Text>{QuestionTypeNames[type]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>⏱️</Text>
                <Text>时间限制</Text>
              </View>
              <View className={styles.timeLimitOptions}>
                {timeLimitOptions.map(opt => (
                  <View
                    key={opt.value}
                    className={classNames(
                      styles.timeOption,
                      dailyPlan?.timeLimit === opt.value && styles.active
                    )}
                  >
                    <Text className={styles.timeValue}>{opt.label}</Text>
                    <Text className={styles.timeUnit}>
                      {opt.value > 0 ? `${opt.value / 60}分钟` : '自由练习'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {mode === 'edit' && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionTitleLeft}>
                <Text className={styles.sectionIcon}>✏️</Text>
                <Text>编辑计划</Text>
              </View>
              <Button className={styles.editBtn} onClick={() => setMode('view')}>
                取消
              </Button>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>📊</Text>
                <Text>题目数量</Text>
              </View>
              <View className={styles.questionCountOptions}>
                {questionCountOptions.map(count => (
                  <View
                    key={count}
                    className={classNames(
                      styles.countOption,
                      editCount === count && styles.active
                    )}
                    onClick={() => setEditCount(count)}
                  >
                    {count}题
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>🔢</Text>
                <Text>题型选择（可多选）</Text>
              </View>
              <View className={styles.typeOptions}>
                {allTypes.map(({ type, emoji }) => (
                  <View
                    key={type}
                    className={classNames(
                      styles.typeOption,
                      editTypes.includes(type) && styles.active
                    )}
                    onClick={() => handleToggleType(type)}
                  >
                    <Text>{emoji}</Text>
                    <Text>{QuestionTypeNames[type]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <View className={styles.formLabel}>
                <Text>⏱️</Text>
                <Text>时间限制</Text>
              </View>
              <View className={styles.timeLimitOptions}>
                {timeLimitOptions.map(opt => (
                  <View
                    key={opt.value}
                    className={classNames(
                      styles.timeOption,
                      editTimeLimit === opt.value && styles.active
                    )}
                    onClick={() => setEditTimeLimit(opt.value)}
                  >
                    <Text className={styles.timeValue}>{opt.label}</Text>
                    <Text className={styles.timeUnit}>
                      {opt.value > 0 ? `${opt.value / 60}分钟` : '自由练习'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Button className={styles.saveBtn} onClick={handleSavePlan}>
              保存计划
            </Button>
          </View>
        )}

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionTitleLeft}>
              <Text className={styles.sectionIcon}>📅</Text>
              <Text>近7天记录</Text>
            </View>
          </View>

          {historyRecords.length > 0 ? (
            <View className={styles.historySection}>
              {Array.from({ length: 7 }).map((_, i) => {
                const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
                const record = practiceRecords.find(r => r.date === date);
                const completed = record && record.totalQuestions > 0;

                return (
                  <View className={styles.historyItem} key={date}>
                    <Text className={styles.historyDate}>{getDateLabel(date)}</Text>
                    <Text className={styles.historyStatus}>
                      {completed ? '✅' : '⭕'}
                    </Text>
                    <View className={styles.historyInfo}>
                      {completed ? (
                        <View className={styles.historyStats}>
                          <View className={styles.historyStat}>
                            <Text>📝</Text>
                            <Text>{record!.totalQuestions}题</Text>
                          </View>
                          <View className={styles.historyStat}>
                            <Text>✅</Text>
                            <Text>{record!.correctCount}对</Text>
                          </View>
                          <View className={styles.historyStat}>
                            <Text>⏱️</Text>
                            <Text>{Math.floor(record!.totalTime / 60)}分</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={{ color: '#C0C4CC' }}>未完成</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyHistory}>
              暂无练习记录，快去完成今日计划吧！
            </View>
          )}
        </View>
      </View>

      {showCalendar && (
        <CheckInCalendar onClose={() => setShowCalendar(false)} />
      )}
    </View>
  );
};

export default PlanPage;
