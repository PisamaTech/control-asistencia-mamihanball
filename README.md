# MamiHandball - Control de Asistencia

Aplicación web moderna para la gestión de asistencias de equipos de handball con reconocimiento facial automático mediante inteligencia artificial.

## 🏐 Características Principales

### Gestión de Jugadoras
- Registro completo de jugadoras con nombre, apellido, número de camiseta y posición
- Almacenamiento de hasta 3 fotos de referencia por jugadora
- Reconocimiento facial automático con face-api.js
- Búsqueda y filtrado de jugadoras
- Estados activo/inactivo para gestión de plantel

### Control de Asistencias
- Registro de sesiones (prácticas y partidos)
- Reconocimiento automático de asistencia mediante foto grupal
- Verificación y ajuste manual de asistencias detectadas
- Selector de fecha con calendario en español
- Campo de notas para cada sesión
- Historial completo de sesiones

### Dashboard y Reportes
- Panel de control con métricas del equipo
- Promedio de asistencia del equipo
- Top 3 jugadoras con mejor asistencia
- Sesiones recientes
- Reportes personalizables por período (semana, mes, 3 meses)
- Filtros por tipo de sesión (todas, prácticas, partidos)
- Exportación de reportes a PDF
- Visualización de rendimiento individual con gráficos de progreso

## 🚀 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **HeroUI v2** - Componentes de interfaz
- **Tailwind CSS** - Framework de estilos
- **face-api.js** - Reconocimiento facial

### Backend & Servicios
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de imágenes
- **Firebase Authentication** - Autenticación de usuarios

### Herramientas de Desarrollo
- **Vitest** - Framework de testing
- **ESLint** - Linter de código
- **PostCSS** - Procesador de CSS

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Firebase (plan Blaze recomendado para producción)

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd control-asistencia-mamihanball
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con tu configuración de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

1. Construir la aplicación:
```bash
npm run build
```

2. Exportar para hosting estático (Firebase Hosting):
```bash
npm run export
```

3. Desplegar en Firebase:
```bash
firebase deploy
```

## 🧪 Testing

Ejecutar tests:
```bash
npm test
```

Ejecutar tests con cobertura:
```bash
npm run test:coverage
```

## 📁 Estructura del Proyecto

```
control-asistencia-mamihanball/
├── public/
│   ├── models/              # Modelos de face-api.js
│   └── manifest.json        # Configuración PWA
├── src/
│   ├── app/
│   │   ├── (protected)/     # Rutas protegidas
│   │   │   ├── dashboard/
│   │   │   ├── players/
│   │   │   ├── sessions/
│   │   │   └── reports/
│   │   ├── layout.tsx       # Layout principal
│   │   ├── page.tsx         # Página de login
│   │   └── providers.tsx    # Providers de la app
│   ├── components/          # Componentes reutilizables
│   ├── lib/                 # Utilidades y configuración
│   │   ├── firebase.ts
│   │   ├── faceRecognition.ts
│   │   └── imageCompressor.ts
│   └── services/            # Servicios de datos
│       ├── playerService.ts
│       ├── sessionService.ts
│       ├── reportsService.ts
│       └── dashboardService.ts
├── firestore.rules          # Reglas de seguridad Firestore
├── firebase.json            # Configuración Firebase
└── package.json
```

## 🔐 Configuración de Firestore

Las reglas de seguridad básicas están en `firestore.rules`. Asegúrate de configurar la autenticación y las reglas según tus necesidades de seguridad.

## 📱 PWA (Progressive Web App)

La aplicación está configurada como PWA y puede instalarse en dispositivos móviles. El manifest está en `public/manifest.json`.

## 🎨 Personalización

### Colores del tema
Los colores principales se pueden modificar en `tailwind.config.js` y `src/app/globals.css`.

### Idioma
La aplicación está configurada para español (es-AR). Los providers de internacionalización están en `src/app/providers.tsx`.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para reportar problemas o solicitar nuevas características, por favor abre un issue en el repositorio.

---

Desarrollado con ❤️ para el equipo MamiHandball
