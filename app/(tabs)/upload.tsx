import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload as UploadIcon, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

export default function UploadScreen() {
  const [name, setName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [apkUrl, setApkUrl] = useState('');

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const createAppMutation = trpc.apps.create.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Success!',
        'Your app has been submitted for review. You can track its status in the My Apps tab.',
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setPackageName('');
              setDescription('');
              setVersion('');
              setIconUrl('');
              setApkUrl('');
              router.push('/(tabs)/my-apps');
            },
          },
        ]
      );
    },
    onError: (error) => {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Could not submit app');
    },
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        Alert.alert(
          'File Selected',
          `In production, this would upload ${file.name}. For now, please enter the APK URL manually.`
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleSubmit = () => {
    if (!name || !packageName || !description || !version || !iconUrl || !apkUrl) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    createAppMutation.mutate({
      name,
      packageName,
      description,
      version,
      iconUrl,
      apkUrl,
      fileSize: 0,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Submit Your App</Text>
          <Text style={styles.headerSubtitle}>
            Fill in the details below. Your app will be reviewed before going live.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>App Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Awesome App"
              value={name}
              onChangeText={setName}
              editable={!createAppMutation.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Package Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., com.company.app"
              value={packageName}
              onChangeText={setPackageName}
              autoCapitalize="none"
              editable={!createAppMutation.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what your app does..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!createAppMutation.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Version *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1.0.0"
              value={version}
              onChangeText={setVersion}
              editable={!createAppMutation.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/icon.png"
              value={iconUrl}
              onChangeText={setIconUrl}
              autoCapitalize="none"
              editable={!createAppMutation.isPending}
            />
            {iconUrl ? (
              <Image
                source={{ uri: iconUrl }}
                style={styles.iconPreview}
                onError={() => Alert.alert('Error', 'Invalid icon URL')}
              />
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>APK URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/app.apk"
              value={apkUrl}
              onChangeText={setApkUrl}
              autoCapitalize="none"
              editable={!createAppMutation.isPending}
            />
            <TouchableOpacity
              style={styles.pickButton}
              onPress={handlePickDocument}
              disabled={createAppMutation.isPending}
            >
              <FileText size={16} color="#10b981" />
              <Text style={styles.pickButtonText}>Pick APK File</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              createAppMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createAppMutation.isPending}
          >
            {createAppMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <UploadIcon size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  iconPreview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginTop: 12,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
