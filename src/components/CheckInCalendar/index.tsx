import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';

interface CheckInCalendarProps {
  checkedDates?: string[];
  continuousDays?: number;
  onClose?: () => void;
}

const CheckInCalendar: React.FC<CheckInCalendarProps> = ({ checkedDates: propCheckedDates, continuousDays: propContinuousDays, onClose }) => {
  const { practiceRecords, userProfile } = useAppStore();
  
  const checkedDates = propCheckedDates || practiceRecords.map(r => r.date);
  const continuousDays = propContinuousDays !== undefined ? propContinuousDays : userProfile.continuousDays;
  const today = dayjs();
  const startOfMonth = today.startOf('month');
  const endOfMonth = today.endOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const isChecked = (day: number | null): boolean => {
    if (day === null) return false;
    const dateStr = today.date(day).format('YYYY-MM-DD');
    return checkedDates.includes(dateStr);
  };

  const isToday = (day: number | null): boolean => {
    if (day === null) return false;
    return day === today.date();
  };

  const isFuture = (day: number | null): boolean => {
    if (day === null) return false;
    return day > today.date();
  };

  const calendarContent = (
    <View className={styles.calendar}>
      <View className={styles.header}>
        <Text className={styles.monthTitle}>{today.format('YYYY年MM月')}</Text>
        <View className={styles.continuousBadge}>
          <Text className={styles.flame}>🔥</Text>
          <Text className={styles.continuousText}>连续{continuousDays}天</Text>
        </View>
      </View>

      <View className={styles.weekDays}>
        {weekDays.map((day, index) => (
          <Text
            key={day}
            className={classNames(
              styles.weekDay,
              (index === 0 || index === 6) && styles.weekend
            )}
          >
            {day}
          </Text>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {days.map((day, index) => (
          <View key={index} className={styles.dayCell}>
            {day !== null && (
              <View
                className={classNames(
                  styles.dayContent,
                  isChecked(day) && styles.checked,
                  isToday(day) && styles.today,
                  isFuture(day) && styles.future
                )}
              >
                <Text className={styles.dayText}>{day}</Text>
                {isChecked(day) && <Text className={styles.checkMark}>✓</Text>}
              </View>
            )}
          </View>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.checked)} />
          <Text className={styles.legendText}>已打卡</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classNames(styles.legendDot, styles.today)} />
          <Text className={styles.legendText}>今天</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} />
          <Text className={styles.legendText}>未打卡</Text>
        </View>
      </View>

      {onClose && (
        <Button className={styles.closeBtn} onClick={onClose}>
          关闭
        </Button>
      )}
    </View>
  );

  if (onClose) {
    return (
      <View className={styles.modalOverlay} onClick={onClose}>
        <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {calendarContent}
        </View>
      </View>
    );
  }

  return calendarContent;
};

export default CheckInCalendar;
