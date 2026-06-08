import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface CountDownTimerProps {
  totalSeconds: number;
  isRunning: boolean;
  onTimeUp?: () => void;
  onTick?: (remaining: number) => void;
  showWarning?: boolean;
  warningThreshold?: number;
}

const CountDownTimer: React.FC<CountDownTimerProps> = ({
  totalSeconds,
  isRunning,
  onTimeUp,
  onTick,
  showWarning = true,
  warningThreshold = 60
}) => {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (onTick) {
          onTick(next);
        }
        if (next <= 0) {
          clearInterval(timer);
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onTimeUp, onTick]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isWarning = showWarning && remaining <= warningThreshold && remaining > 10;
  const isDanger = remaining <= 10 && remaining > 0;
  const isTimeUp = remaining <= 0;

  return (
    <View className={classNames(
      styles.timer,
      isWarning && styles.warning,
      isDanger && styles.danger,
      isTimeUp && styles.timeUp
    )}>
      <Text className={styles.icon}>⏱</Text>
      <Text className={styles.time}>{formatTime(remaining)}</Text>
    </View>
  );
};

export default CountDownTimer;
