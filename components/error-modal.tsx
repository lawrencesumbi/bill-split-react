import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  showSecondaryButton?: boolean;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon = 'warning-outline',
  primaryButtonText = 'OK',
  secondaryButtonText = 'Cancel',
  onPrimaryAction,
  onSecondaryAction,
  showSecondaryButton = false,
}) => {
  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Ionicons name={icon} size={56} color="tomato" />
          
          <ThemedText style={styles.title}>
            {title}
          </ThemedText>
          
          <ThemedText style={styles.message}>
            {message}
          </ThemedText>
          
          <View style={styles.buttonRow}>
            {showSecondaryButton && (
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSecondaryAction}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  {secondaryButtonText}
                </ThemedText>
              </Pressable>
            )}
            
            <Pressable
              style={[
                styles.button, 
                styles.primaryButton,
                showSecondaryButton && styles.flexButton
              ]}
              onPress={handlePrimaryAction}
            >
              <ThemedText style={styles.primaryButtonText}>
                {primaryButtonText}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: 'tomato',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  flexButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 16,
  },
});