-- Datos de ejemplo para que el calendario no arranque vacío.
-- Ejecutar DESPUÉS de la migración, desde el SQL Editor de Supabase.
-- Horarios en America/Mexico_City (Pachuca). created_by queda en null (válido).

insert into public.visits (client_name, phone, service_type, starts_at, duration_minutes, notes, status)
values
  (
    'María López',
    '771 403 5756',
    'Recorrido',
    ((timezone('America/Mexico_City', now())::date + time '10:00')::timestamp at time zone 'America/Mexico_City'),
    60,
    'Quiere ver alberca y salón para cumpleaños de 80 invitados.',
    'programada'
  ),
  (
    'Carlos Hernández',
    '771 555 0198',
    'Consulta de paquete',
    ((timezone('America/Mexico_City', now())::date + time '13:00')::timestamp at time zone 'America/Mexico_City'),
    45,
    'Compara paquete Vie–Sáb vs. con comida.',
    'programada'
  ),
  (
    'Ana Rivera',
    null,
    'Apartado de fecha',
    ((timezone('America/Mexico_City', now())::date + 1 + time '11:00')::timestamp at time zone 'America/Mexico_City'),
    30,
    'Apartado del 50% pendiente de confirmar por WhatsApp.',
    'programada'
  ),
  (
    'Familia Morales',
    '771 222 3344',
    'XV años',
    ((timezone('America/Mexico_City', now())::date + 3 + time '16:00')::timestamp at time zone 'America/Mexico_City'),
    420,
    'Paquete Vie–Sáb. 90 adultos + 25 niños. Audio y TV.',
    'programada'
  ),
  (
    'Jorge Peña',
    '771 888 1010',
    'Boda',
    ((timezone('America/Mexico_City', now())::date - 2 + time '17:00')::timestamp at time zone 'America/Mexico_City'),
    420,
    'Evento ya realizado. Cliente dejó depósito de $1,000.',
    'completada'
  ),
  (
    'Lucía Vega',
    '771 444 7788',
    'Reunión',
    ((timezone('America/Mexico_City', now())::date - 1 + time '12:00')::timestamp at time zone 'America/Mexico_City'),
    120,
    'No llegó. Reagendar la semana siguiente.',
    'no_asistio'
  ),
  (
    'Paty Campos',
    null,
    'Cumpleaños',
    ((timezone('America/Mexico_City', now())::date + 5 + time '15:00')::timestamp at time zone 'America/Mexico_City'),
    240,
    'Canceló por clima. Fecha abierta otra vez.',
    'cancelada'
  );

insert into public.events (title, starts_at, duration_minutes, notes)
values
  (
    'Mantenimiento de alberca',
    ((timezone('America/Mexico_City', now())::date + time '08:00')::timestamp at time zone 'America/Mexico_City'),
    120,
    'Química y filtro. No agendar recorridos a esta hora.'
  ),
  (
    'Cierre por evento privado',
    ((timezone('America/Mexico_City', now())::date + 3 + time '15:00')::timestamp at time zone 'America/Mexico_City'),
    480,
    'XV años Familia Morales. Staff completo.'
  ),
  (
    'Junta de equipo',
    ((timezone('America/Mexico_City', now())::date + 2 + time '09:00')::timestamp at time zone 'America/Mexico_City'),
    60,
    'Revisar paquetes de la semana y pendientes de apartado.'
  ),
  (
    'Inventario de meseros y audio',
    ((timezone('America/Mexico_City', now())::date + 6 + time '10:00')::timestamp at time zone 'America/Mexico_City'),
    90,
    'Confirmar mesero extra ($400) para el sábado.'
  );
