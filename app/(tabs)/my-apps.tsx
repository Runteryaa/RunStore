import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import type { App, AppStatus } from '@/backend/db/schema';

export default function MyAppsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const { data: apps, isLoading, refetch } = trpc.apps.myApps.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const getStatusInfo = (status: AppStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: '#f59e0b',
          bg: '#fef3c7',
          text: 'Pending Review',
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: '#10b981',
          bg: '#d1fae5',
          text: 'Approved',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: '#fee2e2',
          text: 'Rejected',
        };
    }
  };

  const renderApp = ({ item }: { item: App }) => {
    const statusInfo = getStatusInfo(item.status);
    const StatusIcon = statusInfo.icon;

    return (
      <View style={styles.appCard}>
        <Image
          source={{ uri: item.iconUrl }}
          style={styles.appIcon}
          defaultSource={require('@/assets/images/icon.png')}
        />
        <View style={styles.appInfo}>
          <Text style={styles.appName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.appVersion}>v{item.version}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <StatusIcon size={12} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          {item.status === 'rejected' && item.rejectionReason && (
            <Text style={styles.rejectionReason} numberOfLines={2}>
              Reason: {item.rejectionReason}
            </Text>
          )}
          {item.status === 'approved' && (
            <Text style={styles.downloads}>
              {item.downloads} {item.downloads === 1 ? 'download' : 'downloads'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Apps</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.refreshButton}>Refresh</Text>
        </TouchableOpacity>
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
              <Package size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No apps submitted yet</Text>
              <Text style={styles.emptySubtext}>
                Go to Upload tab to submit your first app
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  refreshButton: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600' as const,
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
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    lineHeight: 16,
  },
  downloads: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
