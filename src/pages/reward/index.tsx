import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { Reward } from '@/types';
import dayjs from 'dayjs';

type TabType = 'virtual' | 'real';

interface RedeemRecord {
  rewardId: string;
  rewardName: string;
  rewardImage: string;
  points: number;
  time: string;
}

const RewardPage: React.FC = () => {
  const { userProfile, rewards, redeemReward } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('virtual');
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemRecords, setRedeemRecords] = useState<RedeemRecord[]>([]);

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => r.type === activeTab);
  }, [rewards, activeTab]);

  const canRedeem = useCallback((reward: Reward) => {
    return userProfile.points >= reward.points && reward.stock > 0;
  }, [userProfile.points]);

  const handleRedeemClick = useCallback((reward: Reward) => {
    if (!canRedeem(reward)) {
      if (reward.stock <= 0) {
        Taro.showToast({ title: '库存不足', icon: 'none' });
      } else {
        Taro.showToast({ title: '积分不足', icon: 'none' });
      }
      return;
    }
    setConfirmReward(reward);
  }, [canRedeem]);

  const handleConfirmRedeem = useCallback(() => {
    if (!confirmReward) return;

    const success = redeemReward(confirmReward.id);
    if (success) {
      setRedeemRecords(prev => [{
        rewardId: confirmReward.id,
        rewardName: confirmReward.name,
        rewardImage: confirmReward.image,
        points: confirmReward.points,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }, ...prev]);

      setConfirmReward(null);
      setShowSuccess(true);
    } else {
      Taro.showToast({ title: '兑换失败，请重试', icon: 'error' });
    }
  }, [confirmReward, redeemReward]);

  const handleEarnPoints = useCallback(() => {
    Taro.switchTab({ url: '/pages/practice/index' });
  }, []);

  const recentRecords = useMemo(() => {
    return redeemRecords.slice(0, 5);
  }, [redeemRecords]);

  return (
    <View className={styles.pageContainer}>
      <View className={styles.contentSection}>
        <View className={styles.pageTitle}>
          <Text className={styles.titleEmoji}>🎁</Text>
          <Text>奖励中心</Text>
        </View>

        <View className={styles.pointsCard}>
          <View className={styles.pointsHeader}>
            <View>
              <View className={styles.pointsTitle}>我的积分</View>
              <View className={styles.pointsSubtitle}>努力练习赚取更多积分</View>
            </View>
            <Button
              className={classNames(styles.redeemBtn)}
              onClick={handleEarnPoints}
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              去赚积分
            </Button>
          </View>
          <View className={styles.pointsValue}>
            <Text>{userProfile.points}</Text>
            <Text className={styles.pointsUnit}>积分</Text>
          </View>
          <View className={styles.pointsTips}>
            <Text>💡</Text>
            <Text>完成每日练习、闯关、打卡都可以获得积分哦！</Text>
          </View>
        </View>

        <View className={styles.tabs}>
          <View
            className={classNames(styles.tabItem, activeTab === 'virtual' && styles.active)}
            onClick={() => setActiveTab('virtual')}
          >
            虚拟奖励
          </View>
          <View
            className={classNames(styles.tabItem, activeTab === 'real' && styles.active)}
            onClick={() => setActiveTab('real')}
          >
            实物奖励
          </View>
        </View>

        {filteredRewards.length > 0 ? (
          <View className={styles.rewardList}>
            {filteredRewards.map(reward => (
              <View className={styles.rewardCard} key={reward.id}>
                <View
                  className={classNames(
                    styles.rewardTypeTag,
                    reward.type === 'virtual' ? styles.typeVirtual : styles.typeReal
                  )}
                >
                  {reward.type === 'virtual' ? '虚拟' : '实物'}
                </View>
                <View className={styles.rewardImage}>
                  <Image className={styles.rewardImg} src={reward.image} mode="aspectFill" />
                </View>
                <View className={styles.rewardName}>{reward.name}</View>
                <View className={styles.rewardDesc}>{reward.description}</View>
                <View className={styles.rewardFooter}>
                  <View className={styles.rewardPrice}>
                    <Text className={styles.priceIcon}>⭐</Text>
                    <Text>{reward.points}</Text>
                  </View>
                  <Button
                    className={classNames(styles.redeemBtn, { [styles.disabled]: !canRedeem(reward) })}
                    onClick={() => handleRedeemClick(reward)}
                    disabled={!canRedeem(reward)}
                  >
                    {reward.stock <= 0 ? '已售罄' : '兑换'}
                  </Button>
                </View>
                {reward.stock < 999 && (
                  <View className={styles.stockInfo}>
                    仅剩 {reward.stock} 件
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>🎁</View>
            <View className={styles.emptyText}>暂无{activeTab === 'virtual' ? '虚拟' : '实物'}奖励</View>
          </View>
        )}

        {recentRecords.length > 0 && (
          <View className={styles.historySection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📜</Text>
              <Text>最近兑换</Text>
            </View>
            <View className={styles.historyList}>
              {recentRecords.map((record, index) => (
                <View className={styles.historyItem} key={index}>
                  <View className={styles.historyIcon}>
                    <Image className={styles.historyImg} src={record.rewardImage} mode="aspectFill" />
                  </View>
                  <View className={styles.historyInfo}>
                    <View className={styles.historyName}>{record.rewardName}</View>
                    <View className={styles.historyTime}>{record.time}</View>
                  </View>
                  <View className={styles.historyPoints}>-{record.points}</View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {confirmReward && (
        <View className={styles.confirmModal} onClick={() => setConfirmReward(null)}>
          <View className={styles.confirmContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.confirmImage}>
              <Image className={styles.confirmImg} src={confirmReward.image} mode="aspectFill" />
            </View>
            <View className={styles.confirmTitle}>确认兑换</View>
            <View className={styles.confirmDesc}>{confirmReward.description}</View>
            <View className={styles.confirmPrice}>
              <Text>⭐</Text>
              <Text>{confirmReward.points} 积分</Text>
            </View>
            <View className={styles.confirmBtns}>
              <Button
                className={classNames(styles.confirmBtn, styles.cancelBtn)}
                onClick={() => setConfirmReward(null)}
              >
                再想想
              </Button>
              <Button
                className={classNames(styles.confirmBtn, styles.okBtn)}
                onClick={handleConfirmRedeem}
              >
                确认兑换
              </Button>
            </View>
          </View>
        </View>
      )}

      {showSuccess && (
        <View className={styles.successModal}>
          <View className={styles.successContent}>
            <View className={styles.successIcon}>🎉</View>
            <View className={styles.successTitle}>兑换成功！</View>
            <View className={styles.successDesc}>
              恭喜你获得了 {confirmReward?.name || '奖励'}！
              {confirmReward?.type === 'real' && '请联系家长领取实物奖励。'}
            </View>
            <Button
              className={styles.successBtn}
              onClick={() => {
                setShowSuccess(false);
                setConfirmReward(null);
              }}
            >
              太棒了！
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default RewardPage;
