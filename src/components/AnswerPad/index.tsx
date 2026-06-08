import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface AnswerPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const AnswerPad: React.FC<AnswerPadProps> = ({ value, onChange, onSubmit, disabled = false }) => {
  const handlePress = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === 'clear') {
      onChange('');
    } else if (key === '-') {
      if (value === '') {
        onChange('-');
      }
    } else {
      onChange(value + key);
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['-', '0', 'del'],
    ['clear']
  ];

  return (
    <View className={styles.answerPad}>
      <View className={styles.display}>
        <Text className={classNames(styles.displayText, value === '' && styles.placeholder)}>
          {value || '请输入答案'}
        </Text>
      </View>
      <View className={styles.keyboard}>
        {keys.slice(0, 4).map((row, rowIndex) => (
          <View key={rowIndex} className={styles.keyRow}>
            {row.map((key) => (
              <Button
                key={key}
                className={classNames(
                  styles.key,
                  key === 'del' && styles.keyDelete,
                  key === '-' && styles.keySpecial
                )}
                onClick={() => handlePress(key)}
                disabled={disabled}
              >
                {key === 'del' ? '←' : key}
              </Button>
            ))}
          </View>
        ))}
        <View className={styles.keyRow}>
          <Button
            className={classNames(styles.key, styles.keyClear)}
            onClick={() => handlePress('clear')}
            disabled={disabled}
          >
            清除
          </Button>
          <Button
            className={classNames(styles.key, styles.keySubmit)}
            onClick={onSubmit}
            disabled={disabled || value === '' || value === '-'}
          >
            确定
          </Button>
        </View>
      </View>
    </View>
  );
};

export default AnswerPad;
