import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { mockWeeklyReport } from '@/data/mockReport';
import { WeeklyReport, QuestionType, PracticeRecord } from '@/types';
import { QuestionTypeNames } from '@/types';
import dayjs from 'dayjs';
import EmptyState from '@/components/EmptyState';

const ReportPage: React.FC = () => {
  const { practiceRecords, wrongQuestions, userProfile } = useAppStore();
  const [showShareModal, setShowShareModal] = useState(false);

  const generateReport = useCallback((): WeeklyReport | null => {
    if (practiceRecords.length === 0) {
      return mockWeeklyReport;
    }

    const weekStart = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    const weekEnd = dayjs().format('YYYY-MM-DD');

    const weekRecords = practiceRecords.filter(r =>
      dayjs(r.date).isAfter(dayjs(weekStart).subtract(1, 'day')) &&
      dayjs(r.date).isBefore(dayjs(weekEnd).add(1, 'day'))
    );

    if (weekRecords.length === 0) {
      return mockWeeklyReport;
    }

    const totalQuestions = weekRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
    const correctCount = weekRecords.reduce((sum, r) => sum + r.correctCount, 0);
    const correctRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const totalTime = weekRecords.reduce((sum, r) => sum + r.totalTime, 0);
    const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

    const dailyStatsMap = new Map<string, { count: number; correct: number; time: number }>();
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      dailyStatsMap.set(date, { count: 0, correct: 0, time: 0 });
    }

    weekRecords.forEach(record => {
      const date = record.date;
      const stats = dailyStatsMap.get(date) || { count: 0, correct: 0, time: 0 };
      stats.count += record.totalQuestions;
      stats.correct += record.correctCount;
      stats.time += record.totalTime;
      dailyStatsMap.set(date, stats);
    });

    const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, stats]) => ({
      date,
      questionCount: stats.count,
      correctRate: stats.count > 0 ? Math.round((stats.correct / stats.count) * 100) : 0,
      avgTime: stats.count > 0 ? Math.round(stats.time / stats.count) : 0
    }));

    const typeStats = new Map<QuestionType, { wrong: number; total: number }>();
    (['addition', 'subtraction', 'multiplication', 'division', 'mixed'] as QuestionType[]).forEach(type => {
      typeStats.set(type, { wrong: 0, total: 0 });
    });

    weekRecords.forEach(record => {
      record.questionTypes.forEach(type => {
        const stats = typeStats.get(type)!;
        stats.total += Math.ceil(record.totalQuestions / record.questionTypes.length);
      });
    });

    wrongQuestions.forEach(wq => {
      if (dayjs(wq.lastWrongTime).isAfter(dayjs(weekStart).subtract(1, 'day'))) {
        const stats = typeStats.get(wq.type);
        if (stats) {
          stats.wrong += wq.wrongCount;
        }
      }
    });

    const typeAccuracy = Array.from(typeStats.entries())
      .map(([type, stats]) => ({
        type,
        typeName: QuestionTypeNames[type],
        wrongCount: stats.wrong,
        totalCount: stats.total,
        correctRate: stats.total > 0 ? Math.round(((stats.total - stats.wrong) / stats.total) * 100) : 0
      }))
      .filter(s => s.totalCount > 0);

    const weakTypes = typeAccuracy
      .filter(s => s.correctRate < 85)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 2);

    const strongTypes = typeAccuracy
      .filter(s => s.correctRate >= 85)
      .sort((a, b) => b.correctRate - a.correctRate)
      .slice(0, 2);

    return {
      weekStart,
      weekEnd,
      totalQuestions,
      correctCount,
      correctRate,
      avgTimePerQuestion,
      dailyStats,
      weakTypes,
      strongTypes
    };
  }, [practiceRecords, wrongQuestions]);

  const report = useMemo(() => generateReport(), [generateReport]);

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('MM/DD');
  };

  const getWeekDay = (dateStr: string) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return dayjs(dateStr).day() === dayjs().day() ? '今天' : `周${days[dayjs(dateStr).day()]}`;
  };

  const getTypeEmoji = (type: QuestionType) => {
    const emojis: Record<QuestionType, string> = {
      addition: '➕',
      subtraction: '➖',
      multiplication: '✖️',
      division: '➗',
      mixed: '🔢'
    };
    return emojis[type];
  };

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleShareToFriend = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true });
    setShowShareModal(false);
  }, []);

  const handleSaveImage = useCallback(() => {
    Taro.showToast({ title: '已保存到相册', icon: 'success' });
    setShowShareModal(false);
  }, []);

  const handleGoPractice = useCallback(() => {
    Taro.switchTab({ url: '/pages/practice/index' });
  }, []);

  const handleGoWrongBook = useCallback(() => {
    Taro.switchTab({ url: '/pages/wrongbook/index' });
  }, []);

  const onShareAppMessage = () => {
    return {
      title: `${userProfile.name}的口算周报来啦！正确率${report?.correctRate}%，继续加油！`,
      path: '/pages/practice/index'
    };
  };

  if (!report) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.contentSection}>
          <EmptyState
            icon="📊"
            title="暂无练习数据"
            description="快去练习页面完成一些口算题吧！"
            actionText="去练习"
            onAction={handleGoPractice}
          />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.contentSection}>
        <View className={styles.pageTitle}>
          <Text className={styles.titleEmoji}>📊</Text>
          <Text>学习报告</Text>
        </View>

        <View className={styles.overviewCard}>
          <View className={styles.overviewHeader}>
            <View className={styles.weekRange}>
              {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
            </View>
            <Button className={styles.shareBtn} onClick={handleShare}>
              <Text>📤</Text>
              <Text>分享</Text>
            </Button>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>{report.totalQuestions}</View>
              <View className={styles.statsLabel}>总题数</View>
            </View>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>{report.correctRate}%</View>
              <View className={styles.statsLabel}>正确率</View>
            </View>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>{report.avgTimePerQuestion}s</View>
              <View className={styles.statsLabel}>平均用时</View>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📈</Text>
            <Text>本周每日练习</Text>
          </View>

          <View className={styles.dailyChart}>
            {report.dailyStats.map((stat, index) => (
              <View className={styles.chartBar} key={index}>
                <View className={styles.barContainer}>
                  <View
                    className={styles.barFill}
                    style={{ height: `${Math.max(stat.correctRate, 10)}%` }}
                  />
                  <Text className={styles.barRate}>{stat.correctRate}%</Text>
                </View>
                <Text className={styles.barCount}>{stat.questionCount}题</Text>
                <Text className={styles.barLabel}>{getWeekDay(stat.date)}</Text>
              </View>
            ))}
          </View>
        </View>

        {report.weakTypes.length > 0 && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>⚠️</Text>
              <Text>需要巩固的题型</Text>
            </View>

            <View className={styles.weakTypesSection}>
              {report.weakTypes.map((weak, index) => (
                <View className={styles.typeItem} key={index}>
                  <View className={classNames(styles.typeIcon, styles.weakIcon)}>
                    <Text>{getTypeEmoji(weak.type)}</Text>
                  </View>
                  <View className={styles.typeInfo}>
                    <View className={styles.typeName}>{weak.typeName}</View>
                    <View className={styles.typeDesc}>
                      做错 {weak.wrongCount} 题 / 共做 {weak.totalCount} 题
                    </View>
                  </View>
                  <View className={styles.typeProgress}>
                    <View className={styles.progressBarBg}>
                      <View
                        className={classNames(styles.progressBarFill, styles.weakProgress)}
                        style={{ width: `${weak.correctRate}%` }}
                      />
                    </View>
                    <Text className={classNames(styles.progressText, styles.weakText)}>
                      {weak.correctRate}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className={styles.summaryTips}>
              <Text className={styles.tipText}>
                💡 建议：每天花 <Text className={styles.tipHighlight}>10分钟</Text> 专项练习
                <Text className={styles.tipHighlight}>{report.weakTypes[0]?.typeName}</Text>，
                相信很快就能掌握！
              </Text>
            </View>

            <View className={styles.actionBtns}>
              <Button className={classNames(styles.actionBtn, styles.secondaryBtn)} onClick={handleGoWrongBook}>
                <Text>📕</Text>
                <Text>错题重练</Text>
              </Button>
              <Button className={classNames(styles.actionBtn, styles.primaryBtn)} onClick={handleGoPractice}>
                <Text>✏️</Text>
                <Text>去练习</Text>
              </Button>
            </View>
          </View>
        )}

        {report.strongTypes.length > 0 && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🏆</Text>
              <Text>掌握较好的题型</Text>
            </View>

            <View className={styles.strongTypesSection}>
              {report.strongTypes.map((strong, index) => (
                <View className={styles.typeItem} key={index}>
                  <View className={classNames(styles.typeIcon, styles.strongIcon)}>
                    <Text>{getTypeEmoji(strong.type)}</Text>
                  </View>
                  <View className={styles.typeInfo}>
                    <View className={styles.typeName}>{strong.typeName}</View>
                    <View className={styles.typeDesc}>
                      正确率 {strong.correctRate}%，表现非常棒！
                    </View>
                  </View>
                  <View className={styles.typeProgress}>
                    <View className={styles.progressBarBg}>
                      <View
                        className={classNames(styles.progressBarFill, styles.strongProgress)}
                        style={{ width: `${strong.correctRate}%` }}
                      />
                    </View>
                    <Text className={classNames(styles.progressText, styles.strongText)}>
                      {strong.correctRate}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {showShareModal && (
        <View className={styles.shareModal} onClick={() => setShowShareModal(false)}>
          <View className={styles.shareContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.shareTitle}>分享周报</View>

            <View className={styles.shareImg}>
              <View className={styles.shareImgTitle}>
                {userProfile.name}的口算周报
              </View>
              <View className={styles.shareImgStats}>
                <View className={styles.shareImgStat}>
                  <View className={styles.shareImgValue}>{report.totalQuestions}</View>
                  <View className={styles.shareImgLabel}>总题数</View>
                </View>
                <View className={styles.shareImgStat}>
                  <View className={styles.shareImgValue}>{report.correctRate}%</View>
                  <View className={styles.shareImgLabel}>正确率</View>
                </View>
                <View className={styles.shareImgStat}>
                  <View className={styles.shareImgValue}>{report.avgTimePerQuestion}s</View>
                  <View className={styles.shareImgLabel}>平均用时</View>
                </View>
              </View>
            </View>

            <View className={styles.shareOptions}>
              <View className={styles.shareOption} onClick={handleShareToFriend}>
                <View className={styles.shareOptionIcon}>💬</View>
                <Text className={styles.shareOptionText}>微信好友</Text>
              </View>
              <View className={styles.shareOption} onClick={handleSaveImage}>
                <View className={styles.shareOptionIcon}>💾</View>
                <Text className={styles.shareOptionText}>保存图片</Text>
              </View>
              <View className={styles.shareOption} onClick={() => {
                Taro.showToast({ title: '已分享到朋友圈', icon: 'success' });
                setShowShareModal(false);
              }}>
                <View className={styles.shareOptionIcon}>📢</View>
                <Text className={styles.shareOptionText}>朋友圈</Text>
              </View>
            </View>

            <Button className={styles.closeBtn} onClick={() => setShowShareModal(false)}>
              取消
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReportPage;
