// ══════════════════════════════════
// i18n.js — Traducciones y persistencia de idioma
// ══════════════════════════════════

const LANGUAGE_KEY = 'arraigo_language';
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de', 'it', 'ary', 'zh', 'ar', 'ro'];
const RTL_LANGUAGES = new Set(['ary', 'ar']);

const INTL_LOCALES = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ary: 'ar-MA',
  zh: 'zh-CN',
  ar: 'ar-SA',
  ro: 'ro-RO'
};

const STATUS_VALUES = ['unemployed', 'seeking', 'employed', 'self_employed', 'student'];
const REGION_VALUES = [
  'andalucia',
  'aragon',
  'asturias',
  'canarias',
  'cantabria',
  'castilla_y_leon',
  'castilla_la_mancha',
  'cataluna',
  'comunidad_valenciana',
  'extremadura',
  'galicia',
  'madrid',
  'murcia',
  'navarra',
  'pais_vasco'
];

let currentLanguage = 'es';

const TRANSLATIONS = {
  es: {
    common: {
      start: 'Comenzar',
      continue: 'Continuar',
      cancel: 'Cancelar',
      save: 'Guardar',
      close: 'Cerrar',
      understood: 'Entendido',
      edit: 'Editar',
      home: 'Inicio',
      jobs: 'Empleo',
      towns: 'Pueblos',
      communities: 'Comunidades',
      saved: 'Guardados',
      admin: 'Panel admin',
      quickAccess: 'Accesos rápidos',
      news: 'Noticias',
      refresh: 'Actualizar',
      search: 'Buscar',
      noNotifications: 'Sin notificaciones nuevas',
      profileActive: 'Perfil activo',
      select: 'Selecciona'
    },
    splash: {
      titleHtml: 'Tu nueva vida<br/>en la España<br/><span style="color:#30D158;">rural</span>',
      copy: 'Encuentra trabajo, vivienda y comunidad en los municipios que más te necesitan.',
      loginExisting: 'Ya tengo cuenta'
    },
    login: {
      nav: 'Iniciar sesión',
      title: 'Bienvenido',
      copy: 'Accede a tu cuenta de Arraigo',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'ejemplo@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña',
      forgot: '¿Olvidaste tu contraseña?',
      adminHtml: 'Usuario admin de pruebas: <strong style="color:var(--label);">admin@arraigo.test</strong><br/>Contraseña: <strong style="color:var(--label);">ArraigoAdmin2026!</strong>',
      submit: 'Iniciar sesión',
      signupHtml: '¿No tienes cuenta? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-onboard\');return false;">Crear cuenta</a>'
    },
    onboard: {
      nav: 'Idioma',
      title: 'Elige tu idioma',
      copy: 'Selecciona el idioma con el que te sientas más cómodo.'
    },
    register: {
      nav: 'Crear cuenta',
      skip: 'Omitir',
      titleHtml: 'Cuéntanos<br/>sobre ti',
      copy: 'Crea tu perfil para empezar tu arraigo.',
      experiment: 'Aviso del proyecto',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Juan Pérez',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'ejemplo@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 8 caracteres',
      ageLabel: 'Edad',
      agePlaceholder: '25',
      townLabel: 'Municipio',
      townPlaceholder: 'Tu localidad',
      phoneLabel: 'Teléfono',
      phonePlaceholder: '600 000 000',
      statusLabel: 'Situación laboral',
      countryLabel: 'País de origen',
      countryPlaceholder: 'Colombia, Marruecos...',
      regionLabel: 'Comunidad autónoma de interés',
      trackingTitle: 'Compartir ubicación para análisis',
      trackingHtml: 'Puedes decidir si quieres activar el seguimiento al crear tu cuenta. <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openTrackingInfoNotice();return false;">Más información</a>',
      termsTitle: 'Términos y privacidad',
      termsHtml: 'Acepto los términos de Arraigo · <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openPrivacy();return false;">Leer política</a>',
      submit: 'Crear mi cuenta',
      loginHtml: '¿Ya tienes cuenta? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-login\');return false;">Iniciar sesión</a>'
    },
    home: {
      jobsCopy: 'Explorar ofertas',
      townsCopy: 'Mapa municipal',
      sepeCopy: 'Web oficial',
      savedTitle: 'Guardados',
      savedDefault: 'Tus favoritos'
    },
    profile: {
      guest: 'Invitado',
      guestStatus: 'Explora empleo rural',
      defaultStatus: 'Buscando empleo rural',
      adminStatus: 'Visualización y control',
      updated: 'Perfil actualizado',
      photoUpdated: 'Foto actualizada',
      privacyAccepted: 'Política de privacidad aceptada'
    },
    editProfile: {
      nav: 'Editar perfil',
      changePhoto: 'Cambiar foto',
      personalInfo: 'INFORMACIÓN PERSONAL',
      additionalInfo: 'MÁS INFORMACIÓN',
      additionalInfoPendingTitle: 'Completa más información',
      additionalInfoPendingCopy: 'Rellena estas {total} preguntas para completar tu perfil. Si alguna no aplica, escribe “No aplica”. Llevas {filled}/{total}.',
      additionalInfoReadyTitle: 'Información complementaria completada',
      additionalInfoReadyCopy: 'Este bloque adicional ya está completo y guardado en tu perfil.',
      territorialOriginLabel: 'Lugar de origen',
      territorialOriginPlaceholder: 'Ej.: entorno urbano, semiurbano, rural o gran centro metropolitano',
      previousProfessionalActivityLabel: 'Trabajo anterior',
      previousProfessionalActivityPlaceholder: 'Resume tu actividad profesional anterior',
      spatialProfessionalTrajectoryLabel: 'Dónde has vivido y trabajado',
      spatialProfessionalTrajectoryPlaceholder: 'Si aplica, describe los lugares donde has vivido o trabajado y cómo ha evolucionado tu trayectoria',
      educationCentersLabel: 'Centros de estudio',
      educationCentersPlaceholder: 'Indica pertenencia, tipología y, si procede, ideario',
      familyTrajectoryLabel: 'Historia familiar',
      familyTrajectoryPlaceholder: 'Hasta dos generaciones precedentes: natalidad, fecundidad, mortalidad, nupcialidad, uniones civiles y divorcios',
      tracking: 'UBICACIÓN',
      trackingTitle: 'Compartir ubicación para análisis',
      trackingEmpty: 'Ubicación aún no registrada',
      logout: 'Cerrar sesión',
      currentTownLabel: 'Municipio actual'
    },
    sepe: {
      serviceSubtitle: 'Servicio Público de Empleo Estatal',
      copy: 'Accede a la sede electrónica del SEPE para gestionar tu desempleo, prestaciones y búsqueda de empleo oficial.',
      noteHtml: '<strong>⚠ Nota:</strong> La web del SEPE no permite incrustarse en otras apps por seguridad. Pulsa cualquier acceso directo para abrir en tu navegador.',
      open: 'Abrir sede electrónica',
      shortcuts: 'ACCESOS DIRECTOS',
      benefit: 'Solicitar prestación',
      benefitCopy: 'Paro e INEM',
      offers: 'Ofertas de empleo',
      offersCopy: 'Búsqueda activa',
      training: 'Formación y cursos',
      trainingCopy: 'Plan de formación',
      dossier: 'Mi expediente',
      dossierCopy: 'Historial laboral',
      appointment: 'Cita previa',
      appointmentCopy: 'Pedir cita en oficina'
    },
    jobs: {
      title: 'Empleo',
      searchPlaceholder: 'Buscar trabajo, empresa o provincia...',
      preparing: 'Preparando ofertas...',
      filters: {
        all: 'Todos',
        agriculture: 'Agricultura',
        hospitality: 'Hostelería',
        technology: 'Tecnología',
        healthcare: 'Sanidad',
        education: 'Educación'
      },
      visibleOne: '1 oferta visible',
      visibleOther: '{count} ofertas visibles',
      emptyTitle: 'No hay resultados',
      emptyCopy: 'Prueba con otra búsqueda o cambia el filtro de categoría.',
      clear: 'Limpiar filtros',
      details: 'Ver detalles',
      salary: 'Salario',
      contract: 'Contrato',
      mode: 'Modalidad',
      summary: 'Resumen',
      requirements: 'Requisitos',
      benefits: 'Qué ofrece',
      save: 'Guardar empleo',
      unsave: 'Quitar de guardados',
      contact: 'Contactar',
      delete: 'Eliminar oferta',
      deleted: 'Oferta eliminada',
      deleteForbidden: 'Solo el perfil admin puede eliminar ofertas.',
      adminCreateLabel: 'PUBLICAR OFERTA',
      adminTitle: 'Nueva oferta de empleo',
      adminCopy: 'Solo el usuario administrador puede publicar ofertas. Esta oferta entrará en el listado general y en las notificaciones.',
      imageButton: 'Añadir imagen',
      imageHelp: 'Sube una imagen real de la oferta o del lugar de trabajo.',
      companyLabel: 'Empresa',
      titleLabel: 'Título',
      locationLabel: 'Ubicación',
      salaryLabel: 'Salario',
      categoryLabel: 'Categoría',
      badgeLabel: 'Etiqueta',
      badgeToneLabel: 'Color de la etiqueta',
      typeLabel: 'Contrato',
      scheduleLabel: 'Jornada',
      modeLabel: 'Modalidad',
      summaryLabel: 'Resumen',
      descriptionLabel: 'Descripción completa',
      requirementsLabel: 'Requisitos',
      benefitsLabel: 'Beneficios',
      contactLabel: 'Contacto',
      companyPlaceholder: 'Ej.: Cooperativa Sierra Norte',
      titlePlaceholder: 'Ej.: Técnico/a agrícola',
      locationPlaceholder: 'Ej.: Soria, Castilla y León',
      salaryPlaceholder: 'Ej.: 1.900€/mes',
      summaryPlaceholder: 'Descripción corta para la tarjeta de la oferta',
      descriptionPlaceholder: 'Explica el puesto, el contexto y las tareas principales',
      requirementsPlaceholder: 'Escribe un requisito por línea',
      benefitsPlaceholder: 'Escribe un beneficio por línea',
      contactPlaceholder: 'mailto:empleo@empresa.es o https://empresa.es/oferta',
      saveAdmin: 'Publicar oferta',
      created: 'Oferta publicada',
      adminOnlyComposer: 'Solo el perfil admin puede publicar ofertas.',
      adminRequiredFields: 'Completa todos los campos de la oferta y añade al menos un requisito y un beneficio.',
      categoryMap: {
        Todos: 'Todos',
        Agricultura: 'Agricultura',
        Hostelería: 'Hostelería',
        Tecnología: 'Tecnología',
        Sanidad: 'Sanidad',
        Educación: 'Educación'
      },
      contractMap: {
        Indefinido: 'Indefinido',
        Temporal: 'Temporal',
        'Sustitución larga': 'Sustitución larga',
        'Fijo discontinuo': 'Fijo discontinuo'
      },
      modeMap: {
        Presencial: 'Presencial',
        Híbrido: 'Híbrido'
      },
      scheduleMap: {
        'Jornada completa': 'Jornada completa',
        'Fines de semana': 'Fines de semana',
        'Turno rotativo': 'Turno rotativo',
        Mañanas: 'Mañanas',
        'Turnos partidos': 'Turnos partidos',
        'Jornada continua': 'Jornada continua',
        Tardes: 'Tardes',
        'Jornada intensiva': 'Jornada intensiva',
        'Turno partido': 'Turno partido'
      },
      badgeMap: {
        Nuevo: 'Nuevo',
        Urgente: 'Urgente',
        Destacado: 'Destacado',
        Híbrido: 'Híbrido',
        'Aula Rural': 'Aula Rural',
        Campo: 'Campo',
        Temporada: 'Temporada',
        Infraestructura: 'Infraestructura',
        Comunidad: 'Comunidad',
        Bosque: 'Bosque',
        Alojamiento: 'Alojamiento'
      }
    },
    towns: {
      title: 'Pueblos',
      searchPlaceholder: 'Buscar por nombre, provincia o comunidad...',
      preparing: 'Preparando mapa municipal de menos de 10.000 habitantes...',
      loading: 'Cargando municipios de España con población oficial...',
      filters: {
        all: 'Todos',
        under1k: 'Menos de 1.000',
        between1k5k: '1.000-5.000',
        between5k10k: '5.000-10.000'
      },
      inhabitants: 'habitantes',
      profile: 'perfil',
      ineCode: 'código ine',
      distance: 'distancia',
      previewNote: 'Población oficial INE {year} y localización del municipio.',
      moreDetails: 'Ver más detalles',
      save: 'Guardar municipio',
      unsave: 'Quitar de guardados',
      showMap: 'Ver en mapa',
      quickSummary: 'Resumen rápido',
      municipalFile: 'Ficha del municipio',
      province: 'Provincia',
      region: 'Comunidad',
      code: 'Código INE',
      coords: 'Coordenadas',
      officialWebsite: 'Web oficial',
      openOfficialWebsite: 'Abrir ayuntamiento',
      websiteMissing: 'Web oficial no disponible todavía',
      dataUsed: 'Datos utilizados',
      dataCopy: 'La población procede del padrón municipal del INE ({year}) y la ubicación del municipio se apoya en el dataset geográfico cargado en la app para pintar el mapa.',
      visibleFilterAll: '< 10.000 hab.',
      locationActive: 'ubicación activa',
      visibleOne: '1 municipio visible',
      visibleOther: '{count} municipios visibles',
      profiles: {
        micro: 'Micro pueblo',
        small: 'Pueblo pequeño',
        medium: 'Pueblo mediano'
      }
    },
    saved: {
      title: 'Guardados',
      emptyJobsTitle: 'Sin empleos guardados',
      emptyJobsCopy: 'Guarda ofertas desde la pantalla de empleo para verlas aquí.',
      exploreJobs: 'Explorar empleos',
      emptyTownsTitle: 'Sin pueblos guardados',
      emptyTownsCopy: 'Explora el mapa municipal y guarda los pueblos que quieras revisar más tarde.',
      exploreTowns: 'Explorar pueblos',
      remove: 'Quitar'
    },
    communities: {
      title: 'Comunidades',
      heroTitle: 'Comunidades y asociaciones',
      heroCopy: 'Crea grupos abiertos para compartir apoyo, información local y acceso a chats de WhatsApp o Telegram.',
      createLabel: 'CREAR COMUNIDAD',
      imageButton: 'Añadir imagen',
      imageHelp: 'Sube una imagen de portada para que la comunidad sea más fácil de identificar.',
      titleLabel: 'Título',
      titlePlaceholder: 'Ej.: Comunidad de marroquíes en Madrid',
      descriptionLabel: 'Descripción',
      descriptionPlaceholder: 'Cuenta qué ofrece la comunidad, cómo ayuda y qué tipo de personas pueden entrar',
      linkLabel: 'Link del chat',
      linkPlaceholder: 'https://chat.whatsapp.com/... o https://t.me/...',
      save: 'Publicar comunidad',
      listTitle: 'Comunidades activas',
      emptyTitle: 'Aún no hay comunidades',
      emptyCopy: 'Crea la primera comunidad o asociación y quedará visible para los usuarios que usen esta app en este navegador.',
      openChat: 'Abrir chat',
      delete: 'Eliminar',
      createdBy: 'Creada por {name} · {date}',
      required: 'Completa al menos el título, la descripción y el link del chat.',
      created: 'Comunidad publicada',
      deleted: 'Comunidad eliminada',
      deleteForbidden: 'Solo puedes eliminar las comunidades que has creado tú.',
      saveFailed: 'No se ha podido guardar la comunidad. Prueba con una imagen más ligera.',
      linkMissing: 'Esta comunidad no tiene un enlace válido.',
      loginRequired: 'Inicia sesión para crear una comunidad.',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      chat: 'Chat'
    },
    admin: {
      title: 'Panel admin',
      viewTitle: 'Visualización de ubicaciones',
      viewCopy: 'Dataset local de seguimiento para testing. En la web sólo se registra mientras el navegador puede ejecutar la aplicación.',
      usersWithSignal: 'Usuarios con señal',
      records: 'Registros',
      viewAll: 'Ver todos',
      downloadExcel: 'Descargar Excel',
      selectedRouteTitle: 'Ruta seleccionada',
      selectedRouteEmpty: 'Selecciona un usuario para ver en el mapa la unión de sus puntos de seguimiento y su historial.',
      allUsersView: 'Vista global con los últimos puntos registrados por cada usuario.',
      routeForUser: 'Ruta de {name} · {count} puntos · último tracking {date}',
      points: '{count} puntos',
      emptySummary: 'Sin ubicaciones de usuarios registradas todavía.',
      emptyTitle: 'Sin dataset todavía',
      emptyCopy: 'Los registros aparecerán aquí cuando usuarios no administradores acepten compartir ubicación.',
      lastUpdate: 'Última actualización {relative} · dataset local para testing',
      townMissing: 'Municipio no indicado',
      regionMissing: 'Región no indicada',
      latlon: 'Lat / Lon',
      accuracy: 'Precisión',
      firstRecord: 'Primer registro',
      lastRecord: 'Último registro',
      samples: 'Muestras',
      source: 'Origen',
      history: 'Historial',
      historyEmpty: 'Sin historial adicional',
      viewOnMap: 'Ver en mapa',
      excelReady: 'Archivo preparado para Excel',
      excelEmpty: 'No hay datos de tracking para exportar',
      excelError: 'No se ha podido preparar el Excel',
      noDate: 'sin fecha',
      adminOnly: 'Solo el perfil admin puede acceder a esta vista',
      sources: {
        sessionStart: 'Inicio de sesión',
        appOpen: 'Apertura de la app',
        appFocus: 'Vuelta a la app',
        appVisible: 'Pantalla visible',
        foregroundWatch: 'Seguimiento activo',
        nightly: 'Registro nocturno',
        manual: 'Manual',
        unknown: 'Origen desconocido'
      }
    },
    experiment: {
      title: 'Aviso importante',
      copy: 'Registrándote estás entrando en el proyecto Arraigo, financiado por la Comunidad de Madrid. Algunos de los datos serán usados para el estudio.',
      button: 'Entendido'
    },
    trackingInfo: {
      title: 'Más información sobre la ubicación',
      copy: 'La información de ubicación será utilizada para un muestreo y para la realización de un artículo científico sobre la inmigración en la Comunidad de Madrid.',
      button: 'Entendido'
    },
    privacy: {
      title: 'Política de privacidad',
      button: 'Entendido y acepto'
    },
    status: {
      unemployed: 'Desempleado/a',
      seeking: 'Buscando empleo',
      employed: 'Trabajando',
      self_employed: 'Autónomo/a',
      student: 'Estudiante'
    },
    regions: {
      andalucia: 'Andalucía',
      aragon: 'Aragón',
      asturias: 'Asturias',
      canarias: 'Canarias',
      cantabria: 'Cantabria',
      castilla_y_leon: 'Castilla y León',
      castilla_la_mancha: 'Castilla-La Mancha',
      cataluna: 'Cataluña',
      comunidad_valenciana: 'Comunidad Valenciana',
      extremadura: 'Extremadura',
      galicia: 'Galicia',
      madrid: 'Madrid',
      murcia: 'Murcia',
      navarra: 'Navarra',
      pais_vasco: 'País Vasco'
    },
    role: {
      active: 'Sesión activa',
      admin: 'Admin'
    },
    tracking: {
      pending: 'Ubicación pendiente',
      none: 'Ubicación aún no registrada',
      latest: 'Última ubicación {date}',
      enabled: 'Seguimiento de ubicación activado',
      disabled: 'Seguimiento de ubicación desactivado',
      allow: 'Permite la ubicación para activar el seguimiento',
      failed: 'No se ha podido activar el seguimiento de ubicación'
    },
    auth: {
      required: 'Por favor rellena nombre, email y contraseña.',
      passwordLength: 'La contraseña debe tener al menos 8 caracteres.',
      emailExists: 'Este correo ya está registrado. Inicia sesión.',
      termsRequired: 'Debes aceptar términos y privacidad para continuar.',
      accountCreated: 'Cuenta creada con sesión persistente',
      loginRequired: 'Introduce tu correo y contraseña.',
      invalid: 'Usuario o contraseña incorrectos.',
      welcome: 'Bienvenido/a de nuevo, {name}',
      adminWelcome: 'Acceso administrativo activo, {name}',
      sessionClosed: 'Sesión cerrada',
      recovery: 'Enviando enlace de recuperación...'
    },
    notifications: {
      title: 'Notificaciones',
      empty: 'Sin notificaciones por ahora.',
      opened: 'Notificación abierta',
      welcomeTitle: 'Centro de notificaciones activado',
      welcomeBody: 'Aquí verás avisos cuando entren nuevos puestos de trabajo o se publiquen nuevas comunidades.',
      newJobTitle: 'Nuevo puesto de trabajo',
      newJobBody: '{title} · {location}',
      newCommunityTitle: 'Nueva comunidad publicada',
      newCommunityBody: '{title} ya está disponible en la pestaña Comunidades.',
      typeJob: 'Empleo',
      typeCommunity: 'Comunidad',
      typeSystem: 'Sistema'
    },
    homeNews: {
      loading: 'Cargando noticias de empleabilidad rural, pueblos y ayudas...',
      updating: 'Actualizando noticias de empleabilidad rural y pueblos...',
      updated: 'Noticias actualizadas {relative} sobre empleo rural, pueblos y ayudas.',
      emptyTitle: 'Sin noticias disponibles',
      emptyCopy: 'No se han podido cargar titulares sobre empleo rural y pueblos en este momento.',
      retry: 'Reintentar',
      cachedError: 'No se ha podido actualizar ahora mismo. Se muestran las últimas noticias guardadas.',
      failed: 'No se han podido cargar noticias reales en este momento.',
      featuredBadge: 'Empleo y pueblos'
    }
  },
  en: {
    common: {
      start: 'Get started',
      continue: 'Continue',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      understood: 'Got it',
      edit: 'Edit',
      home: 'Home',
      jobs: 'Jobs',
      towns: 'Towns',
      saved: 'Saved',
      admin: 'Admin panel',
      quickAccess: 'Quick access',
      news: 'News',
      refresh: 'Refresh',
      search: 'Search',
      noNotifications: 'No new notifications',
      profileActive: 'Active profile',
      select: 'Select'
    },
    splash: {
      titleHtml: 'Your new life<br/>in rural<br/><span style="color:#30D158;">Spain</span>',
      copy: 'Find work, housing and community in the towns that need you most.',
      loginExisting: 'I already have an account'
    },
    login: {
      nav: 'Sign in',
      title: 'Welcome',
      copy: 'Access your Arraigo account',
      emailLabel: 'Email',
      emailPlaceholder: 'example@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Your password',
      forgot: 'Forgot your password?',
      adminHtml: 'Admin test user: <strong style="color:var(--label);">admin@arraigo.test</strong><br/>Password: <strong style="color:var(--label);">ArraigoAdmin2026!</strong>',
      submit: 'Sign in',
      signupHtml: 'Don’t have an account? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-onboard\');return false;">Create one</a>'
    },
    onboard: {
      nav: 'Language',
      title: 'Choose your language',
      copy: 'Select the language you feel most comfortable with.'
    },
    register: {
      nav: 'Create account',
      skip: 'Skip',
      titleHtml: 'Tell us<br/>about you',
      copy: 'Create your profile to begin your settlement journey.',
      experiment: 'Project notice',
      nameLabel: 'Full name',
      namePlaceholder: 'John Doe',
      emailLabel: 'Email',
      emailPlaceholder: 'example@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      ageLabel: 'Age',
      agePlaceholder: '25',
      townLabel: 'Town',
      townPlaceholder: 'Your town',
      phoneLabel: 'Phone',
      phonePlaceholder: '600 000 000',
      statusLabel: 'Employment status',
      countryLabel: 'Country of origin',
      countryPlaceholder: 'Colombia, Morocco...',
      regionLabel: 'Preferred autonomous community',
      termsTitle: 'Terms and privacy',
      termsHtml: 'I accept Arraigo terms · <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openPrivacy();return false;">Read policy</a>',
      submit: 'Create my account',
      loginHtml: 'Already have an account? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-login\');return false;">Sign in</a>'
    },
    home: {
      jobsCopy: 'Browse openings',
      townsCopy: 'Municipal map',
      sepeCopy: 'Official website',
      savedTitle: 'Saved',
      savedDefault: 'Your favorites'
    },
    profile: {
      guest: 'Guest',
      guestStatus: 'Explore rural jobs',
      defaultStatus: 'Looking for rural work',
      adminStatus: 'Monitoring and control',
      updated: 'Profile updated',
      photoUpdated: 'Photo updated',
      privacyAccepted: 'Privacy policy accepted'
    },
    editProfile: {
      nav: 'Edit profile',
      changePhoto: 'Change photo',
      personalInfo: 'PERSONAL INFORMATION',
      tracking: 'TRACKING',
      trackingTitle: 'Share location for analysis',
      trackingEmpty: 'Location not recorded yet',
      logout: 'Sign out',
      currentTownLabel: 'Current town'
    },
    sepe: {
      serviceSubtitle: 'Spanish Public Employment Service',
      copy: 'Access the SEPE e-office to manage unemployment, benefits and official job search.',
      noteHtml: '<strong>⚠ Note:</strong> The SEPE website cannot be embedded inside other apps for security reasons. Tap any shortcut to open it in your browser.',
      open: 'Open e-office',
      shortcuts: 'SHORTCUTS',
      benefit: 'Request benefit',
      benefitCopy: 'Unemployment support',
      offers: 'Job offers',
      offersCopy: 'Active job search',
      training: 'Training and courses',
      trainingCopy: 'Training plan',
      dossier: 'My record',
      dossierCopy: 'Work history',
      appointment: 'Appointment',
      appointmentCopy: 'Book office appointment'
    },
    jobs: {
      title: 'Jobs',
      searchPlaceholder: 'Search job, company or province...',
      preparing: 'Preparing job listings...',
      filters: {
        all: 'All',
        agriculture: 'Agriculture',
        hospitality: 'Hospitality',
        technology: 'Technology',
        healthcare: 'Healthcare',
        education: 'Education'
      },
      visibleOne: '1 visible opening',
      visibleOther: '{count} visible openings',
      emptyTitle: 'No results',
      emptyCopy: 'Try another search or switch the category filter.',
      clear: 'Clear filters',
      details: 'View details',
      salary: 'Salary',
      contract: 'Contract',
      mode: 'Mode',
      summary: 'Summary',
      requirements: 'Requirements',
      benefits: 'What it offers',
      save: 'Save job',
      unsave: 'Remove from saved',
      contact: 'Contact',
      delete: 'Delete job',
      deleted: 'Job removed',
      deleteForbidden: 'Only the admin profile can remove job offers.',
      adminCreateLabel: 'POST JOB',
      adminTitle: 'New job listing',
      adminCopy: 'Only the admin user can publish openings. This listing will appear in the main feed and notifications.',
      imageButton: 'Add image',
      imageHelp: 'Upload a real image of the role or workplace.',
      companyLabel: 'Company',
      titleLabel: 'Title',
      locationLabel: 'Location',
      salaryLabel: 'Salary',
      categoryLabel: 'Category',
      badgeLabel: 'Badge',
      badgeToneLabel: 'Badge color',
      typeLabel: 'Contract',
      scheduleLabel: 'Schedule',
      modeLabel: 'Mode',
      summaryLabel: 'Summary',
      descriptionLabel: 'Full description',
      requirementsLabel: 'Requirements',
      benefitsLabel: 'Benefits',
      contactLabel: 'Contact',
      companyPlaceholder: 'Ex.: Sierra Norte Cooperative',
      titlePlaceholder: 'Ex.: Agricultural technician',
      locationPlaceholder: 'Ex.: Soria, Castile and León',
      salaryPlaceholder: 'Ex.: €1,900/month',
      summaryPlaceholder: 'Short copy for the job card',
      descriptionPlaceholder: 'Explain the role, context and main responsibilities',
      requirementsPlaceholder: 'Write one requirement per line',
      benefitsPlaceholder: 'Write one benefit per line',
      contactPlaceholder: 'mailto:hiring@company.com or https://company.com/job',
      saveAdmin: 'Publish job',
      created: 'Job published',
      adminOnlyComposer: 'Only the admin profile can publish jobs.',
      adminRequiredFields: 'Complete every job field and add at least one requirement and one benefit.',
      categoryMap: {
        Todos: 'All',
        Agricultura: 'Agriculture',
        Hostelería: 'Hospitality',
        Tecnología: 'Technology',
        Sanidad: 'Healthcare',
        Educación: 'Education'
      },
      contractMap: {
        Indefinido: 'Permanent',
        Temporal: 'Temporary',
        'Sustitución larga': 'Long replacement',
        'Fijo discontinuo': 'Seasonal permanent'
      },
      modeMap: {
        Presencial: 'On site',
        Híbrido: 'Hybrid'
      },
      scheduleMap: {
        'Jornada completa': 'Full time',
        'Fines de semana': 'Weekends',
        'Turno rotativo': 'Rotating shifts',
        Mañanas: 'Mornings',
        'Turnos partidos': 'Split shifts',
        'Jornada continua': 'Continuous shift',
        Tardes: 'Afternoons',
        'Jornada intensiva': 'Compressed schedule',
        'Turno partido': 'Split shift'
      },
      badgeMap: {
        Nuevo: 'New',
        Urgente: 'Urgent',
        Destacado: 'Featured',
        Híbrido: 'Hybrid',
        'Aula Rural': 'Rural classroom',
        Campo: 'Field',
        Temporada: 'Season',
        Infraestructura: 'Infrastructure',
        Comunidad: 'Community',
        Bosque: 'Forest',
        Alojamiento: 'Housing'
      }
    },
    towns: {
      title: 'Towns',
      searchPlaceholder: 'Search by name, province or region...',
      preparing: 'Preparing municipal map under 10,000 inhabitants...',
      loading: 'Loading Spanish municipalities with official population...',
      filters: {
        all: 'All',
        under1k: 'Under 1,000',
        between1k5k: '1,000-5,000',
        between5k10k: '5,000-10,000'
      },
      inhabitants: 'inhabitants',
      profile: 'profile',
      ineCode: 'INE code',
      distance: 'distance',
      previewNote: 'Official INE {year} population and municipality location.',
      moreDetails: 'View more details',
      save: 'Save town',
      unsave: 'Remove from saved',
      showMap: 'View on map',
      quickSummary: 'Quick summary',
      municipalFile: 'Municipality file',
      province: 'Province',
      region: 'Region',
      code: 'INE code',
      coords: 'Coordinates',
      officialWebsite: 'Official website',
      openOfficialWebsite: 'Open town hall',
      websiteMissing: 'Official website not available yet',
      dataUsed: 'Data used',
      dataCopy: 'Population comes from the INE municipal register ({year}) and location uses the geographic dataset loaded in the app to draw the map.',
      visibleFilterAll: '< 10k inh.',
      locationActive: 'location active',
      visibleOne: '1 visible municipality',
      visibleOther: '{count} visible municipalities',
      profiles: {
        micro: 'Tiny village',
        small: 'Small town',
        medium: 'Mid-size town'
      }
    },
    saved: {
      title: 'Saved',
      emptyJobsTitle: 'No saved jobs',
      emptyJobsCopy: 'Save openings from the jobs screen to see them here.',
      exploreJobs: 'Browse jobs',
      emptyTownsTitle: 'No saved towns',
      emptyTownsCopy: 'Explore the municipal map and save towns to review later.',
      exploreTowns: 'Browse towns',
      remove: 'Remove'
    },
    admin: {
      title: 'Admin panel',
      viewTitle: 'Location overview',
      viewCopy: 'Local tracking dataset for testing. On the web, data is only recorded while the browser can keep the app running.',
      usersWithSignal: 'Users with signal',
      records: 'Records',
      emptySummary: 'No user locations recorded yet.',
      emptyTitle: 'No dataset yet',
      emptyCopy: 'Records will appear here when non-admin users agree to share location.',
      lastUpdate: 'Last update {relative} · local testing dataset',
      townMissing: 'Town not provided',
      regionMissing: 'Region not provided',
      latlon: 'Lat / Lon',
      accuracy: 'Accuracy',
      lastRecord: 'Last record',
      samples: 'Samples',
      viewOnMap: 'View on map',
      noDate: 'no date',
      adminOnly: 'Only the admin profile can access this view'
    },
    experiment: {
      title: 'Important notice',
      copy: 'By registering you are joining the Arraigo project, funded by the Community of Madrid. Some data will be used for the study.',
      button: 'Understood'
    },
    privacy: {
      title: 'Privacy policy',
      button: 'Understood and accepted'
    },
    status: {
      unemployed: 'Unemployed',
      seeking: 'Looking for work',
      employed: 'Working',
      self_employed: 'Self-employed',
      student: 'Student'
    },
    regions: {
      andalucia: 'Andalusia',
      aragon: 'Aragon',
      asturias: 'Asturias',
      canarias: 'Canary Islands',
      cantabria: 'Cantabria',
      castilla_y_leon: 'Castile and León',
      castilla_la_mancha: 'Castile-La Mancha',
      cataluna: 'Catalonia',
      comunidad_valenciana: 'Valencian Community',
      extremadura: 'Extremadura',
      galicia: 'Galicia',
      madrid: 'Madrid',
      murcia: 'Murcia',
      navarra: 'Navarre',
      pais_vasco: 'Basque Country'
    },
    role: {
      active: 'Active session',
      admin: 'Admin'
    },
    tracking: {
      pending: 'Location pending',
      none: 'Location not recorded yet',
      latest: 'Last location {date}',
      enabled: 'Location tracking enabled',
      disabled: 'Location tracking disabled',
      allow: 'Allow location access to enable tracking',
      failed: 'Location tracking could not be enabled'
    },
    auth: {
      required: 'Please fill in name, email and password.',
      passwordLength: 'Password must be at least 8 characters long.',
      emailExists: 'This email is already registered. Sign in instead.',
      termsRequired: 'You must accept terms and privacy to continue.',
      accountCreated: 'Account created with persistent session',
      loginRequired: 'Enter your email and password.',
      invalid: 'Incorrect username or password.',
      welcome: 'Welcome back, {name}',
      adminWelcome: 'Admin access enabled, {name}',
      sessionClosed: 'Session closed',
      recovery: 'Sending recovery link...'
    },
    homeNews: {
      loading: 'Loading news about rural employability, towns and aid...',
      updating: 'Updating rural employment and towns news...',
      updated: 'News updated {relative} about rural jobs, towns and aid.',
      emptyTitle: 'No news available',
      emptyCopy: 'Rural employment and towns headlines could not be loaded right now.',
      retry: 'Retry',
      cachedError: 'Could not update right now. Showing the latest stored headlines.',
      failed: 'Real news could not be loaded at the moment.',
      featuredBadge: 'Jobs and towns'
    }
  },
  fr: {
    common: {
      start: 'Commencer',
      continue: 'Continuer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      close: 'Fermer',
      understood: 'Compris',
      edit: 'Modifier',
      home: 'Accueil',
      jobs: 'Emploi',
      towns: 'Villages',
      saved: 'Enregistrés',
      admin: 'Admin',
      quickAccess: 'Accès rapides',
      news: 'Actualités',
      refresh: 'Actualiser',
      search: 'Rechercher',
      noNotifications: 'Aucune nouvelle notification',
      profileActive: 'Profil actif',
      select: 'Sélectionner'
    },
    splash: {
      titleHtml: 'Votre nouvelle vie<br/>dans l’Espagne<br/><span style="color:#30D158;">rurale</span>',
      copy: 'Trouvez travail, logement et communauté dans les communes qui ont le plus besoin de vous.',
      loginExisting: 'J’ai déjà un compte'
    },
    login: {
      nav: 'Se connecter',
      title: 'Bienvenue',
      copy: 'Accédez à votre compte Arraigo',
      emailLabel: 'E-mail',
      emailPlaceholder: 'exemple@email.com',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Votre mot de passe',
      forgot: 'Mot de passe oublié ?',
      adminHtml: 'Utilisateur admin de test : <strong style="color:var(--label);">admin@arraigo.test</strong><br/>Mot de passe : <strong style="color:var(--label);">ArraigoAdmin2026!</strong>',
      submit: 'Se connecter',
      signupHtml: 'Vous n’avez pas de compte ? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-onboard\');return false;">Créer un compte</a>'
    },
    onboard: {
      nav: 'Langue',
      title: 'Choisissez votre langue',
      copy: 'Sélectionnez la langue dans laquelle vous êtes le plus à l’aise.'
    },
    register: {
      nav: 'Créer un compte',
      skip: 'Passer',
      titleHtml: 'Parlez-nous<br/>de vous',
      copy: 'Créez votre profil pour commencer votre parcours d’installation.',
      experiment: 'Avis du projet',
      nameLabel: 'Nom complet',
      namePlaceholder: 'Jean Dupont',
      emailLabel: 'E-mail',
      emailPlaceholder: 'exemple@email.com',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Au moins 8 caractères',
      ageLabel: 'Âge',
      agePlaceholder: '25',
      townLabel: 'Commune',
      townPlaceholder: 'Votre commune',
      phoneLabel: 'Téléphone',
      phonePlaceholder: '600 000 000',
      statusLabel: 'Situation professionnelle',
      countryLabel: 'Pays d’origine',
      countryPlaceholder: 'Colombie, Maroc...',
      regionLabel: 'Communauté autonome souhaitée',
      termsTitle: 'Conditions et confidentialité',
      termsHtml: 'J’accepte les conditions d’Arraigo · <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openPrivacy();return false;">Lire la politique</a>',
      submit: 'Créer mon compte',
      loginHtml: 'Vous avez déjà un compte ? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-login\');return false;">Se connecter</a>'
    },
    home: {
      jobsCopy: 'Voir les offres',
      townsCopy: 'Carte municipale',
      sepeCopy: 'Site officiel',
      savedTitle: 'Enregistrés',
      savedDefault: 'Vos favoris'
    },
    profile: {
      guest: 'Invité',
      guestStatus: 'Explorez l’emploi rural',
      defaultStatus: 'Recherche d’emploi rural',
      adminStatus: 'Visualisation et contrôle',
      updated: 'Profil mis à jour',
      photoUpdated: 'Photo mise à jour',
      privacyAccepted: 'Politique de confidentialité acceptée'
    },
    editProfile: {
      nav: 'Modifier le profil',
      changePhoto: 'Changer la photo',
      personalInfo: 'INFORMATIONS PERSONNELLES',
      tracking: 'SUIVI',
      trackingTitle: 'Partager la position pour l’analyse',
      trackingEmpty: 'Position non enregistrée',
      logout: 'Se déconnecter',
      currentTownLabel: 'Commune actuelle'
    },
    sepe: {
      serviceSubtitle: 'Service public de l’emploi espagnol',
      copy: 'Accédez au portail SEPE pour gérer chômage, aides et recherche d’emploi officielle.',
      noteHtml: '<strong>⚠ Remarque :</strong> le site du SEPE ne peut pas être intégré dans d’autres applications pour des raisons de sécurité. Ouvrez-le dans votre navigateur.',
      open: 'Ouvrir le portail',
      shortcuts: 'RACCOURCIS',
      benefit: 'Demander une allocation',
      benefitCopy: 'Chômage et aides',
      offers: 'Offres d’emploi',
      offersCopy: 'Recherche active',
      training: 'Formation et cours',
      trainingCopy: 'Plan de formation',
      dossier: 'Mon dossier',
      dossierCopy: 'Historique professionnel',
      appointment: 'Rendez-vous',
      appointmentCopy: 'Prendre rendez-vous'
    },
    jobs: {
      title: 'Emploi',
      searchPlaceholder: 'Rechercher un emploi, une entreprise ou une province...',
      preparing: 'Préparation des offres...',
      filters: {
        all: 'Tous',
        agriculture: 'Agriculture',
        hospitality: 'Hôtellerie',
        technology: 'Technologie',
        healthcare: 'Santé',
        education: 'Éducation'
      },
      visibleOne: '1 offre visible',
      visibleOther: '{count} offres visibles',
      emptyTitle: 'Aucun résultat',
      emptyCopy: 'Essayez une autre recherche ou changez de filtre.',
      clear: 'Effacer les filtres',
      details: 'Voir les détails',
      salary: 'Salaire',
      contract: 'Contrat',
      mode: 'Modalité',
      summary: 'Résumé',
      requirements: 'Exigences',
      benefits: 'Ce qui est proposé',
      save: 'Enregistrer l’emploi',
      unsave: 'Retirer des enregistrés',
      contact: 'Contacter',
      categoryMap: {
        Todos: 'Tous',
        Agricultura: 'Agriculture',
        Hostelería: 'Hôtellerie',
        Tecnología: 'Technologie',
        Sanidad: 'Santé',
        Educación: 'Éducation'
      },
      contractMap: {
        Indefinido: 'Permanent',
        Temporal: 'Temporaire',
        'Sustitución larga': 'Remplacement long',
        'Fijo discontinuo': 'Permanent discontinu'
      },
      modeMap: {
        Presencial: 'Présentiel',
        Híbrido: 'Hybride'
      },
      scheduleMap: {
        'Jornada completa': 'Temps plein',
        'Fines de semana': 'Week-ends',
        'Turno rotativo': 'Rotation',
        Mañanas: 'Matins',
        'Turnos partidos': 'Horaires coupés',
        'Jornada continua': 'Journée continue',
        Tardes: 'Après-midi',
        'Jornada intensiva': 'Journée intensive',
        'Turno partido': 'Horaire coupé'
      },
      badgeMap: {
        Nuevo: 'Nouveau',
        Urgente: 'Urgent',
        Destacado: 'Mis en avant',
        Híbrido: 'Hybride',
        'Aula Rural': 'Classe rurale',
        Campo: 'Terrain',
        Temporada: 'Saison',
        Infraestructura: 'Infrastructure',
        Comunidad: 'Communauté',
        Bosque: 'Forêt',
        Alojamiento: 'Logement'
      }
    },
    towns: {
      title: 'Villages',
      searchPlaceholder: 'Rechercher par nom, province ou région...',
      preparing: 'Préparation de la carte municipale sous 10 000 habitants...',
      loading: 'Chargement des municipalités espagnoles avec population officielle...',
      filters: {
        all: 'Tous',
        under1k: 'Moins de 1 000',
        between1k5k: '1 000-5 000',
        between5k10k: '5 000-10 000'
      },
      inhabitants: 'habitants',
      profile: 'profil',
      ineCode: 'code INE',
      distance: 'distance',
      previewNote: 'Population officielle INE {year} et localisation de la commune.',
      moreDetails: 'Voir plus',
      save: 'Enregistrer la commune',
      unsave: 'Retirer des enregistrés',
      showMap: 'Voir sur la carte',
      quickSummary: 'Résumé rapide',
      municipalFile: 'Fiche de la commune',
      province: 'Province',
      region: 'Région',
      code: 'Code INE',
      coords: 'Coordonnées',
      dataUsed: 'Données utilisées',
      dataCopy: 'La population provient du registre municipal de l’INE ({year}) et la localisation utilise le dataset géographique chargé dans l’application.',
      visibleFilterAll: '< 10 k hab.',
      locationActive: 'position active',
      visibleOne: '1 commune visible',
      visibleOther: '{count} communes visibles',
      profiles: {
        micro: 'Micro-village',
        small: 'Petit village',
        medium: 'Village moyen'
      }
    },
    saved: {
      title: 'Enregistrés',
      emptyJobsTitle: 'Aucun emploi enregistré',
      emptyJobsCopy: 'Enregistrez des offres depuis l’écran emploi pour les voir ici.',
      exploreJobs: 'Voir les emplois',
      emptyTownsTitle: 'Aucun village enregistré',
      emptyTownsCopy: 'Explorez la carte municipale et enregistrez les villages à revoir plus tard.',
      exploreTowns: 'Voir les villages',
      remove: 'Retirer'
    },
    admin: {
      title: 'Admin',
      viewTitle: 'Vue des localisations',
      viewCopy: 'Dataset local de suivi pour les tests. Sur le web, les données ne sont enregistrées que tant que le navigateur peut garder l’application active.',
      usersWithSignal: 'Utilisateurs avec signal',
      records: 'Enregistrements',
      emptySummary: 'Aucune localisation utilisateur enregistrée.',
      emptyTitle: 'Aucun dataset pour le moment',
      emptyCopy: 'Les enregistrements apparaîtront ici lorsque des utilisateurs non admins accepteront le partage de localisation.',
      lastUpdate: 'Dernière mise à jour {relative} · dataset local de test',
      townMissing: 'Commune non indiquée',
      regionMissing: 'Région non indiquée',
      latlon: 'Lat / Lon',
      accuracy: 'Précision',
      lastRecord: 'Dernier enregistrement',
      samples: 'Échantillons',
      viewOnMap: 'Voir sur la carte',
      noDate: 'sans date',
      adminOnly: 'Seul le profil admin peut accéder à cette vue'
    },
    experiment: {
      title: 'Avis important',
      copy: 'En vous inscrivant, vous entrez dans le projet Arraigo, financé par la Communauté de Madrid. Certaines données seront utilisées pour l’étude.',
      button: 'Compris'
    },
    privacy: {
      title: 'Politique de confidentialité',
      button: 'Compris et accepté'
    },
    status: {
      unemployed: 'Sans emploi',
      seeking: 'En recherche d’emploi',
      employed: 'En emploi',
      self_employed: 'Indépendant/e',
      student: 'Étudiant/e'
    },
    regions: {
      andalucia: 'Andalousie',
      aragon: 'Aragon',
      asturias: 'Asturies',
      canarias: 'Canaries',
      cantabria: 'Cantabrie',
      castilla_y_leon: 'Castille-et-León',
      castilla_la_mancha: 'Castille-La Manche',
      cataluna: 'Catalogne',
      comunidad_valenciana: 'Communauté valencienne',
      extremadura: 'Estrémadure',
      galicia: 'Galice',
      madrid: 'Madrid',
      murcia: 'Murcie',
      navarra: 'Navarre',
      pais_vasco: 'Pays basque'
    },
    role: {
      active: 'Session active',
      admin: 'Admin'
    },
    tracking: {
      pending: 'Position en attente',
      none: 'Position non enregistrée',
      latest: 'Dernière position {date}',
      enabled: 'Suivi de position activé',
      disabled: 'Suivi de position désactivé',
      allow: 'Autorisez la position pour activer le suivi',
      failed: 'Le suivi de position n’a pas pu être activé'
    },
    auth: {
      required: 'Veuillez renseigner le nom, l’e-mail et le mot de passe.',
      passwordLength: 'Le mot de passe doit contenir au moins 8 caractères.',
      emailExists: 'Cet e-mail est déjà enregistré. Connectez-vous.',
      termsRequired: 'Vous devez accepter les conditions et la confidentialité pour continuer.',
      accountCreated: 'Compte créé avec session persistante',
      loginRequired: 'Saisissez votre e-mail et votre mot de passe.',
      invalid: 'Utilisateur ou mot de passe incorrect.',
      welcome: 'Bon retour, {name}',
      adminWelcome: 'Accès administrateur activé, {name}',
      sessionClosed: 'Session fermée',
      recovery: 'Envoi du lien de récupération...'
    },
    homeNews: {
      loading: 'Chargement des actualités sur l’emploi rural, les villages et les aides...',
      updating: 'Actualisation des actualités emploi rural et villages...',
      updated: 'Actualités mises à jour {relative} sur l’emploi rural, les villages et les aides.',
      emptyTitle: 'Aucune actualité disponible',
      emptyCopy: 'Impossible de charger les titres liés à l’emploi rural et aux villages pour le moment.',
      retry: 'Réessayer',
      cachedError: 'Mise à jour impossible pour le moment. Affichage des dernières actualités enregistrées.',
      failed: 'Impossible de charger des actualités réelles pour le moment.',
      featuredBadge: 'Emploi et villages'
    }
  },
  de: {
    common: {
      start: 'Starten',
      continue: 'Weiter',
      cancel: 'Abbrechen',
      save: 'Speichern',
      close: 'Schließen',
      understood: 'Verstanden',
      edit: 'Bearbeiten',
      home: 'Start',
      jobs: 'Jobs',
      towns: 'Orte',
      saved: 'Gespeichert',
      admin: 'Admin',
      quickAccess: 'Schnellzugriff',
      news: 'Nachrichten',
      refresh: 'Aktualisieren',
      search: 'Suchen',
      noNotifications: 'Keine neuen Benachrichtigungen',
      profileActive: 'Profil aktiv',
      select: 'Auswählen'
    },
    splash: {
      titleHtml: 'Dein neues Leben<br/>im ländlichen<br/><span style="color:#30D158;">Spanien</span>',
      copy: 'Finde Arbeit, Wohnen und Gemeinschaft in Gemeinden, die dich am meisten brauchen.',
      loginExisting: 'Ich habe bereits ein Konto'
    },
    login: {
      nav: 'Anmelden',
      title: 'Willkommen',
      copy: 'Melde dich bei deinem Arraigo-Konto an',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'beispiel@email.com',
      passwordLabel: 'Passwort',
      passwordPlaceholder: 'Dein Passwort',
      forgot: 'Passwort vergessen?',
      adminHtml: 'Admin-Testkonto: <strong style="color:var(--label);">admin@arraigo.test</strong><br/>Passwort: <strong style="color:var(--label);">ArraigoAdmin2026!</strong>',
      submit: 'Anmelden',
      signupHtml: 'Noch kein Konto? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-onboard\');return false;">Konto erstellen</a>'
    },
    onboard: {
      nav: 'Sprache',
      title: 'Wähle deine Sprache',
      copy: 'Wähle die Sprache, mit der du dich am wohlsten fühlst.'
    },
    register: {
      nav: 'Konto erstellen',
      skip: 'Überspringen',
      titleHtml: 'Erzähl uns<br/>etwas über dich',
      copy: 'Erstelle dein Profil, um deinen Ansiedlungsweg zu beginnen.',
      experiment: 'Hinweis zum Projekt',
      nameLabel: 'Vollständiger Name',
      namePlaceholder: 'Max Mustermann',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'beispiel@email.com',
      passwordLabel: 'Passwort',
      passwordPlaceholder: 'Mindestens 8 Zeichen',
      ageLabel: 'Alter',
      agePlaceholder: '25',
      townLabel: 'Gemeinde',
      townPlaceholder: 'Dein Ort',
      phoneLabel: 'Telefon',
      phonePlaceholder: '600 000 000',
      statusLabel: 'Beruflicher Status',
      countryLabel: 'Herkunftsland',
      countryPlaceholder: 'Kolumbien, Marokko...',
      regionLabel: 'Bevorzugte autonome Gemeinschaft',
      termsTitle: 'Bedingungen und Datenschutz',
      termsHtml: 'Ich akzeptiere die Bedingungen von Arraigo · <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openPrivacy();return false;">Richtlinie lesen</a>',
      submit: 'Mein Konto erstellen',
      loginHtml: 'Hast du schon ein Konto? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-login\');return false;">Anmelden</a>'
    },
    home: {
      jobsCopy: 'Stellen ansehen',
      townsCopy: 'Kommunalkarte',
      sepeCopy: 'Offizielle Website',
      savedTitle: 'Gespeichert',
      savedDefault: 'Deine Favoriten'
    },
    profile: {
      guest: 'Gast',
      guestStatus: 'Ländliche Jobs entdecken',
      defaultStatus: 'Suche nach ländlicher Arbeit',
      adminStatus: 'Überwachung und Kontrolle',
      updated: 'Profil aktualisiert',
      photoUpdated: 'Foto aktualisiert',
      privacyAccepted: 'Datenschutzrichtlinie akzeptiert'
    },
    editProfile: {
      nav: 'Profil bearbeiten',
      changePhoto: 'Foto ändern',
      personalInfo: 'PERSÖNLICHE INFORMATIONEN',
      tracking: 'TRACKING',
      trackingTitle: 'Standort für Analyse teilen',
      trackingEmpty: 'Standort noch nicht erfasst',
      logout: 'Abmelden',
      currentTownLabel: 'Aktuelle Gemeinde'
    },
    sepe: {
      serviceSubtitle: 'Spanischer öffentlicher Arbeitsdienst',
      copy: 'Greife auf das SEPE-Portal zu, um Arbeitslosigkeit, Leistungen und offizielle Jobsuche zu verwalten.',
      noteHtml: '<strong>⚠ Hinweis:</strong> Die SEPE-Website kann aus Sicherheitsgründen nicht in andere Apps eingebettet werden. Öffne sie im Browser.',
      open: 'Portal öffnen',
      shortcuts: 'SCHNELLZUGRIFFE',
      benefit: 'Leistung beantragen',
      benefitCopy: 'Arbeitslosengeld',
      offers: 'Stellenangebote',
      offersCopy: 'Aktive Jobsuche',
      training: 'Kurse und Weiterbildung',
      trainingCopy: 'Weiterbildungsplan',
      dossier: 'Meine Akte',
      dossierCopy: 'Beruflicher Verlauf',
      appointment: 'Termin',
      appointmentCopy: 'Termin im Amt buchen'
    },
    jobs: {
      title: 'Jobs',
      searchPlaceholder: 'Job, Unternehmen oder Provinz suchen...',
      preparing: 'Stellenangebote werden vorbereitet...',
      filters: {
        all: 'Alle',
        agriculture: 'Landwirtschaft',
        hospitality: 'Gastgewerbe',
        technology: 'Technologie',
        healthcare: 'Gesundheit',
        education: 'Bildung'
      },
      visibleOne: '1 sichtbares Angebot',
      visibleOther: '{count} sichtbare Angebote',
      emptyTitle: 'Keine Ergebnisse',
      emptyCopy: 'Probiere eine andere Suche oder ändere den Filter.',
      clear: 'Filter löschen',
      details: 'Details ansehen',
      salary: 'Gehalt',
      contract: 'Vertrag',
      mode: 'Modus',
      summary: 'Zusammenfassung',
      requirements: 'Anforderungen',
      benefits: 'Angeboten wird',
      save: 'Job speichern',
      unsave: 'Aus Gespeichert entfernen',
      contact: 'Kontakt',
      categoryMap: {
        Todos: 'Alle',
        Agricultura: 'Landwirtschaft',
        Hostelería: 'Gastgewerbe',
        Tecnología: 'Technologie',
        Sanidad: 'Gesundheit',
        Educación: 'Bildung'
      },
      contractMap: {
        Indefinido: 'Unbefristet',
        Temporal: 'Befristet',
        'Sustitución larga': 'Lange Vertretung',
        'Fijo discontinuo': 'Saisonvertrag'
      },
      modeMap: {
        Presencial: 'Vor Ort',
        Híbrido: 'Hybrid'
      },
      scheduleMap: {
        'Jornada completa': 'Vollzeit',
        'Fines de semana': 'Wochenenden',
        'Turno rotativo': 'Wechselschicht',
        Mañanas: 'Vormittage',
        'Turnos partidos': 'Geteilte Schichten',
        'Jornada continua': 'Durchgehende Schicht',
        Tardes: 'Nachmittage',
        'Jornada intensiva': 'Kompakte Arbeitszeit',
        'Turno partido': 'Geteilte Schicht'
      },
      badgeMap: {
        Nuevo: 'Neu',
        Urgente: 'Dringend',
        Destacado: 'Hervorgehoben',
        Híbrido: 'Hybrid',
        'Aula Rural': 'Ländliche Klasse',
        Campo: 'Feld',
        Temporada: 'Saison',
        Infraestructura: 'Infrastruktur',
        Comunidad: 'Gemeinschaft',
        Bosque: 'Wald',
        Alojamiento: 'Unterkunft'
      }
    },
    towns: {
      title: 'Orte',
      searchPlaceholder: 'Nach Name, Provinz oder Region suchen...',
      preparing: 'Kommunalkarte unter 10.000 Einwohnern wird vorbereitet...',
      loading: 'Spanische Gemeinden mit offizieller Einwohnerzahl werden geladen...',
      filters: {
        all: 'Alle',
        under1k: 'Unter 1.000',
        between1k5k: '1.000-5.000',
        between5k10k: '5.000-10.000'
      },
      inhabitants: 'Einwohner',
      profile: 'Profil',
      ineCode: 'INE-Code',
      distance: 'Entfernung',
      previewNote: 'Offizielle INE-Bevölkerung {year} und Lage der Gemeinde.',
      moreDetails: 'Mehr Details',
      save: 'Ort speichern',
      unsave: 'Aus Gespeichert entfernen',
      showMap: 'Auf Karte sehen',
      quickSummary: 'Kurzübersicht',
      municipalFile: 'Gemeindedaten',
      province: 'Provinz',
      region: 'Region',
      code: 'INE-Code',
      coords: 'Koordinaten',
      dataUsed: 'Verwendete Daten',
      dataCopy: 'Die Bevölkerung stammt aus dem kommunalen Register des INE ({year}) und der Standort nutzt den geografischen Datensatz der App.',
      visibleFilterAll: '< 10 Tsd. Ew.',
      locationActive: 'Standort aktiv',
      visibleOne: '1 sichtbare Gemeinde',
      visibleOther: '{count} sichtbare Gemeinden',
      profiles: {
        micro: 'Kleinstort',
        small: 'Kleiner Ort',
        medium: 'Mittlerer Ort'
      }
    },
    saved: {
      title: 'Gespeichert',
      emptyJobsTitle: 'Keine gespeicherten Jobs',
      emptyJobsCopy: 'Speichere Angebote im Jobbereich, um sie hier zu sehen.',
      exploreJobs: 'Jobs ansehen',
      emptyTownsTitle: 'Keine gespeicherten Orte',
      emptyTownsCopy: 'Erkunde die Gemeindekarte und speichere Orte für später.',
      exploreTowns: 'Orte ansehen',
      remove: 'Entfernen'
    },
    admin: {
      title: 'Admin',
      viewTitle: 'Standortübersicht',
      viewCopy: 'Lokales Tracking-Dataset für Tests. Im Web werden Daten nur erfasst, solange der Browser die App ausführen kann.',
      usersWithSignal: 'Nutzer mit Signal',
      records: 'Datensätze',
      emptySummary: 'Noch keine Nutzerstandorte erfasst.',
      emptyTitle: 'Noch kein Dataset',
      emptyCopy: 'Einträge erscheinen hier, wenn Nicht-Admin-Nutzer der Standortfreigabe zustimmen.',
      lastUpdate: 'Letzte Aktualisierung {relative} · lokales Test-Dataset',
      townMissing: 'Gemeinde nicht angegeben',
      regionMissing: 'Region nicht angegeben',
      latlon: 'Lat / Lon',
      accuracy: 'Genauigkeit',
      lastRecord: 'Letzter Eintrag',
      samples: 'Proben',
      viewOnMap: 'Auf Karte sehen',
      noDate: 'ohne Datum',
      adminOnly: 'Nur das Admin-Profil kann diese Ansicht öffnen'
    },
    experiment: {
      title: 'Wichtiger Hinweis',
      copy: 'Mit der Registrierung nimmst du am Arraigo-Projekt teil, das von der Gemeinschaft Madrid finanziert wird. Einige Daten werden für die Studie verwendet.',
      button: 'Verstanden'
    },
    privacy: {
      title: 'Datenschutzrichtlinie',
      button: 'Verstanden und akzeptiert'
    },
    status: {
      unemployed: 'Arbeitslos',
      seeking: 'Auf Jobsuche',
      employed: 'Beschäftigt',
      self_employed: 'Selbstständig',
      student: 'Studierend'
    },
    regions: {
      andalucia: 'Andalusien',
      aragon: 'Aragonien',
      asturias: 'Asturien',
      canarias: 'Kanarische Inseln',
      cantabria: 'Kantabrien',
      castilla_y_leon: 'Kastilien und León',
      castilla_la_mancha: 'Kastilien-La Mancha',
      cataluna: 'Katalonien',
      comunidad_valenciana: 'Valencianische Gemeinschaft',
      extremadura: 'Extremadura',
      galicia: 'Galicien',
      madrid: 'Madrid',
      murcia: 'Murcia',
      navarra: 'Navarra',
      pais_vasco: 'Baskenland'
    },
    role: {
      active: 'Sitzung aktiv',
      admin: 'Admin'
    },
    tracking: {
      pending: 'Standort ausstehend',
      none: 'Standort noch nicht erfasst',
      latest: 'Letzter Standort {date}',
      enabled: 'Standort-Tracking aktiviert',
      disabled: 'Standort-Tracking deaktiviert',
      allow: 'Erlaube den Standortzugriff, um das Tracking zu aktivieren',
      failed: 'Standort-Tracking konnte nicht aktiviert werden'
    },
    auth: {
      required: 'Bitte Name, E-Mail und Passwort ausfüllen.',
      passwordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
      emailExists: 'Diese E-Mail ist bereits registriert. Bitte anmelden.',
      termsRequired: 'Du musst Bedingungen und Datenschutz akzeptieren, um fortzufahren.',
      accountCreated: 'Konto mit persistenter Sitzung erstellt',
      loginRequired: 'Gib deine E-Mail und dein Passwort ein.',
      invalid: 'Benutzername oder Passwort falsch.',
      welcome: 'Willkommen zurück, {name}',
      adminWelcome: 'Admin-Zugriff aktiv, {name}',
      sessionClosed: 'Sitzung beendet',
      recovery: 'Wiederherstellungslink wird gesendet...'
    },
    homeNews: {
      loading: 'Nachrichten zu ländlicher Beschäftigung, Orten und Förderungen werden geladen...',
      updating: 'Nachrichten zu ländlicher Arbeit und Orten werden aktualisiert...',
      updated: 'Nachrichten {relative} zu ländlicher Arbeit, Orten und Förderungen aktualisiert.',
      emptyTitle: 'Keine Nachrichten verfügbar',
      emptyCopy: 'Schlagzeilen zu ländlicher Beschäftigung und Orten konnten momentan nicht geladen werden.',
      retry: 'Erneut versuchen',
      cachedError: 'Aktualisierung derzeit nicht möglich. Letzte gespeicherte Schlagzeilen werden angezeigt.',
      failed: 'Echte Nachrichten konnten momentan nicht geladen werden.',
      featuredBadge: 'Jobs und Orte'
    }
  },
  it: {
    common: {
      start: 'Inizia',
      continue: 'Continua',
      cancel: 'Annulla',
      save: 'Salva',
      close: 'Chiudi',
      understood: 'Capito',
      edit: 'Modifica',
      home: 'Home',
      jobs: 'Lavoro',
      towns: 'Paesi',
      saved: 'Salvati',
      admin: 'Admin',
      quickAccess: 'Accessi rapidi',
      news: 'Notizie',
      refresh: 'Aggiorna',
      search: 'Cerca',
      noNotifications: 'Nessuna nuova notifica',
      profileActive: 'Profilo attivo',
      select: 'Seleziona'
    },
    splash: {
      titleHtml: 'La tua nuova vita<br/>nella Spagna<br/><span style="color:#30D158;">rurale</span>',
      copy: 'Trova lavoro, alloggio e comunità nei comuni che hanno più bisogno di te.',
      loginExisting: 'Ho già un account'
    },
    login: {
      nav: 'Accedi',
      title: 'Benvenuto',
      copy: 'Accedi al tuo account Arraigo',
      emailLabel: 'Email',
      emailPlaceholder: 'esempio@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'La tua password',
      forgot: 'Hai dimenticato la password?',
      adminHtml: 'Utente admin di test: <strong style="color:var(--label);">admin@arraigo.test</strong><br/>Password: <strong style="color:var(--label);">ArraigoAdmin2026!</strong>',
      submit: 'Accedi',
      signupHtml: 'Non hai un account? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-onboard\');return false;">Creane uno</a>'
    },
    onboard: {
      nav: 'Lingua',
      title: 'Scegli la tua lingua',
      copy: 'Seleziona la lingua con cui ti senti più a tuo agio.'
    },
    register: {
      nav: 'Crea account',
      skip: 'Salta',
      titleHtml: 'Parlaci<br/>di te',
      copy: 'Crea il tuo profilo per iniziare il tuo percorso di radicamento.',
      experiment: 'Avviso progetto',
      nameLabel: 'Nome completo',
      namePlaceholder: 'Mario Rossi',
      emailLabel: 'Email',
      emailPlaceholder: 'esempio@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Almeno 8 caratteri',
      ageLabel: 'Età',
      agePlaceholder: '25',
      townLabel: 'Comune',
      townPlaceholder: 'Il tuo comune',
      phoneLabel: 'Telefono',
      phonePlaceholder: '600 000 000',
      statusLabel: 'Situazione lavorativa',
      countryLabel: 'Paese d’origine',
      countryPlaceholder: 'Colombia, Marocco...',
      regionLabel: 'Comunità autonoma di interesse',
      termsTitle: 'Termini e privacy',
      termsHtml: 'Accetto i termini di Arraigo · <a href="#" style="color:var(--ios-blue);text-decoration:none;" onclick="event.stopPropagation();openPrivacy();return false;">Leggi la policy</a>',
      submit: 'Crea il mio account',
      loginHtml: 'Hai già un account? <a href="#" style="color:var(--ios-blue);" onclick="go(\'s-login\');return false;">Accedi</a>'
    },
    home: {
      jobsCopy: 'Esplora offerte',
      townsCopy: 'Mappa comunale',
      sepeCopy: 'Sito ufficiale',
      savedTitle: 'Salvati',
      savedDefault: 'I tuoi preferiti'
    },
    profile: {
      guest: 'Ospite',
      guestStatus: 'Esplora il lavoro rurale',
      defaultStatus: 'Cerco lavoro rurale',
      adminStatus: 'Monitoraggio e controllo',
      updated: 'Profilo aggiornato',
      photoUpdated: 'Foto aggiornata',
      privacyAccepted: 'Informativa privacy accettata'
    },
    editProfile: {
      nav: 'Modifica profilo',
      changePhoto: 'Cambia foto',
      personalInfo: 'INFORMAZIONI PERSONALI',
      tracking: 'TRACCIAMENTO',
      trackingTitle: 'Condividi la posizione per analisi',
      trackingEmpty: 'Posizione non ancora registrata',
      logout: 'Disconnetti',
      currentTownLabel: 'Comune attuale'
    },
    sepe: {
      serviceSubtitle: 'Servizio pubblico statale per l’impiego',
      copy: 'Accedi al portale SEPE per gestire disoccupazione, sussidi e ricerca di lavoro ufficiale.',
      noteHtml: '<strong>⚠ Nota:</strong> il sito SEPE non può essere incorporato in altre app per motivi di sicurezza. Aprilo nel browser.',
      open: 'Apri portale',
      shortcuts: 'ACCESSI RAPIDI',
      benefit: 'Richiedi sussidio',
      benefitCopy: 'Disoccupazione',
      offers: 'Offerte di lavoro',
      offersCopy: 'Ricerca attiva',
      training: 'Formazione e corsi',
      trainingCopy: 'Piano formativo',
      dossier: 'Il mio fascicolo',
      dossierCopy: 'Storico lavorativo',
      appointment: 'Appuntamento',
      appointmentCopy: 'Prenota in ufficio'
    },
    jobs: {
      title: 'Lavoro',
      searchPlaceholder: 'Cerca lavoro, azienda o provincia...',
      preparing: 'Preparazione delle offerte...',
      filters: {
        all: 'Tutti',
        agriculture: 'Agricoltura',
        hospitality: 'Ospitalità',
        technology: 'Tecnologia',
        healthcare: 'Sanità',
        education: 'Istruzione'
      },
      visibleOne: '1 offerta visibile',
      visibleOther: '{count} offerte visibili',
      emptyTitle: 'Nessun risultato',
      emptyCopy: 'Prova un’altra ricerca o cambia filtro.',
      clear: 'Pulisci filtri',
      details: 'Vedi dettagli',
      salary: 'Stipendio',
      contract: 'Contratto',
      mode: 'Modalità',
      summary: 'Riepilogo',
      requirements: 'Requisiti',
      benefits: 'Cosa offre',
      save: 'Salva lavoro',
      unsave: 'Rimuovi dai salvati',
      contact: 'Contatta',
      categoryMap: {
        Todos: 'Tutti',
        Agricultura: 'Agricoltura',
        Hostelería: 'Ospitalità',
        Tecnología: 'Tecnologia',
        Sanidad: 'Sanità',
        Educación: 'Istruzione'
      },
      contractMap: {
        Indefinido: 'Indeterminato',
        Temporal: 'Temporaneo',
        'Sustitución larga': 'Sostituzione lunga',
        'Fijo discontinuo': 'Fisso discontinuo'
      },
      modeMap: {
        Presencial: 'In presenza',
        Híbrido: 'Ibrido'
      },
      scheduleMap: {
        'Jornada completa': 'Tempo pieno',
        'Fines de semana': 'Weekend',
        'Turno rotativo': 'Turno rotativo',
        Mañanas: 'Mattine',
        'Turnos partidos': 'Turni spezzati',
        'Jornada continua': 'Turno continuo',
        Tardes: 'Pomeriggi',
        'Jornada intensiva': 'Orario intensivo',
        'Turno partido': 'Turno spezzato'
      },
      badgeMap: {
        Nuevo: 'Nuovo',
        Urgente: 'Urgente',
        Destacado: 'In evidenza',
        Híbrido: 'Ibrido',
        'Aula Rural': 'Aula rurale',
        Campo: 'Campo',
        Temporada: 'Stagione',
        Infraestructura: 'Infrastruttura',
        Comunidad: 'Comunità',
        Bosque: 'Bosco',
        Alojamiento: 'Alloggio'
      }
    },
    towns: {
      title: 'Paesi',
      searchPlaceholder: 'Cerca per nome, provincia o regione...',
      preparing: 'Preparazione della mappa comunale sotto i 10.000 abitanti...',
      loading: 'Caricamento dei comuni spagnoli con popolazione ufficiale...',
      filters: {
        all: 'Tutti',
        under1k: 'Meno di 1.000',
        between1k5k: '1.000-5.000',
        between5k10k: '5.000-10.000'
      },
      inhabitants: 'abitanti',
      profile: 'profilo',
      ineCode: 'codice INE',
      distance: 'distanza',
      previewNote: 'Popolazione ufficiale INE {year} e posizione del comune.',
      moreDetails: 'Vedi più dettagli',
      save: 'Salva comune',
      unsave: 'Rimuovi dai salvati',
      showMap: 'Vedi sulla mappa',
      quickSummary: 'Riepilogo rapido',
      municipalFile: 'Scheda del comune',
      province: 'Provincia',
      region: 'Regione',
      code: 'Codice INE',
      coords: 'Coordinate',
      dataUsed: 'Dati utilizzati',
      dataCopy: 'La popolazione proviene dal registro comunale dell’INE ({year}) e la posizione usa il dataset geografico caricato nell’app.',
      visibleFilterAll: '< 10 mila ab.',
      locationActive: 'posizione attiva',
      visibleOne: '1 comune visibile',
      visibleOther: '{count} comuni visibili',
      profiles: {
        micro: 'Micro paese',
        small: 'Paese piccolo',
        medium: 'Paese medio'
      }
    },
    saved: {
      title: 'Salvati',
      emptyJobsTitle: 'Nessun lavoro salvato',
      emptyJobsCopy: 'Salva offerte dalla schermata lavoro per vederle qui.',
      exploreJobs: 'Esplora lavori',
      emptyTownsTitle: 'Nessun paese salvato',
      emptyTownsCopy: 'Esplora la mappa comunale e salva i paesi per dopo.',
      exploreTowns: 'Esplora paesi',
      remove: 'Rimuovi'
    },
    admin: {
      title: 'Admin',
      viewTitle: 'Vista delle posizioni',
      viewCopy: 'Dataset locale di tracciamento per test. Sul web i dati vengono registrati solo mentre il browser riesce a eseguire l’app.',
      usersWithSignal: 'Utenti con segnale',
      records: 'Record',
      emptySummary: 'Nessuna posizione utente registrata.',
      emptyTitle: 'Nessun dataset per ora',
      emptyCopy: 'I record appariranno qui quando utenti non admin accetteranno di condividere la posizione.',
      lastUpdate: 'Ultimo aggiornamento {relative} · dataset locale di test',
      townMissing: 'Comune non indicato',
      regionMissing: 'Regione non indicata',
      latlon: 'Lat / Lon',
      accuracy: 'Precisione',
      lastRecord: 'Ultimo record',
      samples: 'Campioni',
      viewOnMap: 'Vedi sulla mappa',
      noDate: 'senza data',
      adminOnly: 'Solo il profilo admin può accedere a questa vista'
    },
    experiment: {
      title: 'Avviso importante',
      copy: 'Registrandoti entri nel progetto Arraigo, finanziato dalla Comunità di Madrid. Alcuni dati saranno usati per lo studio.',
      button: 'Capito'
    },
    privacy: {
      title: 'Informativa privacy',
      button: 'Capito e accetto'
    },
    status: {
      unemployed: 'Disoccupato/a',
      seeking: 'In cerca di lavoro',
      employed: 'Occupato/a',
      self_employed: 'Autonomo/a',
      student: 'Studente'
    },
    regions: {
      andalucia: 'Andalusia',
      aragon: 'Aragona',
      asturias: 'Asturie',
      canarias: 'Canarie',
      cantabria: 'Cantabria',
      castilla_y_leon: 'Castiglia e León',
      castilla_la_mancha: 'Castiglia-La Mancia',
      cataluna: 'Catalogna',
      comunidad_valenciana: 'Comunità Valenciana',
      extremadura: 'Estremadura',
      galicia: 'Galizia',
      madrid: 'Madrid',
      murcia: 'Murcia',
      navarra: 'Navarra',
      pais_vasco: 'Paesi Baschi'
    },
    role: {
      active: 'Sessione attiva',
      admin: 'Admin'
    },
    tracking: {
      pending: 'Posizione in attesa',
      none: 'Posizione non ancora registrata',
      latest: 'Ultima posizione {date}',
      enabled: 'Tracciamento posizione attivato',
      disabled: 'Tracciamento posizione disattivato',
      allow: 'Consenti la posizione per attivare il tracciamento',
      failed: 'Impossibile attivare il tracciamento della posizione'
    },
    auth: {
      required: 'Compila nome, email e password.',
      passwordLength: 'La password deve avere almeno 8 caratteri.',
      emailExists: 'Questa email è già registrata. Accedi.',
      termsRequired: 'Devi accettare termini e privacy per continuare.',
      accountCreated: 'Account creato con sessione persistente',
      loginRequired: 'Inserisci email e password.',
      invalid: 'Utente o password non corretti.',
      welcome: 'Bentornato, {name}',
      adminWelcome: 'Accesso amministratore attivo, {name}',
      sessionClosed: 'Sessione chiusa',
      recovery: 'Invio del link di recupero...'
    },
    homeNews: {
      loading: 'Caricamento delle notizie su occupabilità rurale, paesi e aiuti...',
      updating: 'Aggiornamento notizie su lavoro rurale e paesi...',
      updated: 'Notizie aggiornate {relative} su lavoro rurale, paesi e aiuti.',
      emptyTitle: 'Nessuna notizia disponibile',
      emptyCopy: 'Impossibile caricare titoli su lavoro rurale e paesi in questo momento.',
      retry: 'Riprova',
      cachedError: 'Aggiornamento non disponibile ora. Mostro le ultime notizie salvate.',
      failed: 'Impossibile caricare notizie reali in questo momento.',
      featuredBadge: 'Lavoro e paesi'
    }
  }
};

