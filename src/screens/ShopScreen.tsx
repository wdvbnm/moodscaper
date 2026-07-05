import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import {
  CATEGORIES, ShopCategory, ShopWallpaper,
  fetchShopWallpapers,
} from '../services/shopService';
import { downloadWallpaper } from '../services/wallpaperGenerator';
import { useMembership, PRO_ONLY_CATEGORIES } from '../store/MembershipContext';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 2;
const ITEM_W = (SCREEN_W - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

export default function ShopScreen() {
  const { isPro, upgradeToPro } = useMembership();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [wallpapers, setWallpapers] = useState<ShopWallpaper[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState<ShopWallpaper | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const loadWallpapers = useCallback(async (cat: ShopCategory, p: number) => {
    setLoading(true);
    const data = await fetchShopWallpapers(cat, p);
    if (p === 1) {
      setWallpapers(data);
    } else {
      setWallpapers((prev) => [...prev, ...data]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    loadWallpapers(activeCategory, 1);
  }, [activeCategory]);

  const handleCategoryChange = (cat: ShopCategory) => {
    // Pro 分类检查
    if (PRO_ONLY_CATEGORIES.includes(cat.key) && !isPro) {
      setShowProModal(true);
      return;
    }
    setActiveCategory(cat);
  };

  // 是否锁定当前分类
  const isLocked = PRO_ONLY_CATEGORIES.includes(activeCategory.key) && !isPro;

  const handleLoadMore = () => {
    if (loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadWallpapers(activeCategory, nextPage);
  };

  const handleWallpaperTap = (wp: ShopWallpaper) => {
    setSelectedWallpaper(wp);
  };

  const handleCloseDetail = () => {
    setSelectedWallpaper(null);
  };

  // 详情弹窗
  if (selectedWallpaper) {
    return (
      <WallpaperDetail
        wallpaper={selectedWallpaper}
        onClose={handleCloseDetail}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* 分类标签 */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => {
            const locked = PRO_ONLY_CATEGORIES.includes(cat.key) && !isPro;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  activeCategory.key === cat.key && styles.categoryChipActive,
                  locked && styles.categoryChipLocked,
                ]}
                onPress={() => handleCategoryChange(cat)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory.key === cat.key && styles.categoryLabelActive,
                    locked && styles.categoryLabelLocked,
                  ]}
                >
                  {cat.label}
                </Text>
                {locked && <Text style={styles.proBadge}>PRO</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Pro 升级提示弹窗 */}
      {showProModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🔒</Text>
            <Text style={styles.modalTitle}>Pro 专属分类</Text>
            <Text style={styles.modalDesc}>人像写真、赛博暗色、流体渐变{'\n'}属于 Pro 会员专属内容</Text>
            <TouchableOpacity
              style={styles.modalUpgradeBtn}
              onPress={() => { setShowProModal(false); upgradeToPro('yearly'); }}
            >
              <Text style={styles.modalUpgradeText}>￥48/年 立即升级</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProModal(false)}>
              <Text style={styles.modalClose}>以后再说</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 壁纸网格 */}
      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: GRID_GAP }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => handleWallpaperTap(item)}
            activeOpacity={0.9}
          >
            <img
              src={item.thumbUrl}
              alt={item.author}
              style={styles.gridImage}
              loading="lazy"
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridAuthor} numberOfLines={1}>{item.author}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#9B8C76" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ===== 壁纸详情 =====
function WallpaperDetail({
  wallpaper,
  onClose,
}: {
  wallpaper: ShopWallpaper;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = wallpaper.fullUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1290;
      canvas.height = 2796;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 1290, 2796);

      // 简单的暗角
      const v = ctx.createRadialGradient(645, 1398, 900, 645, 1398, 2000);
      v.addColorStop(0, 'transparent');
      v.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, 1290, 2796);

      const url = canvas.toDataURL('image/png');
      downloadWallpaper(url, `moodscaper-${wallpaper.id}.png`);
    } catch (e) {
      // 直接下载原图
      const link = document.createElement('a');
      link.download = `moodscaper-${wallpaper.id}.jpg`;
      link.href = wallpaper.fullUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.detailContainer}>
      {/* 大图 */}
      <img
        src={wallpaper.fullUrl}
        alt="壁纸预览"
        style={styles.detailImage}
      />

      {/* 底部信息栏 */}
      <View style={styles.detailBar}>
        <TouchableOpacity style={styles.detailClose} onPress={onClose}>
          <Text style={styles.detailCloseText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.detailInfo}>
          <Text style={styles.detailAuthor}>Photo by {wallpaper.author}</Text>
          <Text style={styles.detailUnsplash}>via Unsplash</Text>
        </View>

        <TouchableOpacity
          style={styles.detailDownload}
          onPress={handleDownload}
          disabled={downloading}
        >
          <Text style={styles.detailDownloadText}>
            {downloading ? '下载中...' : '⬇️ 下载壁纸'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  categoryBar: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F5F0E8',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  categoryChipActive: { backgroundColor: '#5C4F3C' },
  categoryChipLocked: { borderColor: '#D4A84B', borderWidth: 1 },
  categoryEmoji: { fontSize: 14, marginRight: 4 },
  categoryLabel: { fontSize: 13, color: '#666' },
  categoryLabelActive: { color: '#FFF', fontWeight: '600' },
  categoryLabelLocked: { color: '#9B8C76' },
  proBadge: {
    fontSize: 9, fontWeight: '800', color: '#D4A84B',
    marginLeft: 4, letterSpacing: 0.5,
  },

  // Pro 弹窗
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 32,
    alignItems: 'center', width: '80%',
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#5C4F3C', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#9B8C76', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalUpgradeBtn: {
    backgroundColor: '#5C4F3C', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 24, marginBottom: 12,
  },
  modalUpgradeText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalClose: { fontSize: 14, color: '#C4B8A8' },
  grid: { paddingHorizontal: GRID_GAP, paddingBottom: 40 },
  gridItem: {
    width: ITEM_W,
    height: ITEM_W * 1.4,
    marginBottom: GRID_GAP,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8E3D9',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  gridAuthor: { color: '#FFF', fontSize: 11 },
  footer: { paddingVertical: 20, alignItems: 'center' },

  // Detail
  detailContainer: { flex: 1, backgroundColor: '#000' },
  detailImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    objectFit: 'contain',
  },
  detailBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detailClose: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailCloseText: { color: '#FFF', fontSize: 18 },
  detailInfo: { flex: 1 },
  detailAuthor: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  detailUnsplash: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  detailDownload: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  detailDownloadText: { color: '#000', fontSize: 14, fontWeight: '600' },
});
