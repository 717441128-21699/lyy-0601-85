import Taro from '@tarojs/taro';

export const setStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (error) {
    console.error('[Storage] 设置存储失败:', key, error);
  }
};

export const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const value = Taro.getStorageSync(key);
    if (value === '' || value === null || value === undefined) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Storage] 读取存储失败:', key, error);
    return defaultValue;
  }
};

export const removeStorage = (key: string): void => {
  try {
    Taro.removeStorageSync(key);
  } catch (error) {
    console.error('[Storage] 删除存储失败:', key, error);
  }
};

export const clearStorage = (): void => {
  try {
    Taro.clearStorageSync();
  } catch (error) {
    console.error('[Storage] 清空存储失败:', error);
  }
};