const STATUS_ALIASES = {
  'Desempleado/a': 'unemployed',
  'Buscando empleo': 'seeking',
  Trabajando: 'employed',
  'Autónomo/a': 'self_employed',
  Estudiante: 'student'
};

const REGION_ALIASES = {
  'Andalucía': 'andalucia',
  'Aragón': 'aragon',
  Asturias: 'asturias',
  Canarias: 'canarias',
  Cantabria: 'cantabria',
  'Castilla y León': 'castilla_y_leon',
  'Castilla-La Mancha': 'castilla_la_mancha',
  Cataluña: 'cataluna',
  'Comunidad Valenciana': 'comunidad_valenciana',
  Extremadura: 'extremadura',
  Galicia: 'galicia',
  Madrid: 'madrid',
  Murcia: 'murcia',
  Navarra: 'navarra',
  'País Vasco': 'pais_vasco'
};

function getNestedValue(object, path) {
  return String(path || '')
    .split('.')
    .reduce((accumulator, key) => (accumulator && key in accumulator ? accumulator[key] : undefined), object);
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
}

function setTextContent(element, value) {
  if (element) element.textContent = value;
}

function setInnerHtml(element, value) {
  if (element) element.innerHTML = value;
}

function setInputLabel(elementId, key) {
  const input = document.getElementById(elementId);
  if (!input) return;

  let label = input.closest('.ios-input-group')?.querySelector('label');
  if (!label) label = input.parentElement?.querySelector('label');
  if (!label) label = input.parentElement?.previousElementSibling;
  if (!label || label.tagName !== 'LABEL') return;

  label.textContent = t(key);
}

