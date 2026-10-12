import { AnimatedModal } from '@/src/components/ui/AnimatedModal';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { SheetIn } from '@/src/components/ui/SheetIn';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatedModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cerrar" />
        <SheetIn style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <PressableScale style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </PressableScale>
            <PressableScale
              style={[styles.ok, destructive && styles.okDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.okText}>{confirmLabel}</Text>
            </PressableScale>
          </View>
        </SheetIn>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 22,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  message: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.skyMist,
    alignItems: 'center',
  },
  cancelText: { color: colors.navy, fontWeight: '700' },
  ok: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
  },
  okDanger: { backgroundColor: colors.danger },
  okText: { color: colors.white, fontWeight: '700' },
});
