# 📋 ESCENARIOS COMPLETOS: REGISTRO DE ASISTENCIA GPS

## 🎯 OBJETIVO
Manejar TODOS los escenarios posibles al registrar entrada/salida con GPS, proporcionando retroalimentación clara al usuario en cada caso.

---

## ✅ ESCENARIOS DE ÉXITO

### 1. Registro de Entrada Exitoso
**Condiciones:**
- ✅ Usuario autenticado como DOCENTE
- ✅ Geolocalización habilitada en navegador
- ✅ GPS con precisión < 100m
- ✅ Ubicación dentro del radio permitido (50-500m según config)
- ✅ Dentro del horario asignado
- ✅ No ha registrado entrada hoy

**Flujo:**
1. Click en "Registrar Entrada"
2. Toast: "📍 Obteniendo ubicación GPS..."
3. GPS obtiene coordenadas
4. Sistema valida ubicación y horario
5. Guarda en BD con timestamp
6. Toast: "✅ Entrada registrada exitosamente"
7. Animación de éxito (3 segundos)
8. Dashboard se actualiza automáticamente

**Respuesta Backend:**
```json
{
  "success": true,
  "message": "Entrada registrada exitosamente",
  "data": {
    "id": "uuid",
    "fecha": "2025-11-11",
    "hora_entrada": "08:15:30",
    "estado": "PRESENTE",
    "tardanza_minutos": 0
  }
}
```

---

### 2. Registro de Salida Exitoso
**Condiciones:**
- ✅ Ya registró entrada hoy
- ✅ Ubicación dentro del radio permitido
- ✅ No ha registrado salida aún

**Flujo:** Similar a entrada
**Respuesta:** Confirma hora de salida

---

## ❌ ESCENARIOS DE ERROR

### 1. 📍 Fuera del Área Permitida (MÁS COMÚN)
**Código Error:** 400
**Mensaje Backend:** "Ubicación fuera del rango permitido" o "Fuera del rango permitido"

**Causas:**
- Usuario está a >50m de la institución (o radio configurado)
- GPS marca ubicación incorrecta temporalmente
- Usuario intenta registrar desde casa/otro lugar

**Manejo Frontend:**
```typescript
Toast Error: "📍 Fuera del área permitida"
Descripción: "No estás dentro del rango permitido de la institución. 
              Acércate más al edificio principal."
Duración: 7 segundos
```

**Detalles mostrados al usuario:**
- Ubicación más cercana detectada
- Distancia actual
- Radio permitido
- Metros de exceso

**Ejemplo mensaje backend:**
```
📍 Fuera del rango permitido.

Ubicación más cercana: IESTP SAN MARTIN DE PORRES
Tu distancia: 245m
Radio permitido: 50m
Exceso: 195m

Acércate 195m más a la ubicación permitida.
```

**Soluciones para el usuario:**
1. Acercarse físicamente a la institución
2. Verificar que GPS esté activo
3. Intentar en exterior (mejor señal)
4. Contactar con administración si hay error de configuración

---

### 2. ⚠️ Entrada/Salida Ya Registrada
**Código Error:** 409 (Conflict)
**Mensaje Backend:** "Ya has registrado tu entrada el día de hoy"

**Manejo Frontend:**
```typescript
Toast Warning: "⚠️ Entrada ya registrada"
Descripción: "Ya tienes tu entrada del día registrada."
Duración: 5 segundos
```

**Prevención:**
- Botón se deshabilita automáticamente después del registro
- Cambia a verde claro con texto "Entrada ya registrada ✓"
- Estado se valida al cargar dashboard

---

### 3. 🚫 Sin Entrada Previa (solo para Salida)
**Código Error:** 404
**Mensaje Backend:** "No tienes una entrada registrada para el día de hoy"

**Manejo Frontend:**
```typescript
Toast Error: "⚠️ Sin entrada registrada"
Descripción: "Primero debes registrar tu entrada antes de registrar la salida."
Duración: 6 segundos
```

**Prevención UI:**
- Botón "Registrar Salida" deshabilitado si no hay entrada
- Texto: "Primero registra entrada"
- Icono AlertCircle en lugar de CheckCircle

---

### 4. ⏰ Fuera de Horario
**Código Error:** 400
**Mensaje Backend:** "Fuera de horario de trabajo asignado"

**Manejo Frontend:**
```typescript
Toast Error: "⏰ Fuera de horario"
Descripción: [mensaje específico del backend]
Duración: 6 segundos
```

**Causas:**
- Intento antes de horario de entrada permitido
- Intento después de fin de jornada
- No tiene horario para hoy (fin de semana, feriado)

---

### 5. 📅 Sin Horario Asignado
**Código Error:** 400
**Mensaje Backend:** "No tienes horario asignado para hoy"