function setPlaceholder(elementId, key) {
  const element = document.getElementById(elementId);
  if (element) element.placeholder = t(key);
}

function applySelectOptionTranslations() {
  ['reg-status', 'ep-status'].forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;

    Array.from(select.options).forEach(option => {
      if (!option.value) {
        option.textContent = t('common.select');
        return;
      }
      option.textContent = t(`status.${option.value}`);
    });
  });

  ['reg-region', 'ep-region'].forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;

    Array.from(select.options).forEach(option => {
      if (!option.value) {
        option.textContent = t('common.select');
        return;
      }
      option.textContent = t(`regions.${option.value}`);
    });
  });
}

function applyTabTranslations() {
  document.querySelectorAll('.tab-bar').forEach(tabBar => {
    const labels = tabBar.querySelectorAll('.tab-label');
    const tabLabels = [
      t('common.home'),
      t('common.jobs'),
      t('common.towns'),
      t('common.communities'),
      t('common.saved')
    ];

    tabLabels.forEach((label, index) => {
      if (labels[index]) labels[index].textContent = label;
    });
  });

  const savedTabs = document.querySelectorAll('#s-saved .seg-item');
  if (savedTabs.length >= 2) {
    savedTabs[0].textContent = t('common.jobs');
    savedTabs[1].textContent = t('common.towns');
  }
}

