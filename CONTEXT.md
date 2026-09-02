# CONTEXT.md — MultiQuiz (MultiTables)

Este documento contiene el contexto completo de arquitectura, diseño, lógica de negocio, modelo de datos y convenciones técnicas del proyecto **MultiQuiz** (repositorio `MultiTables`). Sirve como guía de referencia central tanto para desarrolladores como para modelos de lenguaje e inteligencias artificiales que colaboren en el mantenimiento o evolución de la aplicación.

---

## 1. Visión General del Proyecto

- **Nombre de la Aplicación:** MultiQuiz (MultiTables)
- **Objetivo:** Aplicación web interactiva, educativa y gamificada diseñada para que estudiantes aprendan, repasen y dominen las tablas de multiplicar del 1 al 12 con retroalimentación inmediata, selección inteligente de preguntas y estadísticas de progreso persistentes.
- **Tipo de Aplicación:** Single Page Application (SPA) ligera basada en estándares web nativos (HTML5, Vanilla JS, CSS3) complementada con Tailwind CSS.
- **Idioma principal de la interfaz:** Español.

---

## 2. Stack Tecnológico

| Tecnología | Rol | Detalles / Configuración |
| :--- | :--- | :--- |
| **HTML5** | Estructura semántica | Estructura de vistas, encabezado, modales y accesibilidad básica. |
| **Vanilla JavaScript (ES6+)** | Lógica de negocio y estado | Manipulación directa del DOM, algoritmos de generación de quiz, gestión de eventos y persistencia en cliente. |
| **Tailwind CSS (CDN)** | Motor de estilos y maquetación | Incluido vía CDN (`https://cdn.tailwindcss.com`) con modo oscuro (`darkMode: 'class'`), extensión de fuentes y paleta personalizada. |
| **Vanilla CSS (`styles.css`)** | Estilos complementarios y animaciones | Gradiente de fondo global, animaciones (`fadeIn`), efectos de botón (`btn-press`), hover cards (`card-hover`) y estilos personalizados para la barra de desplazamiento. |
| **Google Fonts** | Tipografía | `Fredoka One` (títulos, números y display) y `Nunito` (cuerpo de texto y lectura). |
| **LocalStorage API** | Persistencia local | Guardado de estadísticas de aciertos y errores por tabla y multiplicador. |

---

## 3. Estructura de Archivos del Repositorio

```
MultiTables/
├── index.html        # Estructura principal, definición de vistas (secciones), cabecera y modal
├── script.js         # Configuración de Tailwind, estado global, navegación y lógica de toda la app
├── styles.css        # Reglas CSS adicionales, fuentes, animaciones y scrollbar oscuro
├── README.md         # Documentación de presentación para usuarios finales
└── CONTEXT.md        # Documento de contexto arquitectónico y técnico (este archivo)
```

### Detalle de Archivos:

