import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface ProgressBarProps {
  current: number;
  total: number;
  showText?: boolean;
  color?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showText = true,
  color,
  height = 12
}) => {
  const percent = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
  const progressColor = color || (percent >= 80 ? '#52C41A' : percent >= 50 ? '#FAAD14' : '#FF7A45');

  return (
    <View className={styles.progressBar}>
      {showText && (
        <View className={styles.progressText}>
          <Text className={styles.current}>{current}</Text>
          <Text className={styles.separator}>/</Text>
          <Text className={styles.total}>{total}</Text>
          <Text className={styles.percent}>({percent}%)</Text>
        </View>
      )}
      <View className={styles.progressTrack} style={{ height: `${height}rpx` }}>
        <View
          className={classNames(styles.progressFill)}
          style={{
            width: `${percent}%`,
            height: `${height}rpx`,
            background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}CC 100%)`
          }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;