function applyFilterTranslations() {
  const jobChips = document.querySelectorAll('#jobs-filters .chip');
  if (jobChips.length >= 6) {
    jobChips[0].textContent = t('jobs.filters.all');
    jobChips[1].textContent = t('jobs.filters.agriculture');
    jobChips[2].textContent = t('jobs.filters.hospitality');
    jobChips[3].textContent = t('jobs.filters.technology');
    jobChips[4].textContent = t('jobs.filters.healthcare');
    jobChips[5].textContent = t('jobs.filters.education');
  }

  const townChips = document.querySelectorAll('#towns-filters .chip');
  if (townChips.length >= 4) {
    townChips[0].textContent = t('towns.filters.all');
    townChips[1].textContent = t('towns.filters.under1k');
    townChips[2].textContent = t('towns.filters.between1k5k');
    townChips[3].textContent = t('towns.filters.between5k10k');
  }
}

function applySplashTranslations() {
  const copyBlock = document.querySelector('#s-splash .fu');
  if (!copyBlock) return;

  setInnerHtml(copyBlock.children[0], t('splash.titleHtml'));
  setTextContent(copyBlock.children[1], t('splash.copy'));

  const buttons = copyBlock.querySelectorAll('button');
  if (buttons.length >= 2) {
    buttons[0].textContent = t('common.start');
    buttons[1].textContent = t('splash.loginExisting');
  }
}

