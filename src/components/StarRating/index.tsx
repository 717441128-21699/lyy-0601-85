import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface StarRatingProps {
  count: number;
  total?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  animated?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  count,
  total = 3,
  size = 'md',
  showCount = false,
  animated = false
}) => {
  const stars = Array.from({ length: total }, (_, i) => i < count);

  return (
    <View className={classNames(styles.starRating, styles[size])}>
      {stars.map((filled, index) => (
        <Text
          key={index}
          className={classNames(
            styles.star,
            filled && styles.filled,
            animated && filled && styles.animated
          )}
          style={{ animationDelay: `${index * 0.15}s` }}
        >
          ★
        </Text>
      ))}
      {showCount && (
        <Text className={styles.countText}>{count}/{total}</Text>
      )}
    </View>
  );
};

export default StarRating;
