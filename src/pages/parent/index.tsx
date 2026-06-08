import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { GradeNames, DifficultyNames, Grade, Difficulty, QuestionTypeNames } from '@/types';
import dayjs from 'dayjs';

type ModalType = 'password' | 'newPassword' | 'grade' | 'difficulty' | 'checkRecords' | null;

const ParentPage: React.FC = () => {
  const {
    userProfile,
    currentGrade,
    settings,
    practiceRecords,
    wrongQuestions,
    dailyPlan,
    setGrade,
    setDifficulty,
    updateSettings,
    clearWrongQuestions
  } = useAppStore();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const today = dayjs().format('YYYY-MM-DD');
  const todayRecord = practiceRecords.find(r => r.date === today);

  const weekStats = useMemo(() => {
    const weekStart = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    const weekRecords = practiceRecords.filter(r =>
      dayjs(r.date).isAfter(dayjs(weekStart).subtract(1, 'day'))
    );

    const totalQuestions = weekRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalCorrect = weekRecords.reduce((sum, r) => sum + r.correctCount, 0);
    const correctRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const avgTime = totalQuestions > 0
      ? Math.round(weekRecords.reduce((sum, r) => sum + r.totalTime, 0) / totalQuestions)
      : 0;
    const activeDays = weekRecords.filter(r => r.totalQuestions > 0).length;

    return { totalQuestions, correctRate, avgTime, activeDays };
  }, [practiceRecords]);

  const checkItems = useMemo(() => [
    {
      id: 'dailyPlan',
      title: '今日计划完成',
      desc: dailyPlan?.questionCount ? `完成${dailyPlan.questionCount}道口算题` : '今日计划未设置',
      icon: '📝',
      checked: !!todayRecord && todayRecord.totalQuestions >= (dailyPlan?.questionCount || 0),
      statusText: todayRecord
        ? todayRecord.totalQuestions >= (dailyPlan?.questionCount || 0)
          ? '已完成'
          : `已做${todayRecord.totalQuestions}题`
        : '未开始'
    },
    {
      id: 'checkIn',
      title: '今日打卡',
      desc: '每日打卡获得积分奖励',
      icon: '📅',
      checked: userProfile.lastCheckIn === today,
      statusText: userProfile.lastCheckIn === today ? '已打卡' : '未打卡'
    },
    {
      id: 'wrongReview',
      title: '错题复习',
      desc: wrongQuestions.length > 0 ? `有${wrongQuestions.length}道错题待复习` : '暂无错题，继续保持！',
      icon: '📕',
      checked: wrongQuestions.length === 0,
      statusText: wrongQuestions.length > 0 ? `${wrongQuestions.length}道待复习` : '已完成'
    },
    {
      id: 'challenge',
      title: '闯关练习',
      desc: '每天完成一关，保持学习状态',
      icon: '🎮',
      checked: practiceRecords.some(r =>
        r.date === today && r.totalQuestions >= 10
      ),
      statusText: practiceRecords.some(r => r.date === today && r.totalQuestions >= 10)
        ? '已练习'
        : '未开始'
    }
  ], [todayRecord, dailyPlan, userProfile.lastCheckIn, today, wrongQuestions.length, practiceRecords]);

  const completedChecks = checkItems.filter(c => c.checked).length;

  const handleCheckItem = useCallback((itemId: string) => {
    if (itemId === 'dailyPlan') {
      Taro.switchTab({ url: '/pages/practice/index' });
    } else if (itemId === 'wrongReview') {
      Taro.switchTab({ url: '/pages/wrongbook/index' });
    } else if (itemId === 'challenge') {
      Taro.switchTab({ url: '/pages/challenge/index' });
    } else if (itemId === 'checkIn') {
      Taro.switchTab({ url: '/pages/mine/index' });
    }
  }, []);

  const handlePasswordChange = useCallback(() => {
    setModalType('password');
  }, []);

  const handlePasswordConfirm = useCallback(() => {
    if (password !== settings.parentPassword) {
      Taro.showToast({ title: '原密码错误', icon: 'error' });
      return;
    }
    setPassword('');
    setModalType('newPassword');
  }, [password, settings.parentPassword]);

  const handleNewPasswordConfirm = useCallback(() => {
    if (newPassword.length !== 4) {
      Taro.showToast({ title: '请输入4位数字密码', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'error' });
      return;
    }
    updateSettings({ parentPassword: newPassword });
    Taro.showToast({ title: '密码修改成功', icon: 'success' });
    setNewPassword('');
    setConfirmPassword('');
    setModalType(null);
  }, [newPassword, confirmPassword, updateSettings]);

  const handleGradeChange = useCallback(() => {
    Taro.showActionSheet({
      itemList: Object.values(GradeNames),
      success: (res) => {
        const grades = Object.keys(GradeNames) as Grade[];
        setGrade(grades[res.tapIndex]);
        Taro.showToast({ title: '年级已更新', icon: 'success' });
      }
    });
  }, [setGrade]);

  const handleDifficultyChange = useCallback(() => {
    Taro.showActionSheet({
      itemList: Object.values(DifficultyNames),
      success: (res) => {
        const difficulties = Object.keys(DifficultyNames) as Difficulty[];
        setDifficulty(difficulties[res.tapIndex]);
        Taro.showToast({ title: '难度已更新', icon: 'success' });
      }
    });
  }, [setDifficulty]);

  const handleSwitchChange = useCallback((key: 'soundEnabled' | 'speechEnabled' | 'restReminderEnabled') => {
    updateSettings({ [key]: !settings[key] });
  }, [settings, updateSettings]);

  const handleClearWrongQuestions = useCallback(() => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有错题吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          clearWrongQuestions();
          Taro.showToast({ title: '已清空错题本', icon: 'success' });
        }
      }
    });
  }, [clearWrongQuestions]);

  const handleExportData = useCallback(() => {
    Taro.showModal({
      title: '导出数据',
      content: '将生成一份学习数据报告，包含练习记录、错题统计等信息。',
      confirmText: '生成报告',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '报告生成中...', icon: 'loading' });
          setTimeout(() => {
            Taro.showToast({ title: '报告已生成', icon: 'success' });
          }, 1500);
        }
      }
    });
  }, []);

  const handleViewCheckRecords = useCallback(() => {
    setModalType('checkRecords');
  }, []);

  const recentRecords = useMemo(() => {
    return practiceRecords
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
      .slice(0, 10);
  }, [practiceRecords]);

  const closeModal = useCallback(() => {
    setModalType(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const renderModal = () => {
    if (modalType === 'password') {
      return (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>验证原密码</View>
            <View className={styles.modalDesc}>请输入当前家长密码</View>
            <Input
              className={styles.modalInput}
              type="number"
              password
              value={password}
              placeholder="请输入4位密码"
              maxlength={4}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className={styles.modalBtns}>
              <Button className={classNames(styles.modalBtn, styles.cancelBtn)} onClick={closeModal}>
                取消
              </Button>
              <Button className={classNames(styles.modalBtn, styles.confirmBtn)} onClick={handlePasswordConfirm}>
                确认
              </Button>
            </View>
          </View>
        </View>
      );
    }

    if (modalType === 'newPassword') {
      return (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>设置新密码</View>
            <View className={styles.modalDesc}>请输入4位数字作为新密码</View>
            <Input
              className={styles.modalInput}
              type="number"
              password
              value={newPassword}
              placeholder="请输入新密码"
              maxlength={4}
              onInput={(e) => setNewPassword(e.detail.value)}
              style={{ marginBottom: '16rpx' }}
            />
            <Input
              className={styles.modalInput}
              type="number"
              password
              value={confirmPassword}
              placeholder="请再次输入新密码"
              maxlength={4}
              onInput={(e) => setConfirmPassword(e.detail.value)}
            />
            <View className={styles.modalBtns}>
              <Button className={classNames(styles.modalBtn, styles.cancelBtn)} onClick={closeModal}>
                取消
              </Button>
              <Button className={classNames(styles.modalBtn, styles.confirmBtn)} onClick={handleNewPasswordConfirm}>
                确认
              </Button>
            </View>
          </View>
        </View>
      );
    }

    if (modalType === 'checkRecords') {
      return (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>最近练习记录</View>
            {recentRecords.length > 0 ? (
              <View className={styles.checkRecordsList}>
                {recentRecords.map((record, index) => (
                  <View className={styles.checkRecordItem} key={index}>
                    <Text className={styles.recordDate}>
                      {dayjs(record.date).format('MM/DD')}
                    </Text>
                    <Text className={styles.recordStatus}>
                      {record.correctCount / record.totalQuestions >= 0.8 ? '✅' : '⚠️'}
                    </Text>
                    <View className={styles.recordInfo}>
                      {record.totalQuestions}题 · 正确{record.correctCount} · {Math.round(record.correctCount / record.totalQuestions * 100)}%
                    </View>
                    <Text
                      className={styles.recordAction}
                      onClick={() => {
                        closeModal();
                        Taro.switchTab({ url: '/pages/report/index' });
                      }}
                    >
                      详情
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ padding: '40rpx 0', color: '#C0C4CC', fontSize: '24rpx' }}>
                暂无练习记录
              </View>
            )}
            <Button className={classNames(styles.modalBtn, styles.cancelBtn)} onClick={closeModal}>
              关闭
            </Button>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.contentSection}>
        <View className={styles.pageTitle}>
          <Text className={styles.titleEmoji}>👨‍👩‍👧</Text>
          <Text>家长中心</Text>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipIcon}>💡</Text>
          <View className={styles.tipContent}>
            <View className={styles.tipTitle}>温馨提示</View>
            <View className={styles.tipText}>
              家长中心可以检查孩子的学习情况，设置学习参数。所有重要操作都需要家长密码验证（默认：1234）。
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📊</Text>
            <Text>本周学习概览</Text>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>
                {weekStats.totalQuestions}
                <Text className={styles.statsUnit}>题</Text>
              </View>
              <View className={styles.statsLabel}>总练习</View>
            </View>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>
                {weekStats.correctRate}
                <Text className={styles.statsUnit}>%</Text>
              </View>
              <View className={styles.statsLabel}>正确率</View>
            </View>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>
                {weekStats.avgTime}
                <Text className={styles.statsUnit}>秒</Text>
              </View>
              <View className={styles.statsLabel}>平均用时</View>
            </View>
            <View className={styles.statsItem}>
              <View className={styles.statsValue}>
                {weekStats.activeDays}
                <Text className={styles.statsUnit}>天</Text>
              </View>
              <View className={styles.statsLabel}>活跃天数</View>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>✅</Text>
            <Text>今日检查</Text>
            <Text style={{ fontSize: '24rpx', color: '#909399', fontWeight: 'normal' }}>
              ({completedChecks}/{checkItems.length})
            </Text>
          </View>

          <View className={styles.checkSection}>
            {checkItems.map(item => (
              <View className={styles.checkItem} key={item.id}>
                <View className={styles.checkInfo}>
                  <View className={styles.checkTitle}>
                    <Text>{item.icon}</Text>
                    <Text>{item.title}</Text>
                  </View>
                  <View className={styles.checkDesc}>{item.desc}</View>
                </View>
                <View className={styles.checkStatus}>
                  <View
                    className={classNames(
                      styles.statusDot,
                      item.checked ? styles.statusDotGreen : styles.statusDotGray
                    )}
                  />
                  <Text className={styles.statusText}>{item.statusText}</Text>
                  <Button
                    className={styles.checkBtn}
                    onClick={() => handleCheckItem(item.id)}
                  >
                    {item.checked ? '查看' : '去完成'}
                  </Button>
                </View>
              </View>
            ))}
          </View>

          <Button
            className={classNames(styles.checkBtn)}
            onClick={handleViewCheckRecords}
            style={{ width: '100%', marginTop: '24rpx' }}
          >
            查看历史记录
          </Button>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⚙️</Text>
            <Text>学习设置</Text>
          </View>

          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={handleGradeChange}>
              <View className={classNames(styles.menuIcon, styles.menuIconBlue)}>
                <Text>🎓</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>当前年级</View>
                <View className={styles.menuDesc}>调整学习内容的难度级别</View>
              </View>
              <Text className={styles.menuValue}>{GradeNames[currentGrade]}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={handleDifficultyChange}>
              <View className={classNames(styles.menuIcon, styles.menuIconOrange)}>
                <Text>📈</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>题目难度</View>
                <View className={styles.menuDesc}>简单/中等/困难三档可选</View>
              </View>
              <Text className={styles.menuValue}>{DifficultyNames[settings.difficulty]}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem}>
              <View className={classNames(styles.menuIcon, styles.menuIconGreen)}>
                <Text>🔊</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>音效开关</View>
                <View className={styles.menuDesc}>答题时的提示音效</View>
              </View>
              <View
                className={classNames(styles.switch, { [styles.active]: settings.soundEnabled })}
                onClick={() => handleSwitchChange('soundEnabled')}
              >
                <View className={styles.switchDot} />
              </View>
            </View>

            <View className={styles.menuItem}>
              <View className={classNames(styles.menuIcon, styles.menuIconPurple)}>
                <Text>🎤</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>语音播报</View>
                <View className={styles.menuDesc}>听题模式和答案播报</View>
              </View>
              <View
                className={classNames(styles.switch, { [styles.active]: settings.speechEnabled })}
                onClick={() => handleSwitchChange('speechEnabled')}
              >
                <View className={styles.switchDot} />
              </View>
            </View>

            <View className={styles.menuItem}>
              <View className={classNames(styles.menuIcon, styles.menuIconRed)}>
                <Text>⏰</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>休息提醒</View>
                <View className={styles.menuDesc}>保护视力，定时休息</View>
              </View>
              <View
                className={classNames(styles.switch, { [styles.active]: settings.restReminderEnabled })}
                onClick={() => handleSwitchChange('restReminderEnabled')}
              >
                <View className={styles.switchDot} />
              </View>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🔐</Text>
            <Text>安全设置</Text>
          </View>

          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={handlePasswordChange}>
              <View className={classNames(styles.menuIcon, styles.menuIconPurple)}>
                <Text>🔑</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>修改家长密码</View>
                <View className={styles.menuDesc}>修改进入家长中心的密码</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={handleExportData}>
              <View className={classNames(styles.menuIcon, styles.menuIconBlue)}>
                <Text>📤</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>导出学习报告</View>
                <View className={styles.menuDesc}>生成完整的学习数据报告</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={handleClearWrongQuestions}>
              <View className={classNames(styles.menuIcon, styles.menuIconRed)}>
                <Text>🗑️</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>清空错题本</View>
                <View className={styles.menuDesc}>清除所有错题记录</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        </View>
      </View>

      {renderModal()}
    </View>
  );
};

export default ParentPage;
