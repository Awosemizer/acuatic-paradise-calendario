import { PressableScale } from '@/src/components/ui/PressableScale';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '@/src/theme';
import { SheetIn } from '@/src/components/ui/SheetIn';
import { useIsTablet } from '@/src/hooks/useLayoutMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVisit: () => void;
  onEvent: () => void;
};

export function AddMenu({ visible, onClose, onVisit, onEvent }: Props) {
  const tablet = useIsTablet();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.backdrop, tablet && styles.backdropCenter]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <SheetIn
          variant={tablet ? 'pop' : 'up'}
          style={[styles.sheet, tablet ? styles.sheetDialog : { paddingBottom: 24 + insets.bottom }]}
        >
          <Text style={styles.title}>Agregar al calendario</Text>
          <PressableScale style={styles.optVisit} onPress={onVisit}>
            <Text style={styles.optKicker}>VISITA</Text>
            <Text style={styles.optTitle}>Nueva visita de cliente</Text>
            <Text style={styles.optHint}>Recorrido, consulta o apartado</Text>
          </PressableScale>
          <PressableScale style={styles.optEvent} onPress={onEvent}>
            <Text style={[styles.optKicker, { color: colors.coral }]}>EVENTO</Text>
            <Text style={styles.optTitle}>Nuevo evento interno</Text>
            <Text style={styles.optHint}>Mantenimiento, cierre u otro</Text>
          </PressableScale>
        </SheetIn>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.45)',
    justifyContent: 'flex-end',
  },
  backdropCenter: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheetDialog: { width: '100%', maxWidth: 480, borderRadius: 24 },
  sheet: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    ...shadow.card,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  optVisit: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.aqua,
  },
  optEvent: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.coral,
  },
  optKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.aqua,
    letterSpacing: 0.8,
  },
  optTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 4 },
  optHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
