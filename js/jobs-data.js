// ══════════════════════════════════
// jobs-data.js — Catálogo local de ofertas
// ══════════════════════════════════

export const JOBS_DATA = [
  {
    id: 'job-agri-01',
    category: 'Agricultura',
    badge: { label: 'Nuevo', tone: 'blue' },
    company: 'Cooperativa El Campo Verde',
    title: 'Técnico Agrícola',
    salary: '1.800€/mes',
    location: 'Almería, Andalucía',
    type: 'Indefinido',
    schedule: 'Jornada completa',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=700&q=80',
    summary: 'Seguimiento de cultivos, riego eficiente y apoyo técnico a agricultores de la comarca.',
    description: 'Te incorporarás a una cooperativa con varias fincas hortofrutícolas. Coordinarás la planificación semanal del riego, revisarás plagas y prepararás recomendaciones técnicas para los productores asociados.',
    requirements: [
      'Experiencia previa en campo o asesoría agrícola',
      'Carné de conducir y disponibilidad para desplazamientos',
      'Conocimientos básicos de riego y sanidad vegetal'
    ],
    benefits: [
      'Ayuda inicial para alojamiento',
      'Plan de formación técnica trimestral',
      'Horario intensivo durante campañas'
    ],
    contactUrl: 'mailto:talento@campoverde.es?subject=T%C3%A9cnico%20Agr%C3%ADcola%20-%20Arraigo'
  },
  {
    id: 'job-host-01',
    category: 'Hostelería',
    badge: { label: 'Urgente', tone: 'red' },
    company: 'Restaurante La Masía',
    title: 'Jefe de Sala',
    salary: '2.100€/mes',
    location: 'Lleida, Cataluña',
    type: 'Temporal',
    schedule: 'Fines de semana',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80',
    summary: 'Coordinación de sala y atención a clientes en un restaurante rural con alta ocupación.',
    description: 'Buscamos una persona con perfil operativo y trato excelente al cliente para liderar el equipo de sala durante la temporada alta. Coordinarás turnos, reservas y eventos especiales.',
    requirements: [
      'Experiencia mínima de 2 años en sala',
      'Capacidad para coordinar equipos pequeños',
      'Disponibilidad en fines de semana y festivos'
    ],
    benefits: [
      'Turnos compactos',
      'Incentivo por objetivos de servicio',
      'Comidas incluidas'
    ],
    contactUrl: 'mailto:equipo@lamasia.cat?subject=Jefe%20de%20Sala%20-%20Arraigo'
  },
  {
    id: 'job-health-01',
    category: 'Sanidad',
    badge: { label: 'Destacado', tone: 'green' },
    company: 'Centro de Salud Serranía',
    title: 'Enfermero/a Especialista',
    salary: '2.600€/mes',
    location: 'Cuenca, Castilla-La Mancha',
    type: 'Indefinido',
    schedule: 'Turno rotativo',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=700&q=80',
    summary: 'Atención asistencial, seguimiento crónico y programas de salud comunitaria en entorno rural.',
    description: 'Participarás en un centro comarcal con fuerte coordinación con atención primaria. El puesto combina asistencia directa, educación sanitaria y visitas programadas a municipios próximos.',
    requirements: [
      'Grado en Enfermería',
      'Colegiación en vigor',
      'Valorable experiencia en atención primaria'
    ],
    benefits: [
      'Plus de ruralidad',
      'Acompañamiento en la llegada al municipio',
      'Equipo estable y plan anual de formación'
    ],
    contactUrl: 'mailto:rrhh@serraniasalud.es?subject=Enfermer%C3%ADa%20Especialista%20-%20Arraigo'
  },
  {
    id: 'job-tech-01',
    category: 'Tecnología',
    badge: { label: 'Híbrido', tone: 'blue' },
    company: 'Rural Tech Solutions',
    title: 'Desarrollador Full-Stack',
    salary: '3.200€/mes',
    location: 'Soria, Castilla y León',
    type: 'Indefinido',
    schedule: 'Jornada completa',
    mode: 'Híbrido',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80',
    summary: 'Desarrollo de plataforma SaaS para cooperativas y pequeños negocios rurales.',
    description: 'Trabajarás en un equipo pequeño con producto ya en mercado. El foco inmediato es mejorar paneles de analítica, flujos de contratación y herramientas internas para ayuntamientos.',
    requirements: [
      'Experiencia con JavaScript y APIs',
      'Capacidad para trabajar con producto en evolución',
      'Buen criterio de UX en herramientas internas'
    ],
    benefits: [
      'Tres días remotos por semana',
      'Bolsa de formación',
      'Horario flexible de entrada'
    ],
    contactUrl: 'mailto:hiring@ruraltech.io?subject=Full-Stack%20-%20Arraigo'
  },
  {
    id: 'job-edu-01',
    category: 'Educación',
    badge: { label: 'Aula Rural', tone: 'green' },
    company: 'CRA Valle Abierto',
    title: 'Maestro/a de Primaria',
    salary: '2.350€/mes',
    location: 'Zamora, Castilla y León',
    type: 'Sustitución larga',
    schedule: 'Mañanas',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=80',
    summary: 'Docencia en aula multigrado y coordinación con familias y equipo itinerante.',
    description: 'El centro trabaja con metodologías activas y proyectos vinculados al territorio. Necesitamos una persona con iniciativa para acompañar grupos pequeños y reforzar competencias básicas.',
    requirements: [
      'Grado en Educación Primaria o equivalente',
      'Sensibilidad para trabajo en grupos multinivel',
      'Capacidad de coordinación con familias'
    ],
    benefits: [
      'Proyecto educativo consolidado',
      'Acompañamiento de tutorización inicial',
      'Apoyo del ayuntamiento en la acogida'
    ],
    contactUrl: 'mailto:direccion@cravalleabierto.es?subject=Primaria%20Rural%20-%20Arraigo'
  },
  {
    id: 'job-agri-02',
    category: 'Agricultura',
    badge: { label: 'Campo', tone: 'green' },
    company: 'Ganadería Sierra Norte',
    title: 'Veterinario/a de Explotación',
    salary: '2.450€/mes',
    location: 'Segovia, Castilla y León',
    type: 'Indefinido',
    schedule: 'Jornada completa',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=700&q=80',
    summary: 'Seguimiento sanitario de explotaciones bovinas y coordinación documental.',
    description: 'La posición combina visitas a explotaciones, control sanitario y apoyo a la digitalización de partes y protocolos. Buscamos una persona resolutiva y muy organizada.',
    requirements: [
      'Licenciatura o grado en Veterinaria',
      'Carné de conducir',
      'Experiencia básica con documentación sanitaria'
    ],
    benefits: [
      'Vehículo de empresa para visitas',
      'Guardias planificadas con antelación',
      'Alojamiento temporal de entrada'
    ],
    contactUrl: 'mailto:empleo@sierranorteganadera.es?subject=Veterinario%20de%20Explotaci%C3%B3n'
  },
  {
    id: 'job-host-02',
    category: 'Hostelería',
    badge: { label: 'Temporada', tone: 'blue' },
    company: 'Complejo Rural Monte Claro',
    title: 'Responsable de Casa Rural',
    salary: '1.900€/mes',
    location: 'Cáceres, Extremadura',
    type: 'Fijo discontinuo',
    schedule: 'Turnos partidos',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&q=80',
    summary: 'Gestión operativa de alojamiento, check-in, coordinación de limpieza y reservas.',
    description: 'Buscamos una persona polivalente para liderar la operación diaria del complejo. Tendrás interlocución con huéspedes, proveedores locales y plataformas de reservas.',
    requirements: [
      'Experiencia en alojamiento turístico',
      'Buen nivel de atención al cliente',
      'Organización y autonomía'
    ],
    benefits: [
      'Alojamiento en el complejo durante temporada alta',
      'Incentivo por ocupación',
      'Formación en revenue y canales de reserva'
    ],
    contactUrl: 'mailto:gestion@monteclaro.es?subject=Responsable%20Casa%20Rural'
  },
  {
    id: 'job-tech-02',
    category: 'Tecnología',
    badge: { label: 'Infraestructura', tone: 'green' },
    company: 'RedComarca',
    title: 'Técnico/a de Fibra Óptica',
    salary: '2.050€/mes',
    location: 'Teruel, Aragón',
    type: 'Indefinido',
    schedule: 'Jornada continua',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=80',
    summary: 'Despliegue, mantenimiento y soporte a incidencias de conectividad en municipios pequeños.',
    description: 'Formarás parte del equipo que extiende y mantiene redes FTTH en varios municipios. El día a día combina instalaciones, revisiones preventivas y coordinación con contratistas.',
    requirements: [
      'Experiencia con cableado o telecomunicaciones',
      'Carné de conducir',
      'Disponibilidad para desplazamientos comarcales'
    ],
    benefits: [
      'Vehículo y herramientas',
      'Dietas por desplazamiento',
      'Plan de certificaciones'
    ],
    contactUrl: 'mailto:personas@redcomarca.es?subject=T%C3%A9cnico%20de%20Fibra%20-%20Arraigo'
  },
  {
    id: 'job-edu-02',
    category: 'Educación',
    badge: { label: 'Comunidad', tone: 'blue' },
    company: 'Asociación Horizonte Rural',
    title: 'Monitor/a Sociocultural',
    salary: '1.620€/mes',
    location: 'Huesca, Aragón',
    type: 'Temporal',
    schedule: 'Tardes',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80',
    summary: 'Diseño de talleres juveniles, apoyo escolar y dinamización cultural municipal.',
    description: 'El puesto se centra en activar programación semanal para infancia y juventud, coordinar talleres con entidades locales y apoyar actividades de refuerzo educativo.',
    requirements: [
      'Experiencia en dinamización sociocultural o educación no formal',
      'Capacidad para coordinar actividades',
      'Buen trato con familias y asociaciones'
    ],
    benefits: [
      'Calendario estable de actividades',
      'Apoyo del ayuntamiento',
      'Material y presupuesto de programa'
    ],
    contactUrl: 'mailto:equipo@horizonterural.org?subject=Monitor%20Sociocultural%20-%20Arraigo'
  },
  {
    id: 'job-agri-03',
    category: 'Agricultura',
    badge: { label: 'Bosque', tone: 'green' },
    company: 'Servicios Forestales Alto Tajo',
    title: 'Operario/a Forestal',
    salary: '1.780€/mes',
    location: 'Guadalajara, Castilla-La Mancha',
    type: 'Indefinido',
    schedule: 'Jornada intensiva',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80',
    summary: 'Trabajos de prevención, mantenimiento de monte y apoyo en brigadas locales.',
    description: 'La plaza combina tareas de prevención de incendios, mantenimiento forestal y pequeñas actuaciones de recuperación ambiental en varios municipios del entorno.',
    requirements: [
      'Buena condición física',
      'Valorable experiencia forestal o de obra civil',
      'Carné de conducir'
    ],
    benefits: [
      'Calendario anual previsible',
      'Formación en prevención y maquinaria',
      'Equipación completa'
    ],
    contactUrl: 'mailto:seleccion@altotajo.es?subject=Operario%20Forestal%20-%20Arraigo'
  },
  {
    id: 'job-host-03',
    category: 'Hostelería',
    badge: { label: 'Alojamiento', tone: 'red' },
    company: 'Albergue Camino Norte',
    title: 'Cocinero/a de Albergue',
    salary: '1.760€/mes',
    location: 'Lugo, Galicia',
    type: 'Indefinido',
    schedule: 'Turno partido',
    mode: 'Presencial',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=700&q=80',
    summary: 'Preparación de menús diarios y coordinación básica de compras para albergue comarcal.',
    description: 'Se necesita una persona organizada para cocina diaria, control de stock y adaptación de menús sencillos para grupos y viajeros. El equipo es pequeño y estable.',
    requirements: [
      'Experiencia en cocina colectiva o restaurante',
      'Gestión básica de compras y stock',
      'Flexibilidad en temporada alta'
    ],
    benefits: [
      'Alojamiento opcional cercano',
      'Un día y medio libre consecutivo',
      'Entorno estable durante todo el año'
    ],
    contactUrl: 'mailto:cocina@caminonorte.gal?subject=Cocinero%20de%20Albergue%20-%20Arraigo'
  }
];