function applyLoginTranslations() {
  const screen = document.getElementById('s-login');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title'), t('login.nav'));

  const body = screen.querySelector('.scroll > div');
  if (body?.children?.length >= 8) {
    const hero = body.children[0];
    setTextContent(hero.children[1], t('login.title'));
    setTextContent(hero.children[2], t('login.copy'));
    setTextContent(body.children[1], t('auth.invalid'));
    setTextContent(body.children[4].querySelector('a'), t('login.forgot'));
    setInnerHtml(body.children[5], t('login.adminHtml'));
    setTextContent(body.children[6].querySelector('button'), t('login.submit'));
    setInnerHtml(body.children[7], t('login.signupHtml'));
  }

  setInputLabel('login-email', 'login.emailLabel');
  setInputLabel('login-pass', 'login.passwordLabel');
  setPlaceholder('login-email', 'login.emailPlaceholder');
  setPlaceholder('login-pass', 'login.passwordPlaceholder');
}

function applyOnboardTranslations() {
  const screen = document.getElementById('s-onboard');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title'), t('onboard.nav'));
  const body = screen.querySelector('.scroll');
  const hero = body?.children?.[0];
  if (hero) {
    setTextContent(hero.children[1], t('onboard.title'));
    setTextContent(hero.children[2], t('onboard.copy'));
  }

  const continueButton = body?.children?.[2]?.querySelector('button');
  setTextContent(continueButton, t('common.continue'));
}