**Manejo Frontend:**
```typescript
Toast Error: "📅 Sin horario asignado"
Descripción: "No tienes un horario asignado para hoy. 
              Contacta con administración."
Duración: 6 segundos
```

**Solución:** Usuario debe contactar con RR.HH./Admin

---

### 6. 📡 Precisión GPS Insuficiente
**Código Error:** 400
**Mensaje Backend:** Error relacionado con precisión

**Manejo Frontend:**
```typescript
// Warning si precisión > 100m (no bloquea)
Toast Warning: "⚠️ Precisión GPS baja"
Descripción: "Precisión: 145m. Se recomienda estar en exterior."

// Error si precisión muy baja (bloquea)
Toast Error: "📡 Error de GPS"
Descripción: "La precisión del GPS es insuficiente. 
              Intenta en un lugar más abierto."
```

**Soluciones:**
- Salir al exterior
- Alejarse de edificios altos
- Esperar mejor señal GPS
- Verificar permisos de ubicación

---

### 7. 🚫 Geolocalización No Disponible
**Detección:** `!navigator.geolocation`

**Manejo Frontend:**
```typescript
Toast Error: "Geolocalización no disponible"
Descripción: "Tu navegador no soporta geolocalización"
Duración: 5 segundos
```

**Causas:**
- Navegador antiguo sin soporte GPS
- Funcionalidad deshabilitada en navegador
- Modo incógnito en iOS

**Soluciones:**
- Actualizar navegador
- Usar Chrome/Edge/Firefox moderno
- Activar ubicación en configuración

---

### 8. 🔒 Permisos de Ubicación Denegados
**Código Error GPS:** `PERMISSION_DENIED` (code: 1)

**Manejo Frontend:**
```typescript
Toast Error: "❌ Error al obtener ubicación"
Descripción: "Permisos de ubicación denegados. 
              Activa el acceso en configuración del navegador."
```

**Soluciones:**
1. Chrome: Ícono 🔒 en barra dirección → Permisos → Ubicación → Permitir
2. Firefox: Ícono (i) → Permisos → Ubicación → Permitir
3. Edge: Similar a Chrome

---

### 9. ⏱️ Timeout GPS (15 segundos)
**Código Error GPS:** `TIMEOUT` (code: 3)

**Manejo Frontend:**
```typescript
Toast Error: "❌ Error al obtener ubicación"
Descripción: "Tiempo de espera agotado. 
              Verifica tu conexión GPS e intenta nuevamente."
```

**Causas:**
- GPS tardando en conectar
- Señal GPS débil
- Interior de edificio

---

### 10. 🌍 Ubicación No Disponible
**Código Error GPS:** `POSITION_UNAVAILABLE` (code: 2)

**Manejo Frontend:**
```typescript
Toast Error: "❌ Error al obtener ubicación"
Descripción: "No se pudo determinar tu ubicación. 
              Verifica que GPS esté activado."
```

---

### 11. 🔐 Sesión Expirada
**Código Error:** 401 (Unauthorized)

**Manejo Frontend:**
```typescript
Toast Error: "Sesión expirada"
Descripción: "Por favor, inicia sesión nuevamente."
```

**Acción:** Redirección automática a `/login`

---

### 12. ⚠️ Error de Servidor
**Código Error:** 500 (Internal Server Error)

**Manejo Frontend:**
```typescript
Toast Error: "❌ Error del servidor"
Descripción: "Ocurrió un error inesperado. 
              Intenta nuevamente o contacta con soporte."
```

---

### 13. 📶 Sin Conexión a Internet
**Detección:** Network error, no response

**Manejo Frontend:**
```typescript
Toast Error: "❌ Sin conexión"
Descripción: "No hay conexión a internet. 
              Verifica tu red e intenta nuevamente."
```

---

## 🎨 ESTADOS VISUALES DEL BOTÓN

### Botón "Registrar Entrada"

**Estado Normal:**
```
Color: Verde (bg-green-600)
Icono: CheckCircle
Texto: "Registrar Entrada"
Enabled: true
```

**Estado Obteniendo GPS:**
```
Color: Verde
Icono: Spinner animado
Texto: "Obteniendo GPS..."
Enabled: false (disabled)
```

**Estado Registrando:**
```
Color: Verde
Icono: Spinner animado
Texto: "Registrando..."
Enabled: false (disabled)
```

**Estado Ya Registrado:**
```
Color: Verde claro
Icono: CheckCircle
Texto: "Entrada ya registrada ✓"
Enabled: false (disabled)
Cursor: not-allowed
```

---

### Botón "Registrar Salida"

**Estado Normal (sin entrada):**
```
Color: Rojo opaco
Icono: AlertCircle
Texto: "Primero registra entrada"
Enabled: false (disabled)
```

**Estado Normal (con entrada):**
```
Color: Rojo (bg-red-600)
Icono: XCircle
Texto: "Registrar Salida"
Enabled: true
```

