import { useLocalSearchParams } from 'expo-router';
import { EventFormScreen } from '@/src/components/EventFormScreen';

export default function EditarEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventFormScreen eventId={id} />;
}
