import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import type { App, AppStatus } from '@/backend/db/schema';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<AppStatus | 'all'>('pending');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const { data: userInfo } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: pendingApps, refetch: refetchApps } = trpc.apps.list.useQuery(
    { status: selectedStatus === 'all' ? undefined : selectedStatus },
    { enabled: isAuthenticated && isAdmin }
  );

  const updateStatusMutation = trpc.apps.updateStatus.useMutation({
    onSuccess: () => {
      refetchApps();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleApprove = (appId: string) => {
    Alert.alert('Approve App', 'Are you sure you want to approve this app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          updateStatusMutation.mutate({ id: appId, status: 'approved' });
        },
      },
    ]);
  };

  const handleReject = (appId: string) => {
    Alert.prompt(
      'Reject App',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (reason?: string) => {
            updateStatusMutation.mutate({
              id: appId,
              status: 'rejected',
              rejectionReason: reason || 'No reason provided',
            });
          },
        },
      ],
      'plain-text'
    );
  };

  const renderApp = ({ item }: { item: App }) => (
    <View style={styles.adminAppCard}>
      <Image
        source={{ uri: item.iconUrl }}
        style={styles.adminAppIcon}
        defaultSource={require('@/assets/images/icon.png')}
      />
      <View style={styles.adminAppInfo}>
        <Text style={styles.adminAppName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.adminAppUploader}>by {item.uploaderName}</Text>
        <Text style={styles.adminAppDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.adminAppMeta}>
          <Text style={styles.adminAppMetaText}>v{item.version}</Text>
          <Text style={styles.adminAppMetaText}>•</Text>
          <Text style={styles.adminAppMetaText}>{item.packageName}</Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item.id)}
            disabled={updateStatusMutation.isPending}
          >
            <CheckCircle size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(item.id)}
            disabled={updateStatusMutation.isPending}
          >
            <XCircle size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <UserIcon size={32} color="#10b981" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userInfo?.name || user?.name}</Text>
              <Text style={styles.profileEmail}>{userInfo?.email || user?.email}</Text>
            </View>
          </View>

          {isAdmin && (
            <View style={styles.adminBadge}>
              <Shield size={16} color="#10b981" />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <View style={styles.adminPanel}>
            <Text style={styles.adminPanelTitle}>Admin Panel</Text>
            <Text style={styles.adminPanelSubtitle}>Review and manage app submissions</Text>

            <View style={styles.filterContainer}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    selectedStatus === status && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedStatus === status && styles.filterButtonTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {updateStatusMutation.isPending && (
              <View style={styles.adminLoadingOverlay}>
                <ActivityIndicator color="#10b981" />
              </View>
            )}

            <FlatList
              data={pendingApps}
              renderItem={renderApp}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyAdmin}>
                  <Text style={styles.emptyAdminText}>No apps to review</Text>
                </View>
              }
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  adminBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  adminPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  adminPanelTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  adminPanelSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  adminLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adminAppCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  adminAppIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  adminAppInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminAppName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  adminAppUploader: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  adminAppDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  adminAppMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  adminAppMetaText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  adminActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAdmin: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyAdminText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
