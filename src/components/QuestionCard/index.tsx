import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  showResult?: boolean;
  index?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, showResult = false, index }) => {
  const isAnswered = question.userAnswer !== undefined;
  const isCorrect = isAnswered && question.isCorrect;

  return (
    <View className={classNames(styles.questionCard, isAnswered && showResult && (isCorrect ? styles.correct : styles.wrong))}>
      {index !== undefined && (
        <Text className={styles.questionIndex}>{index + 1}.</Text>
      )}
      <Text className={styles.expression}>{question.expression}</Text>
      {isAnswered ? (
        <View className={styles.answerRow}>
          <Text className={classNames(styles.userAnswer, showResult && (isCorrect ? styles.correctText : styles.wrongText))}>
            {question.userAnswer}
          </Text>
          {showResult && !isCorrect && (
            <Text className={styles.correctAnswer}>正确答案: {question.answer}</Text>
          )}
        </View>
      ) : (
        <Text className={styles.placeholder}>?</Text>
      )}
      {question.timeSpent !== undefined && showResult && (
        <Text className={styles.timeSpent}>用时: {question.timeSpent}秒</Text>
      )}
    </View>
  );
};

export default QuestionCard;
