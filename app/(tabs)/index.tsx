import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Download } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import type { App } from '@/backend/db/schema';

export default function StoreScreen() {
  const [search, setSearch] = useState('');

  const { data: apps, isLoading } = trpc.apps.list.useQuery({
    status: 'approved',
    search,
  });

  const incrementDownloadsMutation = trpc.apps.incrementDownloads.useMutation();

  const handleDownload = async (app: App) => {
    try {
      await incrementDownloadsMutation.mutateAsync({ id: app.id });
      
      const canOpen = await Linking.canOpenURL(app.apkUrl);
      if (canOpen) {
        await Linking.openURL(app.apkUrl);
      } else {
        Alert.alert('Download', `Download link: ${app.apkUrl}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Could not download app');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderApp = ({ item }: { item: App }) => (
    <TouchableOpacity style={styles.appCard} activeOpacity={0.7}>
      <Image
        source={{ uri: item.iconUrl }}
        style={styles.appIcon}
        defaultSource={require('@/assets/images/icon.png')}
      />
      <View style={styles.appInfo}>
        <Text style={styles.appName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.appDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.appMeta}>
          <View style={styles.metaItem}>
            <Download size={12} color="#6b7280" />
            <Text style={styles.metaText}>
              {item.downloads.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{formatFileSize(item.fileSize)}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>v{item.version}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownload(item)}
      >
        <Download size={20} color="#10b981" />
      </TouchableOpacity>
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={apps}
          renderItem={renderApp}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No apps found</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'Try a different search' : 'Check back later'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  appCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  appInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  appMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaDivider: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  downloadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
});
