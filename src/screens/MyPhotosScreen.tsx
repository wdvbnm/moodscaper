import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { useMembership } from '../store/MembershipContext';
import { UserPhoto, loadPhotos, addPhoto, removePhoto, pickImage, setCurrentPhoto, FREE_MAX_PHOTOS, PRO_MAX_PHOTOS } from '../services/photoStorage';

const GRID_GAP = 4;
const GRID_COLS = 3;

export default function MyPhotosScreen({ onClose, onSelect }: { onClose?: () => void; onSelect?: (dataUrl: string) => void }) {
  const { isPro } = useMembership();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const maxPhotos = isPro ? PRO_MAX_PHOTOS : FREE_MAX_PHOTOS;

  const refresh = useCallback(async () => {
    const data = await loadPhotos();
    setPhotos(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const file = await pickImage();
      if (!file) { setUploading(false); return; }
      await addPhoto(file, maxPhotos);
      await refresh();
    } catch (e: any) {
      Alert.alert('上传失败', e.message || '请重试');
    }
    setUploading(false);
  };

  const handleDelete = (photo: UserPhoto) => {
    Alert.alert('删除照片', `确定删除「${photo.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          await removePhoto(photo.id);
          await refresh();
        },
      },
    ]);
  };

  const handleSetAsWallpaper = async (photo: UserPhoto) => {
    await setCurrentPhoto(photo.dataUrl);
    onSelect?.(photo.dataUrl);
    Alert.alert('已设置', '图库壁纸已更新，回到今日页查看');
  };

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>← 返回</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>我的图库</Text>
        <Text style={styles.count}>{photos.length}/{maxPhotos}</Text>
      </View>

      {/* 上传按钮 */}
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color="#5C4F3C" />
        ) : (
          <>
            <Text style={styles.uploadIcon}>📤</Text>
            <Text style={styles.uploadLabel}>上传照片</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 照片网格 */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#5C4F3C" />
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={styles.emptyText}>还没有上传照片{'\n'}点击上方按钮开始</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
            {photos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.gridItem}
                onLongPress={() => handleDelete(p)}
                onPress={() => handleSetAsWallpaper(p)}
              >
                <Image source={{ uri: p.dataUrl }} style={styles.gridImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>长按照片删除 · 点击设为壁纸</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  closeText: { fontSize: 15, color: '#5C4F3C' },
  title: { fontSize: 20, fontWeight: '700', color: '#5C4F3C' },
  count: { fontSize: 14, color: '#9B8C76' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginBottom: 16,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0D8CC',
    borderStyle: 'dashed', gap: 8,
  },
  uploadIcon: { fontSize: 20 },
  uploadLabel: { fontSize: 15, color: '#5C4F3C', fontWeight: '500' },

  grid: { paddingHorizontal: 20, paddingBottom: 40 },
  gridItem: {
    width: '31%', aspectRatio: 9/16,
    borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#E0D8CC',
  },
  gridImage: { width: '100%', height: '100%' },

  hint: { textAlign: 'center', color: '#C4B8A8', fontSize: 12, marginTop: 16 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9B8C76', textAlign: 'center', lineHeight: 22 },

  // 锁定状态
  lockedContainer: { flex: 1, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockEmoji: { fontSize: 56, marginBottom: 16 },
  lockTitle: { fontSize: 22, fontWeight: '700', color: '#5C4F3C', marginBottom: 12 },
  lockDesc: { fontSize: 15, color: '#9B8C76', textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  upgradeBtn: {
    backgroundColor: '#5C4F3C', paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 24, marginBottom: 16,
  },
  upgradeText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  backBtn: { paddingVertical: 10 },
  backText: { fontSize: 15, color: '#9B8C76' },
});