function applyRegisterTranslations() {
  const screen = document.getElementById('s-register');
  if (!screen) return;

  const nav = screen.querySelector('.nav-bar');
  setTextContent(nav?.querySelector('.nav-title'), t('register.nav'));
  setTextContent(nav?.querySelectorAll('.nav-btn')[1], t('register.skip'));

  const body = screen.querySelector('.scroll > div');
  if (body?.children?.length >= 13) {
    const hero = body.children[1];
    setInnerHtml(hero.children[0], t('register.titleHtml'));
    setTextContent(hero.children[1], t('register.copy'));
    setTextContent(hero.children[2].lastChild, t('register.experiment'));
    setInnerHtml(body.children[12].children[1], t('register.loginHtml'));
    setTextContent(body.children[12].querySelector('button'), t('register.submit'));
  }

  setInputLabel('reg-name', 'register.nameLabel');
  setInputLabel('reg-email', 'register.emailLabel');
  setInputLabel('reg-pass', 'register.passwordLabel');
  setInputLabel('reg-phone', 'register.phoneLabel');
  setInputLabel('reg-status', 'register.statusLabel');
  setInputLabel('reg-country', 'register.countryLabel');
  setInputLabel('reg-region', 'register.regionLabel');
  setPlaceholder('reg-name', 'register.namePlaceholder');
  setPlaceholder('reg-email', 'register.emailPlaceholder');
  setPlaceholder('reg-pass', 'register.passwordPlaceholder');
  setPlaceholder('reg-phone', 'register.phonePlaceholder');
  setPlaceholder('reg-country', 'register.countryPlaceholder');

  const ageContainer = document.getElementById('reg-age')?.parentElement;
  const townContainer = document.getElementById('reg-town')?.parentElement;
  setTextContent(ageContainer?.querySelector('label'), t('register.ageLabel'));
  setTextContent(townContainer?.querySelector('label'), t('register.townLabel'));
  setPlaceholder('reg-age', 'register.agePlaceholder');
  setPlaceholder('reg-town', 'register.townPlaceholder');

  const termsCell = document.getElementById('tog')?.closest('.cell');
  if (termsCell) {
    setTextContent(termsCell.querySelector('.cell-title'), t('register.termsTitle'));
    setInnerHtml(termsCell.querySelector('.cell-subtitle'), t('register.termsHtml'));
  }

  setTextContent(document.getElementById('reg-track-title'), t('register.trackingTitle'));
  setInnerHtml(document.getElementById('reg-track-copy'), t('register.trackingHtml'));
}