**Estado Ya Registrado:**
```
Color: Rojo claro
Icono: CheckCircle
Texto: "Salida ya registrada ✓"
Enabled: false (disabled)
```

---

## 🧪 CASOS DE PRUEBA

### Test 1: Usuario en Casa (FUERA DE RANGO)
```
Ubicación: Casa del usuario
Distancia: >500m del instituto
Resultado Esperado: Toast "📍 Fuera del área permitida"
Botón: Se mantiene habilitado para reintentar
```

### Test 2: Usuario en Instituto (DENTRO DE RANGO)
```
Ubicación: Instituto
Distancia: <50m
Resultado Esperado: Toast "✅ Entrada registrada"
Botón: Cambia a "Entrada ya registrada ✓"
```

### Test 3: Intentar Registrar Dos Veces
```
Acción: Click en "Registrar Entrada" después de ya haber registrado
Resultado Esperado: Botón deshabilitado, no permite click
```

### Test 4: Registrar Salida sin Entrada
```
Acción: Click en "Registrar Salida" sin haber registrado entrada
Resultado Esperado: Botón deshabilitado desde el inicio
```

### Test 5: GPS sin Permisos
```
Acción: Denegar permisos de ubicación
Resultado Esperado: Toast "Permisos denegados"
Instrucciones de cómo activar
```

### Test 6: Sin Conexión Internet
```
Acción: Desconectar WiFi, intentar registrar
Resultado Esperado: Toast "Sin conexión"
```

### Test 7: Precisión GPS Baja
```
GPS accuracy: >100m
Resultado Esperado: Warning pero permite continuar
```

---

## 🔧 CONFIGURACIÓN BACKEND

### Radio GPS Recomendado por Tipo de Institución:

```sql
-- Institución pequeña (1-2 edificios)
UPDATE ubicaciones_permitidas SET radio_metros = 100;

-- Institución mediana (campus pequeño)
UPDATE ubicaciones_permitidas SET radio_metros = 200;

-- Institución grande (campus extenso)
UPDATE ubicaciones_permitidas SET radio_metros = 500;

-- SOLO PARA DESARROLLO/PRUEBAS
UPDATE ubicaciones_permitidas SET radio_metros = 5000; -- 5km
```

### Precisión GPS Aceptable:
- **Óptima:** < 20m
- **Buena:** 20-50m
- **Aceptable:** 50-100m
- **Warning:** >100m (muestra advertencia pero permite)
- **Rechazo:** >200m (configurable)

---

## 📊 MÉTRICAS A MONITOREAR

1. **Tasa de éxito de registros:** >95%
2. **Errores por ubicación fuera de rango:** < 5% (usuarios legítimos)
3. **Timeout GPS:** < 2%
4. **Rechazos por precisión:** < 1%
5. **Tiempo promedio de registro:** < 10 segundos

---

## 🎯 MEJORAS FUTURAS

1. **Modo Offline:** Guardar registro localmente y sincronizar después
2. **Mapa de Ubicación:** Mostrar mapa con área permitida
3. **Historial de Intentos:** Registrar intentos fallidos para análisis
4. **Notificaciones Push:** Recordar registro al llegar a la institución
5. **Foto Obligatoria:** Captura facial al registrar (anti-fraude)
6. **QR Code Alternativo:** Backup si GPS falla
7. **Asistencia Manual:** Proceso de excepción para casos especiales

---

## 📝 DOCUMENTACIÓN TÉCNICA

### Frontend: `src/app/docente/page.tsx`
- Líneas 96-184: `handleRegistrarEntrada`
- Líneas 195-243: `handleRegistrarSalida`
- Manejo completo de errores con 7 escenarios distintos

### Backend: `src/modules/docente/controllers/docente.controller.ts`
- Validación GPS en GPSValidator
- Radio configurable por ubicación
- Mensajes descriptivos en español

### Base de Datos: `ubicaciones_permitidas`
```sql
CREATE TABLE ubicaciones_permitidas (
  id UUID PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  radio_metros INT NOT NULL DEFAULT 100,
  activo BOOLEAN DEFAULT true
);
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Manejo de ubicación fuera de rango
- [x] Manejo de entrada ya registrada
- [x] Manejo de salida sin entrada
- [x] Manejo de permisos GPS denegados
- [x] Manejo de timeout GPS
- [x] Manejo de precisión insuficiente
- [x] Manejo de errores de red
- [x] Manejo de sesión expirada
- [x] Estados visuales del botón
- [x] Animaciones de éxito
- [x] Toast notifications descriptivos
- [x] Recarga automática de dashboard
- [x] Validación de horarios
- [x] Logs para debugging
- [x] Documentación completa

---

**Última actualización:** 11 de noviembre de 2025
**Versión:** 1.0
**Autor:** Sistema de Asistencia San Martín
