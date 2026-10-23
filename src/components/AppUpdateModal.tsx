import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type AppUpdateModalProps = {
  visible: boolean;
  currentVersion: string;
  minimumVersion: string;
  onUpdate: () => void;
};

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  currentVersion,
  minimumVersion,
  onUpdate,
}) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 300);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        /* Forced update: Android back must not close */
      }}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={[styles.card, { width: cardWidth }]} accessibilityViewIsModal>
            <View style={styles.accentTop} />
            <Text style={styles.title}>Update required</Text>
            <Text style={styles.sub}>
              This version is no longer supported. Please update to continue.
            </Text>
            <Text style={styles.versions}>
              Installed <Text style={styles.verOld}>{currentVersion}</Text>
              {' → '}
              Min <Text style={styles.verNew}>{minimumVersion}</Text>
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={onUpdate}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Open store to update">
              <Text style={styles.btnText}>
                {Platform.OS === 'android'
                  ? 'Update on Google Play'
                  : 'Open App Store'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              {Platform.OS === 'android'
                ? 'Enable auto-update in Play Store for future installs.'
                : 'Enable automatic updates in Settings → App Store.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18,18,18,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  safe: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#323232',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(224, 255, 85, 0.35)',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#A855F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b8b8b8',
    textAlign: 'center',
    marginBottom: 10,
  },
  versions: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 14,
  },
  verOld: { color: '#cccccc', fontWeight: '600' },
  verNew: { color: '#A855F7', fontWeight: '700' },
  btn: {
    backgroundColor: '#A855F7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101018',
  },
  hint: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 15,
    color: '#666666',
    textAlign: 'center',
  },
});

export default AppUpdateModal;
