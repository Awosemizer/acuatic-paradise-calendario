import { useLocalSearchParams } from 'expo-router';
import { VisitFormScreen } from '@/src/components/VisitFormScreen';

export default function EditarVisita() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VisitFormScreen visitId={id} />;
}