function applyHomeTranslations() {
  const screen = document.getElementById('s-home');
  if (!screen) return;

  const profileCard = screen.querySelector('.profile-card');
  if (profileCard) {
    const activeStatus = profileCard.querySelector('span[style*="font-size:13px"]');
    setTextContent(activeStatus, t('common.profileActive'));
    setTextContent(profileCard.querySelector('.btn-gray'), t('common.edit'));
    setTextContent(document.getElementById('home-admin-btn'), t('common.admin'));
  }

  const sectionHeaders = screen.querySelectorAll('.section-hdr-title');
  if (sectionHeaders.length >= 2) {
    sectionHeaders[0].textContent = t('common.quickAccess');
    sectionHeaders[1].textContent = t('common.news');
  }

  const quickButtons = screen.querySelectorAll('.scroll > div[style*="display:grid"] > button');
  if (quickButtons.length >= 4) {
    const jobsButton = quickButtons[0];
    const townsButton = quickButtons[1];
    const sepeButton = quickButtons[2];
    const savedButton = quickButtons[3];

    setTextContent(jobsButton.children[1], t('common.jobs'));
    setTextContent(jobsButton.children[2], t('home.jobsCopy'));
    setTextContent(townsButton.children[1], t('common.towns'));
    setTextContent(townsButton.children[2], t('home.townsCopy'));
    setTextContent(sepeButton.children[1], 'SEPE');
    setTextContent(sepeButton.children[2], t('home.sepeCopy'));
    setTextContent(savedButton.children[1], t('home.savedTitle'));
  }

  const newsLink = screen.querySelector('.section-hdr-link');
  setTextContent(newsLink, t('common.refresh'));
}