- **[`index.html`](file:///c:/Users/Rod/Desktop/code/MultiTables/index.html):**
  - Define la clase `dark` en el tag `<html>` estableciendo modo oscuro permanente con fondo `bg-slate-900`.
  - Header fijo con barra de navegación (`Estudio`, `Quiz`, `Estadísticas`).
  - Secciones con la clase `.view-section` que se alternan mediante la clase utilitaria `hidden`.
  - Contenedor modal `#error-modal` para inspección detallada de errores por operación.

- **[`styles.css`](file:///c:/Users/Rod/Desktop/code/MultiTables/styles.css):**
  - Fondo global con gradiente (`#0f172a` a `#1e293b`).
  - Clases de utilidad interactiva: `.card-hover` (elevación y escala suave) y `.btn-press` (retroalimentación táctil con `transform: scale(0.95)`).
  - Animación `@keyframes fadeIn` para transiciones fluidas entre pantallas.
  - Personalización de la barra de desplazamiento de WebKit acorde al tema oscuro.

- **[`script.js`](file:///c:/Users/Rod/Desktop/code/MultiTables/script.js):**
  - Punto de entrada y orquestador único de la aplicación.
  - Contiene las constantes de diseño (`TABLE_COLORS`), estado de navegación (`currentView`), estado del quiz (`quizState`) e historial (`stats`).

---

## 4. Arquitectura y Vistas de la Aplicación

La navegación funciona como un enrutador SPA manual en el cliente. La función `navTo(viewId)` oculta todas las secciones con `.view-section`, quita la clase `hidden` de la vista solicitada y añade la animación `fade-in`.

### Vistas Disponibles:

1. **Modo Estudio (`view-estudio`):**
   - **Sub-vista Menú (`estudio-menu`):** Renderiza una cuadrícula de 12 tarjetas (tablas del 1 al 12), cada una con su color temático distintivo.
   - **Sub-vista Detalle (`estudio-detail`):** Muestra la tabla seleccionada en formato vertical del 1 al 12 ($N \times 1$ hasta $N \times 12$), permitiendo regresar al menú con un botón animado.

2. **Configuración del Quiz (`view-quiz-config`):**
   - **Paso 1: Selección de tablas:** Checkboxes interactivos para las tablas disponibles.
     - *Botón "Todas":* Activa o desactiva la selección completa.
     - *Botón "✨ Inteligente":* Analiza los registros históricos y preselecciona automáticamente las 3 tablas con peor ratio de acierto / más errores.
   - **Paso 2: Tipo de preguntas (Banco de preguntas):**
     - *Todas las Combinaciones:* Práctica balanceada regular.
     - *🎯 Solo Fallos Frecuentes (Repaso):* Extrae únicamente las multiplicaciones con fallos registrados en las tablas seleccionadas. Incluye un badge que contabiliza en tiempo real cuántos fallos existen para practicar.
   - **Paso 3: Longitud del quiz:** Radio buttons para seleccionar 10, 20 o 30 preguntas.
   - **Paso 4: Modo de juego:**
     - *Escribir Respuesta (Entrada Directa):* Elimina las alternativas y requiere digitar el número exacto usando el teclado en pantalla o físico.
     - *4 Opciones:* Alternativas tradicionales de opción múltiple.
   - **Botón "¡Empezar a Jugar! / ¡Repasar X Fallos!":** Se habilita dinámicamente según la cantidad de tablas y fallos disponibles.

3. **Quiz Activo (`view-quiz-active`):**
   - Cronómetro activo en tiempo real (`⏱️ 00.0s`).
   - Barra de progreso interactiva con porcentaje acumulado.
   - Contador de pregunta (`Pregunta X de Y`).
   - Presentación de la operación en tamaño display grande (orden conmutativo aleatorio, ej.: $7 \times 8$ u $8 \times 7$).
   - **Interfaz según el modo seleccionado:**
     - *Modo Entrada Directa:* Display visual de respuesta con cursor parpadeante, teclado numérico táctil en pantalla (dígitos 0-9, borrar `⌫`, limpiar `C` y botón Enviar) y captura automática de pulsaciones del teclado físico (0-9, Backspace, Escape, Enter).
     - *Modo 4 Opciones:* Cuadrícula de 4 botones de opción múltiple con distractores creíbles.
   - **Feedback instantáneo:**
     - **Acierto:** Resaltado en verde, mensaje informativo con el puntaje obtenido y tiempo de resolución (ej. `✓ ¡Correcto! +1,450 pts (1.2s)`), avance en 750ms.
     - **Fallo:** Resaltado en rojo, feedback indicando el resultado correcto exacto (`✗ Era 56`), penalización de puntuación y avance en 1250ms.
   - **Botón "📌 Guardar para reforzar y pasar" (Atajo: tecla `R`):**
     - Permite al usuario archivar voluntariamente la pregunta actual para entrenamiento posterior sin trabarse ni adivinar por azar.
     - Registra la operación en el banco de fallos (`stats[a][b].errores++`), muestra la solución en un badge ámbar durante 850ms y avanza fluidamente a la siguiente pregunta.

4. **Resultados del Quiz (`view-quiz-results`):**
   - Emblema e ícono dinámico según precisión y velocidad:
     - 100% y < 2.5s promedio: ⚡ *¡Velocidad Relámpago!*
     - 100%: 🌟 *¡Puntaje Perfecto!*
     - $\ge 80\%$: 🎖️ *¡Excelente trabajo!*
     - $\ge 50\%$: 👍 *¡Buen desempeño!*
     - $< 50\%$: 💪 *¡Sigue practicando!*
   - Indicador del modo jugado y tipo de banco (`result-mode-badge`), e.g.: `🎯 Repaso de Fallos • Escribir Respuesta (Entrada Directa)`.
   - Métricas clave en 4 tarjetas:
     - **Aciertos:** $P / N$
     - **Tiempo Total:** Minutos y segundos transcurridos.
     - **Velocidad:** Tiempo promedio por pregunta en segundos.
     - **Puntuación:** Puntos ponderados acumulados (base + bonos por velocidad - penalización por error).
   - Récord personal: Guarda y notifica si se ha superado la mejor puntuación histórica (`multiplicar_best_score_[mode]_[length]`).
   - Desglose detallado por tabla estudiada durante la sesión (preguntas respondidas vs. aciertos).
   - Acciones para repetir el quiz con la misma configuración o regresar a la configuración.

5. **Estadísticas Generales (`view-estadisticas`):**
   - Botón directo **🎯 Repasar todos los fallos**: Lanza una sesión focalizada inmediata con todas las operaciones falladas del historial.
   - Tabla con el historial acumulado:
     - Tabla del número.
     - Total de preguntas contestadas históricamente.
     - Total de aciertos.
     - Total de fallos (con botón interactivo 🔍 para abrir desglose).
     - Barra de progreso coloreada según porcentaje de precisión ($<50\%$ rojo, $50-79\%$ amarillo, $\ge 80\%$ verde).
   - Estado vacío cuando no existen datos registrados aún.
   - Botón de reinicio completo de estadísticas con diálogo de confirmación.

6. **Modal de Desglose de Errores (`error-modal`):**
   - Se activa al hacer clic en el conteo de errores de cualquier tabla en la vista de estadísticas.
   - Lista desglosada de las combinaciones específicas falladas (por ejemplo: $7 \times 8 = 56 \to 3 \text{ errores}$), ordenadas de mayor a menor frecuencia de error.
   - Botón directo **🎯 Practicar estos fallos**: Inicia de inmediato un quiz concentrado exclusivamente en los fallos de la tabla abierta en el modal.


---

## 5. Modelo de Datos y Estado Global

### 5.1. Historial de Estadísticas (`stats`)
Se almacena bajo la clave `multiplicar_stats` en `localStorage` en formato JSON con la siguiente estructura anidada:

```typescript
interface MultiplierStat {
  aciertos: number;
  errores: number;
}

interface StatsStorage {
  [tableNumber: number]: {
    [multiplier: number]: MultiplierStat;
  };
}
```

*Ejemplo de dato guardado:*
```json
{
  "7": {
    "8": { "aciertos": 5, "errores": 2 },
    "9": { "aciertos": 4, "errores": 0 }
  }
}
```

### 5.2. Estado del Quiz Activo (`quizState`)
Almacenado en memoria durante la ejecución de la partida:

```javascript
let quizState = {
  tables: [],            // Array con las tablas seleccionadas (ej. [3, 7, 8])
  length: 10,            // 10, 20 o 30
  mode: 'input',         // 'input' (Entrada directa) o 'options' (4 alternativas)
  pool: 'all',           // 'all' (Todas las combinaciones) o 'errors' (Solo fallos frecuentes)
  questions: [],         // Array de preguntas [{ a, b, f1, f2, options: [...] }]
  currentIndex: 0,       // Pregunta actual (0-indexed)
  score: 0,              // Cantidad de aciertos acumulados
  errorsCount: 0,        // Cantidad de fallos cometidos
  tableBreakdown: {},    // Desglose por tabla: { [tableNum]: { q: totalPreguntas, c: correctas } }
  isActive: false,       // Bandera de quiz en curso
  waiting: false,        // Bloqueo temporal entre preguntas
  currentInputValue: '', // Valor ingresado en el input numérico
  startTime: null,       // Timestamp de inicio del quiz
  timerInterval: null,   // Identificador del temporizador activo
  questionStartTime: null, // Timestamp al cargar la pregunta actual
  questionTimes: [],     // Tiempos individuales en segundos por pregunta
  totalPoints: 0         // Puntuación acumulada ponderada
};
```

### 5.3. Historial de Alternancia Conmutativa (`multiplicar_orientations`)
Para evitar que una misma operación se repita de forma idéntica (ej. `7 × 6` seguido de `7 × 6`), el sistema mantiene un registro persistente del último orden mostrado para cada par no idéntico $\{a, b\}$ con clave `min_max`:
- Si la última vez se mostró de forma ascendente (`6 × 7`), la siguiente aparición se invierte a descendente (`7 × 6`).
- Si la última vez fue descendente (`7 × 6`), la siguiente aparición se invierte a ascendente (`6 × 7`).
- La alternancia se aplica en la secuencia final de cada quiz y persiste entre partidas en `localStorage.multiplicar_orientations`.

### 5.4. Paleta Cromática (`TABLE_COLORS`)
Cada una de las 12 tablas tiene asignado un esquema de color predeterminado para tarjetas, bordes, badges y acentos:

| Tabla | Tonalidad Tailwind | Color Hex |
| :---: | :--- | :--- |
| **1** | Red | `#f87171` |
| **2** | Orange | `#fb923c` |
| **3** | Amber | `#fbbf24` |
| **4** | Lime | `#a3e635` |
| **5** | Green | `#4ade80` |
| **6** | Emerald | `#34d399` |
| **7** | Teal | `#2dd4bf` |
| **8** | Cyan | `#22d3ee` |
| **9** | Blue | `#60a5fa` |
| **10** | Indigo | `#818cf8` |
| **11** | Purple | `#c084fc` |
| **12** | Pink | `#f472b6` |

---

## 6. Lógica de Negocio y Algoritmos Clave

### 6.1. Reglas de Exclusión Pedagógica
En `script.js`, **las tablas del 1 y del 10 se excluyen del Quiz y de los distractores principales** (`renderQuizCheckboxes`, `selectSmartTables`, `generateQuestions`), ya que multiplicar por 1 o por 10 es trivial para el grupo objetivo y suele sesgar los resultados de aprendizaje. La tabla del 1 y del 10 permanecen completamente visibles y accesibles en el **Modo Estudio** y en la visualización de estadísticas si existen registros.

### 6.2. Generación Ponderada de Preguntas (`generateQuestions`)
El generador no crea preguntas de forma puramente uniforme; utiliza un sistema de pesos basado en el historial:
- Cada combinación $(a \times b)$ parte con un peso base de `1`.
- Si existen estadísticas registradas con fallos, el peso aumenta dinámicamente:
  $$\text{peso} = 1 + \left(\frac{\text{errores}}{\text{total} + 1}\right) \times 3$$
- Se realiza un muestreo aleatorio ponderado (ruleta), priorizando las multiplicaciones donde el usuario falla más frecuentemente.

### 6.3. Generador de Distractores Creíbles (`generateOptions`)
Para generar las 3 opciones incorrectas junto con la correcta:
- Se crea un conjunto `Set` garantizando 4 valores únicos mayores a cero.
- Se calculan variaciones cercanas ($\pm 1$ a $\pm 5$).
- Para números mayores a 12, se añaden perturbaciones basadas en factores cuadráticos o múltiplos adyacentes para que los distractores parezcan resultados plausibles de errores matemáticos comunes.
- El array final se desordena con el algoritmo Fisher-Yates.

### 6.4. Selección Inteligente (`selectSmartTables`)
Calcula la tasa de error por tabla:
$$\text{tasa de error} = \frac{\sum \text{errores}}{\sum \text{preguntas}}$$
Si no hay datos, asigna un valor neutral de 0.5 con una pequeña variación pseudoaleatoria. Ordena de mayor a menor y selecciona las 3 tablas críticas.

---

## 7. Principios de Diseño y UI/UX

1. **Dark Mode Primero:** La aplicación está diseñada con paleta `slate-900` / `slate-800` / `slate-700`, ofreciendo alto contraste para sesiones prolongadas sin fatiga visual.
2. **Micro-interacciones y Feedback Táctil:**
   - Animaciones breves en botones y tarjetas (`btn-press`, `card-hover`).
   - Transiciones de opacidad y escala en diálogos y cambio de vistas.
3. **Responsive Design:**
   - Compatible desde pantallas móviles (320px) hasta monitores de escritorio.
   - Navegación adaptativa mediante Flexbox y CSS Grid.
4. **Gamificación Positiva:**
   - Mensajes motivacionales independientemente del resultado.
   - No hay penalización de tiempo estresante en la versión actual; se prioriza la asimilación conceptual.

---

## 8. Guía para Desarrollo y Modificaciones con IA (Guidelines)

Al realizar tareas de programación en este repositorio:

1. **Mantener la simplicidad arquitectónica:**
   - La aplicación funciona directamente abriendo `index.html` en el navegador (sin necesidad de bundlers como Webpack o Vite, a menos que el usuario solicite explícitamente una migración).
   - No añadir librerías pesadas externas innecesarias para funcionalidades que el navegador resuelve de forma nativa.
2. **Consistencia de Estilos con Tailwind y Clases Existentes:**
   - Emplear las clases de color ya definidas (`TABLE_COLORS` y gama `slate-*`).
   - Usar `font-display` para números grandes, títulos y destaques; usar `font-body` o estilos heredados para textos informativos.
3. **Preservar la Estructura de `localStorage`:**
   - Si se añade nueva información a las estadísticas (por ejemplo: tiempos de respuesta o fechas), asegurar retrocompatibilidad con registros existentes verificando la existencia previa de claves.
4. **Validaciones en el DOM:**
   - Asegurar que cualquier nuevo elemento interactivo cuente con IDs o selectores claros para pruebas y accesibilidad.

---

## 9. Roadmap de Posibles Mejoras Futuras

- **Efectos de Sonido / Audio Feedback:** Sonidos Web Audio API sintetizados (sin archivos externos pesados) para acierto y error.
- **Modo Contrarreloj (Speed Run):** Quiz con temporizador por pregunta o tiempo total.
- **Soporte PWA (Progressive Web App):** Archivo `manifest.json` y Service Worker para uso 100% offline e instalación en dispositivos móviles.
- **Exportar / Importar Progreso:** Descarga y subida de un archivo JSON con las estadísticas del estudiante.
- **Modo Multijugador Local o Reto en Parejas:** Pantalla compartida para competir en turnos.
