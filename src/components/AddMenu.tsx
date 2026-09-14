import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVisit: () => void;
  onEvent: () => void;
};

export function AddMenu({ visible, onClose, onVisit, onEvent }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Agregar al calendario</Text>
          <Pressable style={styles.optVisit} onPress={onVisit}>
            <Text style={styles.optKicker}>VISITA</Text>
            <Text style={styles.optTitle}>Nueva visita de cliente</Text>
            <Text style={styles.optHint}>Recorrido, consulta o apartado</Text>
          </Pressable>
          <Pressable style={styles.optEvent} onPress={onEvent}>
            <Text style={[styles.optKicker, { color: colors.coral }]}>EVENTO</Text>
            <Text style={styles.optTitle}>Nuevo evento interno</Text>
            <Text style={styles.optHint}>Mantenimiento, cierre u otro</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.45)',
    justifyContent: 'flex-end',
  },
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