function applyEditProfileTranslations() {
  const screen = document.getElementById('s-editprofile');
  if (!screen) return;

  const navButtons = screen.querySelectorAll('.nav-bar .nav-btn');
  setTextContent(navButtons[0], t('common.cancel'));
  setTextContent(screen.querySelector('.nav-title'), t('editProfile.nav'));
  setTextContent(navButtons[1], t('common.save'));
  setTextContent(screen.querySelector('button[onclick*="avatar-input"]'), t('editProfile.changePhoto'));

  const groupLabels = screen.querySelectorAll('.group-label');
  if (groupLabels.length >= 3) {
    groupLabels[0].textContent = t('editProfile.personalInfo');
    groupLabels[1].textContent = t('editProfile.additionalInfo');
    groupLabels[2].textContent = t('editProfile.tracking');
  }

  setInputLabel('ep-name', 'register.nameLabel');
  setInputLabel('ep-age', 'register.ageLabel');
  setInputLabel('ep-email', 'login.emailLabel');
  setInputLabel('ep-phone', 'register.phoneLabel');
  setInputLabel('ep-town', 'editProfile.currentTownLabel');
  setInputLabel('ep-country', 'register.countryLabel');
  setInputLabel('ep-status', 'register.statusLabel');
  setInputLabel('ep-region', 'register.regionLabel');
  setInputLabel('ep-territorial-origin', 'editProfile.territorialOriginLabel');
  setInputLabel('ep-previous-professional-activity', 'editProfile.previousProfessionalActivityLabel');
  setInputLabel('ep-spatial-professional-trajectory', 'editProfile.spatialProfessionalTrajectoryLabel');
  setInputLabel('ep-education-centers', 'editProfile.educationCentersLabel');
  setInputLabel('ep-family-trajectory', 'editProfile.familyTrajectoryLabel');

  setPlaceholder('ep-name', 'register.namePlaceholder');
  setPlaceholder('ep-age', 'register.agePlaceholder');
  setPlaceholder('ep-email', 'login.emailPlaceholder');
  setPlaceholder('ep-phone', 'register.phonePlaceholder');
  setPlaceholder('ep-town', 'register.townPlaceholder');
  setPlaceholder('ep-country', 'register.countryPlaceholder');
  setPlaceholder('ep-territorial-origin', 'editProfile.territorialOriginPlaceholder');
  setPlaceholder('ep-previous-professional-activity', 'editProfile.previousProfessionalActivityPlaceholder');
  setPlaceholder('ep-spatial-professional-trajectory', 'editProfile.spatialProfessionalTrajectoryPlaceholder');
  setPlaceholder('ep-education-centers', 'editProfile.educationCentersPlaceholder');
  setPlaceholder('ep-family-trajectory', 'editProfile.familyTrajectoryPlaceholder');

  const trackingCell = document.getElementById('ep-track-toggle')?.closest('.cell');
  if (trackingCell) {
    setTextContent(trackingCell.querySelector('.cell-title'), t('editProfile.trackingTitle'));
  }

  const logoutCell = screen.querySelector('.cell-title[style*="color:var(--ios-red)"]');
  setTextContent(logoutCell, t('editProfile.logout'));
}

function applySepeTranslations() {
  const screen = document.getElementById('s-sepe');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title'), 'SEPE');
  const body = screen.querySelector('.scroll > div');
  const card = body?.children?.[0];
  if (card) {
    const subtitle = card.querySelector('div[style*="font-size:13px;color:var(--label2);"]');
    const paragraphs = card.querySelectorAll('div[style*="font-size:15px;color:var(--label2)"], div[style*="font-size:13px;color:#b36200"]');
    setTextContent(subtitle, t('sepe.serviceSubtitle'));
    setTextContent(paragraphs[0], t('sepe.copy'));
    setInnerHtml(paragraphs[1], t('sepe.noteHtml'));
    setTextContent(card.querySelector('button'), t('sepe.open'));
  }

  setTextContent(body?.children?.[1], t('sepe.shortcuts'));
  const shortcutCells = body?.children?.[2]?.querySelectorAll('.cell');
  if (shortcutCells?.length >= 5) {
    const entries = [
      ['benefit', 'benefitCopy'],
      ['offers', 'offersCopy'],
      ['training', 'trainingCopy'],
      ['dossier', 'dossierCopy'],
      ['appointment', 'appointmentCopy']
    ];
    entries.forEach(([titleKey, subtitleKey], index) => {
      setTextContent(shortcutCells[index].querySelector('.cell-title'), t(`sepe.${titleKey}`));
      setTextContent(shortcutCells[index].querySelector('.cell-subtitle'), t(`sepe.${subtitleKey}`));
    });
  }
}

function applyJobsTranslations() {
  const screen = document.getElementById('s-jobs');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title-large'), t('jobs.title'));
  setPlaceholder('jobs-search', 'jobs.searchPlaceholder');
  setTextContent(document.getElementById('jobs-admin-label'), t('jobs.adminCreateLabel'));
  setTextContent(document.getElementById('jobs-admin-title'), t('jobs.adminTitle'));
  setTextContent(document.getElementById('jobs-admin-copy'), t('jobs.adminCopy'));
  setTextContent(document.getElementById('job-image-button'), t('jobs.imageButton'));
  setTextContent(document.getElementById('job-image-help'), t('jobs.imageHelp'));
  setTextContent(document.getElementById('job-save-btn'), t('jobs.saveAdmin'));

  setInputLabel('job-company', 'jobs.companyLabel');
  setInputLabel('job-title', 'jobs.titleLabel');
  setInputLabel('job-location', 'jobs.locationLabel');
  setInputLabel('job-salary', 'jobs.salaryLabel');
  setInputLabel('job-category', 'jobs.categoryLabel');
  setInputLabel('job-badge-label', 'jobs.badgeLabel');
  setInputLabel('job-badge-tone', 'jobs.badgeToneLabel');
  setInputLabel('job-type', 'jobs.typeLabel');
  setInputLabel('job-schedule', 'jobs.scheduleLabel');
  setInputLabel('job-mode', 'jobs.modeLabel');
  setInputLabel('job-summary', 'jobs.summaryLabel');
  setInputLabel('job-description', 'jobs.descriptionLabel');
  setInputLabel('job-requirements', 'jobs.requirementsLabel');
  setInputLabel('job-benefits', 'jobs.benefitsLabel');
  setInputLabel('job-contact', 'jobs.contactLabel');

  setPlaceholder('job-company', 'jobs.companyPlaceholder');
  setPlaceholder('job-title', 'jobs.titlePlaceholder');
  setPlaceholder('job-location', 'jobs.locationPlaceholder');
  setPlaceholder('job-salary', 'jobs.salaryPlaceholder');
  setPlaceholder('job-summary', 'jobs.summaryPlaceholder');
  setPlaceholder('job-description', 'jobs.descriptionPlaceholder');
  setPlaceholder('job-requirements', 'jobs.requirementsPlaceholder');
  setPlaceholder('job-benefits', 'jobs.benefitsPlaceholder');
  setPlaceholder('job-contact', 'jobs.contactPlaceholder');
}

function applyTownsTranslations() {
  const screen = document.getElementById('s-towns');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title-large'), t('towns.title'));
  setPlaceholder('towns-search', 'towns.searchPlaceholder');

  const statLabels = screen.querySelectorAll('.town-card-stat-label');
  if (statLabels.length >= 3) {
    statLabels[0].textContent = t('towns.inhabitants');
    statLabels[1].textContent = t('towns.profile');
    statLabels[2].textContent = t('towns.ineCode');
  }

  const actions = screen.querySelectorAll('#town-card .btn');
  if (actions.length >= 2) {
    actions[0].textContent = t('towns.moreDetails');
    actions[1].textContent = t('common.close');
  }
}

function applySavedTranslations() {
  const screen = document.getElementById('s-saved');
  if (!screen) return;
  setTextContent(screen.querySelector('.nav-title-large'), t('saved.title'));
}

function applyCommunitiesTranslations() {
  const screen = document.getElementById('s-communities');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title-large'), t('communities.title'));
  setTextContent(document.getElementById('communities-hero-title'), t('communities.heroTitle'));
  setTextContent(document.getElementById('communities-hero-copy'), t('communities.heroCopy'));
  setTextContent(document.getElementById('communities-create-label'), t('communities.createLabel'));
  setTextContent(document.getElementById('community-image-button'), t('communities.imageButton'));
  setTextContent(document.getElementById('community-image-help'), t('communities.imageHelp'));
  setTextContent(document.getElementById('communities-list-title'), t('communities.listTitle'));
  setTextContent(document.getElementById('community-save-btn'), t('communities.save'));

  setInputLabel('community-title', 'communities.titleLabel');
  setInputLabel('community-description', 'communities.descriptionLabel');
  setInputLabel('community-link', 'communities.linkLabel');
  setPlaceholder('community-title', 'communities.titlePlaceholder');
  setPlaceholder('community-description', 'communities.descriptionPlaceholder');
  setPlaceholder('community-link', 'communities.linkPlaceholder');
}

function applyAdminTranslations() {
  const screen = document.getElementById('s-admin');
  if (!screen) return;

  setTextContent(screen.querySelector('.nav-title'), t('admin.title'));
  const body = screen.querySelector('.scroll');
  if (body?.children?.length >= 4) {
    const card = body.children[0];
    setTextContent(card.children[0], t('admin.viewTitle'));
    setTextContent(card.children[1], t('admin.viewCopy'));

    const statLabels = body.children[1].querySelectorAll('.admin-stat-label');
    if (statLabels.length >= 2) {
      statLabels[0].textContent = t('admin.usersWithSignal');
      statLabels[1].textContent = t('admin.records');
    }
  }

  setTextContent(document.getElementById('admin-reset-view-btn'), t('admin.viewAll'));
  setTextContent(document.getElementById('admin-export-btn'), t('admin.downloadExcel'));
  setTextContent(document.getElementById('admin-selected-user-title'), t('admin.selectedRouteTitle'));
  setTextContent(document.getElementById('admin-selected-user-copy'), t('admin.selectedRouteEmpty'));
}

function applyModalTranslations() {
  const experiment = document.getElementById('experiment-modal');
  if (experiment) {
    setTextContent(experiment.querySelector('.modal-title'), t('experiment.title'));
    setTextContent(experiment.querySelector('.modal-copy'), t('experiment.copy'));
    setTextContent(experiment.querySelector('button'), t('experiment.button'));
  }

  const trackingInfo = document.getElementById('tracking-info-modal');
  if (trackingInfo) {
    setTextContent(trackingInfo.querySelector('.modal-title'), t('trackingInfo.title'));
    setTextContent(trackingInfo.querySelector('.modal-copy'), t('trackingInfo.copy'));
    setTextContent(trackingInfo.querySelector('button'), t('trackingInfo.button'));
  }

  const privacy = document.getElementById('privacy-modal');
  if (privacy) {
    const title = privacy.querySelector('div[style*="font-size:17px;font-weight:700"]');
    setTextContent(title, t('privacy.title'));
    setTextContent(privacy.querySelector('.btn-filled'), t('privacy.button'));
  }

  setTextContent(document.getElementById('notifications-modal-title'), t('notifications.title'));
}

function applyStructuredTranslations() {
  applySplashTranslations();
  applyLoginTranslations();
  applyOnboardTranslations();
  applyRegisterTranslations();
  applyHomeTranslations();
  applyEditProfileTranslations();
  applySepeTranslations();
  applyJobsTranslations();
  applyTownsTranslations();
  applyCommunitiesTranslations();
  applySavedTranslations();
  applyAdminTranslations();
  applyModalTranslations();
  applyTabTranslations();
  applyFilterTranslations();
  applySelectOptionTranslations();
}

function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

export function getLanguage() {
  return currentLanguage;
}

export function getIntlLocale() {
  return INTL_LOCALES[currentLanguage] || INTL_LOCALES.es;
}

export function t(key, params = {}) {
  const translated = getNestedValue(TRANSLATIONS[currentLanguage], key)
    ?? getNestedValue(TRANSLATIONS.es, key)
    ?? key;
  return interpolate(translated, params);
}

export function normalizeStatusValue(value) {
  if (!value) return '';
  if (STATUS_VALUES.includes(value)) return value;
  return STATUS_ALIASES[value] || '';
}

export function normalizeRegionValue(value) {
  if (!value) return '';
  if (REGION_VALUES.includes(value)) return value;
  return REGION_ALIASES[value] || value;
}

export function translateStatusValue(value) {
  const normalized = normalizeStatusValue(value);
  return normalized ? t(`status.${normalized}`) : String(value || '');
}

export function translateRegionValue(value) {
  const normalized = normalizeRegionValue(value);
  return normalized ? t(`regions.${normalized}`) : String(value || '');
}

export function translateLocationLabel(value) {
  const parts = String(value || '').split(',').map(part => part.trim());
  if (parts.length < 2) return String(value || '');

  const lastPart = parts[parts.length - 1];
  const translatedRegion = translateRegionValue(lastPart);
  parts[parts.length - 1] = translatedRegion || lastPart;
  return parts.join(', ');
}

export function setLanguage(language, persist = true) {
  const nextLanguage = isSupportedLanguage(language) ? language : 'es';
  currentLanguage = nextLanguage;

  if (persist) localStorage.setItem(LANGUAGE_KEY, nextLanguage);

  document.documentElement.lang = nextLanguage;
  document.documentElement.dir = RTL_LANGUAGES.has(nextLanguage) ? 'rtl' : 'ltr';
  applyStructuredTranslations();
  window.dispatchEvent(new CustomEvent('arraigo:language-changed', {
    detail: { language: nextLanguage }
  }));
}

export function initI18n() {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  currentLanguage = isSupportedLanguage(stored) ? stored : 'es';
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = RTL_LANGUAGES.has(currentLanguage) ? 'rtl' : 'ltr';
  applyStructuredTranslations();
}
