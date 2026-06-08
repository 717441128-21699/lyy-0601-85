import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';

interface DraftBoardProps {
  visible: boolean;
  onClose: () => void;
}

const DraftBoard: React.FC<DraftBoardProps> = ({ visible, onClose }) => {
  const canvasRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<any>(null);
  const [lineWidth, setLineWidth] = useState(4);
  const [lineColor, setLineColor] = useState('#1D2129');

  useEffect(() => {
    if (visible && canvasRef.current) {
      const query = Taro.createSelectorQuery();
      query.select('#draftCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node;
            const context = canvas.getContext('2d');
            const dpr = Taro.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            context.scale(dpr, dpr);
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
          }
        });
    }
  }, [visible]);

  const getTouchPos = (e) => {
    const touch = e.touches[0] || e.changedTouches[0];
    const query = Taro.createSelectorQuery();
    query.select('#draftCanvas').boundingClientRect();
    return new Promise((resolve) => {
      query.exec((res) => {
        if (res[0]) {
          resolve({
            x: touch.clientX - res[0].left,
            y: touch.clientY - res[0].top
          });
        }
      });
    });
  };

  const handleTouchStart = async (e) => {
    if (!ctx) return;
    setIsDrawing(true);
    const pos: any = await getTouchPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
  };

  const handleTouchMove = async (e) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const pos: any = await getTouchPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      const query = Taro.createSelectorQuery();
      query.select('#draftCanvas').fields({ node: true, size: true }).exec((res) => {
        if (res[0]) {
          ctx.clearRect(0, 0, res[0].width, res[0].height);
        }
      });
    }
  };

  if (!visible) return null;

  const colors = ['#1D2129', '#FF4D4F', '#52C41A', '#1890FF', '#FAAD14'];
  const widths = [2, 4, 6, 8];

  return (
    <View className={styles.draftBoardOverlay} onClick={onClose}>
      <View className={styles.draftBoard} onClick={(e) => e.stopPropagation()}>
        <View className={styles.header}>
          <Text className={styles.title}>📝 草稿板</Text>
          <Button className={styles.closeBtn} onClick={onClose}>关闭</Button>
        </View>
        
        <View className={styles.canvasContainer}>
          <Canvas
            id="draftCanvas"
            type="2d"
            className={styles.canvas}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </View>

        <View className={styles.toolbar}>
          <View className={styles.toolGroup}>
            <Text className={styles.toolLabel}>颜色:</Text>
            {colors.map((color) => (
              <View
                key={color}
                className={classNames(styles.colorBtn, lineColor === color && styles.active)}
                style={{ backgroundColor: color }}
                onClick={() => setLineColor(color)}
              />
            ))}
          </View>
          
          <View className={styles.toolGroup}>
            <Text className={styles.toolLabel}>粗细:</Text>
            {widths.map((width) => (
              <View
                key={width}
                className={classNames(styles.widthBtn, lineWidth === width && styles.active)}
                onClick={() => setLineWidth(width)}
              >
                <View style={{ width: width * 2, height: width * 2, backgroundColor: '#1D2129', borderRadius: '50%' }} />
              </View>
            ))}
          </View>

          <Button className={styles.clearBtn} onClick={clearCanvas}>清除</Button>
        </View>
      </View>
    </View>
  );
};

export default DraftBoard;
