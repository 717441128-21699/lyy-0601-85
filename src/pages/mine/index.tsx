import React, { useState, useCallback } from 'react';
import { View, Text, Button, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { GradeNames, DifficultyNames, Grade, Difficulty } from '@/types';
import dayjs from 'dayjs';
import CheckInCalendar from '@/components/CheckInCalendar';

const MinePage: React.FC = () => {
  const {
    userProfile,
    currentGrade,
    settings,
    checkIn,
    setGrade,
    setDifficulty,
    updateSettings,
    verifyParentPassword
  } = useAppStore();

  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'grade' | 'difficulty' | 'parent' | null>(null);

  const today = dayjs().format('YYYY-MM-DD');
  const isCheckedInToday = userProfile.lastCheckIn === today;

  const handleCheckIn = useCallback(() => {
    if (isCheckedInToday) {
      Taro.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }
    const success = checkIn();
    if (success) {
      const bonus = userProfile.continuousDays >= 6 ? 50 : userProfile.continuousDays >= 2 ? 20 : 10;
      Taro.showToast({
        title: `打卡成功！+${bonus}积分`,
        icon: 'success'
      });
    }
  }, [checkIn, isCheckedInToday, userProfile.continuousDays]);

  const handleNavigate = useCallback((url: string, isTab = false) => {
    if (isTab) {
      Taro.switchTab({ url });
    } else {
      Taro.navigateTo({ url });
    }
  }, []);

  const handleGradeChange = useCallback(() => {
    setPendingAction('grade');
    setShowPasswordModal(true);
  }, []);

  const handleDifficultyChange = useCallback(() => {
    setPendingAction('difficulty');
    setShowPasswordModal(true);
  }, []);

  const handleParentCenter = useCallback(() => {
    setPendingAction('parent');
    setShowPasswordModal(true);
  }, []);

  const handlePasswordConfirm = useCallback(() => {
    if (!verifyParentPassword(password)) {
      Taro.showToast({ title: '密码错误', icon: 'error' });
      return;
    }

    setShowPasswordModal(false);
    setPassword('');

    if (pendingAction === 'grade') {
      Taro.showActionSheet({
        itemList: Object.values(GradeNames),
        success: (res) => {
          const grades = Object.keys(GradeNames) as Grade[];
          setGrade(grades[res.tapIndex]);
          Taro.showToast({ title: '年级已更新', icon: 'success' });
        }
      });
    } else if (pendingAction === 'difficulty') {
      Taro.showActionSheet({
        itemList: Object.values(DifficultyNames),
        success: (res) => {
          const difficulties = Object.keys(DifficultyNames) as Difficulty[];
          setDifficulty(difficulties[res.tapIndex]);
          Taro.showToast({ title: '难度已更新', icon: 'success' });
        }
      });
    } else if (pendingAction === 'parent') {
      Taro.navigateTo({ url: '/pages/parent/index' });
    }

    setPendingAction(null);
  }, [password, pendingAction, verifyParentPassword, setGrade, setDifficulty]);

  const handleSwitchChange = useCallback((key: 'soundEnabled' | 'speechEnabled' | 'restReminderEnabled') => {
    updateSettings({ [key]: !settings[key] });
  }, [settings, updateSettings]);

  const handleRestIntervalChange = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['15分钟', '20分钟', '30分钟', '45分钟', '60分钟'],
      success: (res) => {
        const intervals = [15, 20, 30, 45, 60];
        updateSettings({ restInterval: intervals[res.tapIndex] });
      }
    });
  }, [updateSettings]);

  const getCheckInBonus = () => {
    if (userProfile.continuousDays >= 6) return 50;
    if (userProfile.continuousDays >= 2) return 20;
    return 10;
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.contentSection}>
        <View className={styles.userCard}>
          <View className={styles.userInfo}>
            <View className={styles.avatar}>
              <Image className={styles.avatarImg} src={userProfile.avatar} mode="aspectFill" />
            </View>
            <View className={styles.userDetails}>
              <View className={styles.userName}>
                <Text>{userProfile.name}</Text>
                <Text className={styles.gradeBadge}>{GradeNames[currentGrade]}</Text>
              </View>
              <View className={styles.userStats}>
                <Text>累计{userProfile.totalDays}天</Text>
                <Text className={styles.statDivider}>|</Text>
                <Text>连续{userProfile.continuousDays}天</Text>
              </View>
            </View>
          </View>

          <View className={styles.pointsSection}>
            <View className={styles.pointsInfo}>
              <Text className={styles.pointsIcon}>⭐</Text>
              <Text className={styles.pointsValue}>{userProfile.points}</Text>
              <Text className={styles.pointsLabel}>积分</Text>
            </View>
            <Button
              className={styles.redeemBtn}
              onClick={() => handleNavigate('/pages/reward/index')}
            >
              <Text>🎁</Text>
              <Text>去兑换</Text>
            </Button>
          </View>
        </View>

        <View className={styles.checkInCard}>
          <View className={styles.checkInInfo}>
            <View className={styles.checkInTitle}>
              <Text>🔥</Text>
              <Text>每日打卡</Text>
              {userProfile.continuousDays > 0 && (
                <Text className={styles.streakBadge}>{userProfile.continuousDays}天连签</Text>
              )}
            </View>
            <View className={styles.checkInDesc}>
              {isCheckedInToday
                ? '今日已完成打卡，明天继续加油！'
                : `今日打卡可获得 ${getCheckInBonus()} 积分`}
            </View>
          </View>
          <Button
            className={classNames(styles.checkInBtn, { [styles.disabled]: isCheckedInToday })}
            onClick={handleCheckIn}
            disabled={isCheckedInToday}
          >
            <Text>{isCheckedInToday ? '✓' : '📅'}</Text>
            <Text>{isCheckedInToday ? '已打卡' : '去打卡'}</Text>
          </Button>
        </View>

        <View className={styles.statsGrid}>
          <View className={styles.statsCard}>
            <View className={styles.statsCardValue}>
              {userProfile.totalQuestions}
              <Text className={styles.statsCardUnit}>题</Text>
            </View>
            <View className={styles.statsCardLabel}>总练习</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsCardValue}>
              {userProfile.correctRate}
              <Text className={styles.statsCardUnit}>%</Text>
            </View>
            <View className={styles.statsCardLabel}>正确率</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsCardValue}>
              {userProfile.totalDays}
              <Text className={styles.statsCardUnit}>天</Text>
            </View>
            <View className={styles.statsCardLabel}>学习天数</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsCardValue}>
              {userProfile.continuousDays}
              <Text className={styles.statsCardUnit}>天</Text>
            </View>
            <View className={styles.statsCardLabel}>连续打卡</View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            <Text>常用功能</Text>
          </View>

          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={() => handleNavigate('/pages/plan/index')}>
              <View className={classNames(styles.menuIcon, styles.menuIconOrange)}>
                <Text>📝</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>每日计划</View>
                <View className={styles.menuDesc}>制定专属练习计划</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={() => handleNavigate('/pages/reward/index')}>
              <View className={classNames(styles.menuIcon, styles.menuIconYellow)}>
                <Text>🎁</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>奖励中心</View>
                <View className={styles.menuDesc}>用积分兑换奖励</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={handleParentCenter}>
              <View className={classNames(styles.menuIcon, styles.menuIconBlue)}>
                <Text>👨‍👩‍👧</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>家长中心</View>
                <View className={styles.menuDesc}>家长检查和设置管理</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={() => setShowCheckInCalendar(true)}>
              <View className={classNames(styles.menuIcon, styles.menuIconGreen)}>
                <Text>📅</Text>
              </View>
              <View className={styles.menuContent}>
                <View className={styles.menuTitle}>打卡日历</View>
                <View className={styles.menuDesc}>查看打卡记录</View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⚙️</Text>
            <Text>学习设置</Text>
          </View>

          <View className={styles.settingRow} onClick={handleGradeChange}>
            <View className={styles.settingLeft}>
              <Text className={styles.settingIcon}>🎓</Text>
              <View className={styles.settingInfo}>
                <View className={styles.settingTitle}>当前年级</View>
                <View className={styles.settingDesc}>选择适合的学习难度</View>
              </View>
            </View>
            <View className={styles.settingRight}>
              <Text className={styles.selectValue}>{GradeNames[currentGrade]}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>

          <View className={styles.settingRow} onClick={handleDifficultyChange}>
            <View className={styles.settingLeft}>
              <Text className={styles.settingIcon}>📊</Text>
              <View className={styles.settingInfo}>
                <View className={styles.settingTitle}>题目难度</View>
                <View className={styles.settingDesc}>调整题目难易程度</View>
              </View>
            </View>
            <View className={styles.settingRight}>
              <Text className={styles.selectValue}>{DifficultyNames[settings.difficulty]}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingLeft}>
              <Text className={styles.settingIcon}>🔊</Text>
              <View className={styles.settingInfo}>
                <View className={styles.settingTitle}>音效</View>
                <View className={styles.settingDesc}>答题时的提示音效</View>
              </View>
            </View>
            <View
              className={classNames(styles.switch, { [styles.active]: settings.soundEnabled })}
              onClick={() => handleSwitchChange('soundEnabled')}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingLeft}>
              <Text className={styles.settingIcon}>🎤</Text>
              <View className={styles.settingInfo}>
                <View className={styles.settingTitle}>语音播报</View>
                <View className={styles.settingDesc}>听题模式和答案播报</View>
              </View>
            </View>
            <View
              className={classNames(styles.switch, { [styles.active]: settings.speechEnabled })}
              onClick={() => handleSwitchChange('speechEnabled')}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingLeft}>
              <Text className={styles.settingIcon}>⏰</Text>
              <View className={styles.settingInfo}>
                <View className={styles.settingTitle}>休息提醒</View>
                <View className={styles.settingDesc}>保护视力，定时休息</View>
              </View>
            </View>
            <View
              className={classNames(styles.switch, { [styles.active]: settings.restReminderEnabled })}
              onClick={() => handleSwitchChange('restReminderEnabled')}
            >
              <View className={styles.switchDot} />
            </View>
          </View>

          {settings.restReminderEnabled && (
            <View className={styles.settingRow} onClick={handleRestIntervalChange}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>🕐</Text>
                <View className={styles.settingInfo}>
                  <View className={styles.settingTitle}>休息间隔</View>
                  <View className={styles.settingDesc}>多久提醒一次休息</View>
                </View>
              </View>
              <View className={styles.settingRight}>
                <Text className={styles.selectValue}>{settings.restInterval}分钟</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {showCheckInCalendar && (
        <CheckInCalendar onClose={() => setShowCheckInCalendar(false)} />
      )}

      {showPasswordModal && (
        <View className={styles.passwordModal} onClick={() => setShowPasswordModal(false)}>
          <View className={styles.passwordContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.passwordTitle}>家长验证</View>
            <View className={styles.passwordDesc}>请输入家长密码（默认：1234）</View>
            <Input
              className={styles.passwordInput}
              type="number"
              password
              value={password}
              placeholder="请输入4位密码"
              maxlength={4}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className={styles.passwordBtns}>
              <Button
                className={classNames(styles.passwordBtn, styles.cancelBtn)}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPendingAction(null);
                }}
              >
                取消
              </Button>
              <Button
                className={classNames(styles.passwordBtn, styles.confirmBtn)}
                onClick={handlePasswordConfirm}
              >
                确认
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MinePage;
