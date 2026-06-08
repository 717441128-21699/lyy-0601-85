import { Reward } from '@/types';

export const rewardsData: Reward[] = [
  {
    id: 'r1',
    name: '小贴纸',
    description: '可爱的卡通贴纸',
    points: 50,
    image: 'https://picsum.photos/id/292/300/300',
    type: 'virtual',
    stock: 999
  },
  {
    id: 'r2',
    name: '奖章',
    description: '荣誉奖章一枚',
    points: 100,
    image: 'https://picsum.photos/id/312/300/300',
    type: 'virtual',
    stock: 999
  },
  {
    id: 'r3',
    name: '奖杯',
    description: '金灿灿的奖杯',
    points: 200,
    image: 'https://picsum.photos/id/326/300/300',
    type: 'virtual',
    stock: 999
  },
  {
    id: 'r4',
    name: '皇冠',
    description: '尊贵的皇冠',
    points: 500,
    image: 'https://picsum.photos/id/431/300/300',
    type: 'virtual',
    stock: 999
  },
  {
    id: 'r5',
    name: '看动画30分钟',
    description: '兑换后可看30分钟动画片',
    points: 150,
    image: 'https://picsum.photos/id/570/300/300',
    type: 'real',
    stock: 10
  },
  {
    id: 'r6',
    name: '吃零食',
    description: '兑换一次吃零食的机会',
    points: 100,
    image: 'https://picsum.photos/id/580/300/300',
    type: 'real',
    stock: 20
  },
  {
    id: 'r7',
    name: '游乐园门票',
    description: '周末去游乐园玩',
    points: 1000,
    image: 'https://picsum.photos/id/625/300/300',
    type: 'real',
    stock: 3
  },
  {
    id: 'r8',
    name: '新玩具',
    description: '兑换一个新玩具',
    points: 800,
    image: 'https://picsum.photos/id/835/300/300',
    type: 'real',
    stock: 5
  }
];
