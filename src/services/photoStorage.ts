import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PHOTOS_KEY = '@moodscaper_user_photos';
const CURRENT_PHOTO_KEY = '@moodscaper_current_custom_photo';
export const FREE_MAX_PHOTOS = 10;
export const PRO_MAX_PHOTOS = 50;

export interface UserPhoto {
  id: string;
  dataUrl: string;     // base64 图片
  name: string;
  addedAt: string;     // ISO date
}

// ===== 加载全部照片 =====
export async function loadPhotos(): Promise<UserPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ===== 保存照片列表 =====
async function savePhotos(photos: UserPhoto[]): Promise<void> {
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

// ===== 添加照片 =====
export async function addPhoto(file: File, maxCount: number = FREE_MAX_PHOTOS): Promise<UserPhoto | null> {
  const photos = await loadPhotos();
  if (photos.length >= maxCount) {
    throw new Error(maxCount === FREE_MAX_PHOTOS
      ? `免费版最多存储 ${FREE_MAX_PHOTOS} 张照片，升级 Pro 可存 ${PRO_MAX_PHOTOS} 张`
      : `最多存储 ${maxCount} 张照片`);
  }

  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl) return null;

  const photo: UserPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dataUrl,
    name: file.name || '未命名',
    addedAt: new Date().toISOString(),
  };

  photos.push(photo);
  await savePhotos(photos);
  return photo;
}

// ===== 删除照片 =====
export async function removePhoto(photoId: string): Promise<void> {
  const photos = await loadPhotos();
  const filtered = photos.filter((p) => p.id !== photoId);
  await savePhotos(filtered);
}

// ===== 当前使用的图库壁纸 =====
export async function setCurrentPhoto(dataUrl: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_PHOTO_KEY, dataUrl);
}

export async function getCurrentPhoto(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_PHOTO_KEY);
}

export async function clearCurrentPhoto(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_PHOTO_KEY);
}

// ===== 获取随机用户照片 =====
export async function getRandomUserPhoto(): Promise<UserPhoto | null> {
  const photos = await loadPhotos();
  if (photos.length === 0) return null;
  return photos[Math.floor(Math.random() * photos.length)];
}

// ===== 工具：File → data URL =====
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// ===== 打开文件选择器（Web 用 input，原生用 expo-image-picker） =====
export async function pickImage(): Promise<File | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        resolve(file || null);
      };
      input.click();
    });
  }
  // 原生端用 expo-image-picker
  try {
    const ImagePicker = require('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [9, 19.5],
    });
    if (!result.canceled && result.assets?.[0]) {
      // 原生端返回的是 uri，不能直接当 File
      return null; // 原生端留待后续实现
    }
    return null;
  } catch {
    return null;
  }
}
