# ✅ CHECKLIST DE TESTING - MÓDULO JUSTIFICACIONES

**Fecha:** 12 de Noviembre 2025  
**Tester:** Senior Developer  
**Sistema:** ASISTEM San Martín - Módulo Docente

---

## 🎯 OBJETIVO
Validar que el módulo de Justificaciones funcione correctamente end-to-end antes de continuar con otros módulos.

---

## 🔐 PRE-REQUISITOS

### ✅ Sistema Corriendo
- [ ] Backend en puerto 5000
- [ ] Frontend en puerto 3000
- [ ] Base de datos conectada
- [ ] Usuario docente disponible: `docente.prueba@sanmartin.edu.pe`

---

## 📋 TESTING FUNCIONAL

### 1. LOGIN Y ACCESO
- [ ] **TC-001**: Login exitoso con credenciales de docente
- [ ] **TC-002**: Redirección correcta a `/docente` dashboard
- [ ] **TC-003**: Menú lateral muestra "Justificaciones"
- [ ] **TC-004**: Click en "Justificaciones" navega a `/docente/justificaciones`

### 2. VISTA PRINCIPAL - LISTADO
- [ ] **TC-005**: Página carga sin errores en consola
- [ ] **TC-006**: Muestra mensaje "No hay justificaciones" si está vacío
- [ ] **TC-007**: Botón "Nueva Justificación" visible y funcional
- [ ] **TC-008**: Tabs de filtro funcionan (Todas, Pendiente, Aprobada, Rechazada)

### 3. CREAR JUSTIFICACIÓN - VALIDACIONES FRONTEND
- [ ] **TC-009**: Modal/Form se abre al click en "Nueva Justificación"
- [ ] **TC-010**: Fecha inicio requerida (campo obligatorio)
- [ ] **TC-011**: Fecha fin requerida (campo obligatorio)
- [ ] **TC-012**: Fecha fin no puede ser anterior a fecha inicio
- [ ] **TC-013**: Rango de fechas no puede exceder 30 días
- [ ] **TC-014**: Tipo requerido (dropdown con 5 opciones)
- [ ] **TC-015**: Motivo requerido (mínimo 20 caracteres)
- [ ] **TC-016**: Motivo requiere al menos 5 palabras
- [ ] **TC-017**: Motivo máximo 1000 caracteres
- [ ] **TC-018**: Campo evidenciaUrl opcional (URL válida)
- [ ] **TC-019**: Campo afectaPago opcional (checkbox)

### 4. CREAR JUSTIFICACIÓN - CASO EXITOSO
- [ ] **TC-020**: Crear justificación MÉDICA con datos válidos
  ```
  Fecha inicio: 2025-11-10
  Fecha fin: 2025-11-10
  Tipo: MEDICA
  Motivo: "Tuve que asistir a consulta médica por dolor de cabeza persistente que requirió atención inmediata"
  ```
- [ ] **TC-021**: Toast de éxito se muestra
- [ ] **TC-022**: Justificación aparece en la lista
- [ ] **TC-023**: Estado inicial es "PENDIENTE"
- [ ] **TC-024**: Fecha se muestra correctamente formateada

### 5. CREAR JUSTIFICACIÓN - VALIDACIONES BACKEND
- [ ] **TC-025**: No permite solapamiento de fechas
  - Crear justificación 2025-11-10 al 2025-11-12
  - Intentar crear otra 2025-11-11 al 2025-11-13
  - Debe fallar con mensaje "Ya existe una justificación en el periodo..."
  
- [ ] **TC-026**: No permite rango mayor a 30 días
  - Fecha inicio: 2025-10-01
  - Fecha fin: 2025-11-05
  - Debe fallar con mensaje "El rango no puede exceder 30 días"
  
- [ ] **TC-027**: Motivo debe tener al menos 20 caracteres
  - Intentar con "Consulta médica" (17 chars)
  - Debe fallar con mensaje de validación

### 6. LISTAR JUSTIFICACIONES - FILTROS
- [ ] **TC-028**: Filtro "Todas" muestra todas las justificaciones
- [ ] **TC-029**: Filtro "Pendiente" muestra solo pendientes
- [ ] **TC-030**: Filtro "Aprobada" muestra solo aprobadas
- [ ] **TC-031**: Filtro "Rechazada" muestra solo rechazadas
- [ ] **TC-032**: Contador de cada tab es correcto

### 7. VER DETALLE DE JUSTIFICACIÓN
- [ ] **TC-033**: Click en una justificación abre detalle
- [ ] **TC-034**: Muestra todos los campos correctamente:
  - Fecha inicio y fin
  - Tipo formateado (ej: "Médica")
  - Motivo completo
  - Estado con badge de color
  - Fecha de creación
- [ ] **TC-035**: Botones "Editar" y "Eliminar" visibles solo si PENDIENTE

### 8. EDITAR JUSTIFICACIÓN
- [ ] **TC-036**: Solo se puede editar si estado es PENDIENTE
- [ ] **TC-037**: Modal de edición se abre con datos pre-cargados
- [ ] **TC-038**: Modificar motivo funciona correctamente
- [ ] **TC-039**: Cambiar tipo funciona correctamente
- [ ] **TC-040**: Ajustar fechas funciona correctamente
- [ ] **TC-041**: Validaciones aplican igual que en crear
- [ ] **TC-042**: Guardar cambios actualiza la lista
- [ ] **TC-043**: Toast de éxito al actualizar

### 9. ELIMINAR JUSTIFICACIÓN
- [ ] **TC-044**: Solo se puede eliminar si estado es PENDIENTE
- [ ] **TC-045**: Modal de confirmación aparece
- [ ] **TC-046**: Confirmar elimina correctamente
- [ ] **TC-047**: Justificación desaparece de la lista
- [ ] **TC-048**: Toast de éxito al eliminar
- [ ] **TC-049**: Cancelar no elimina

### 10. ESTADÍSTICAS
- [ ] **TC-050**: Endpoint `/api/docente/justificaciones/estadisticas` funciona
- [ ] **TC-051**: Retorna contadores correctos:
  - Total
  - Pendientes
  - Aprobadas
  - Rechazadas
- [ ] **TC-052**: Los contadores actualizan al crear/eliminar

### 11. TIPOS DE JUSTIFICACIÓN
- [ ] **TC-053**: Crear justificación MÉDICA
- [ ] **TC-054**: Crear justificación PERSONAL
- [ ] **TC-055**: Crear justificación FAMILIAR
- [ ] **TC-056**: Crear justificación CAPACITACIÓN
- [ ] **TC-057**: Crear justificación OTRO
- [ ] **TC-058**: Cada tipo muestra descripción correcta en dropdown

### 12. CASOS EDGE
- [ ] **TC-059**: Crear justificación con fecha de HOY
- [ ] **TC-060**: Crear justificación con rango exacto de 30 días
- [ ] **TC-061**: Motivo con exactamente 20 caracteres
- [ ] **TC-062**: Motivo con exactamente 1000 caracteres
- [ ] **TC-063**: Crear múltiples justificaciones para diferentes fechas
- [ ] **TC-064**: Navegar entre páginas sin perder filtros

---

## 🔄 TESTING DE INTEGRACIÓN

### 13. BACKEND ENDPOINTS
- [ ] **TC-065**: `POST /api/docente/justificaciones` - Status 201
- [ ] **TC-066**: `GET /api/docente/justificaciones` - Status 200
- [ ] **TC-067**: `GET /api/docente/justificaciones/:id` - Status 200
- [ ] **TC-068**: `PUT /api/docente/justificaciones/:id` - Status 200
- [ ] **TC-069**: `DELETE /api/docente/justificaciones/:id` - Status 200
- [ ] **TC-070**: `GET /api/docente/justificaciones/estadisticas` - Status 200

### 14. AUTENTICACIÓN
- [ ] **TC-071**: Acceso sin token retorna 401
- [ ] **TC-072**: Token inválido retorna 403
- [ ] **TC-073**: Docente solo ve SUS justificaciones
- [ ] **TC-074**: No puede editar justificaciones de otro docente

### 15. BASE DE DATOS
- [ ] **TC-075**: Registro se crea en tabla `justificaciones`
- [ ] **TC-076**: Campo `docente_id` es correcto
- [ ] **TC-077**: Campo `estado` inicial es "pendiente"
- [ ] **TC-078**: Timestamps `created_at` y `updated_at` funcionan
- [ ] **TC-079**: Soft delete (si aplica) funciona correctamente

---

## 🎨 TESTING UI/UX

### 16. DISEÑO Y RESPONSIVIDAD
- [ ] **TC-080**: Página responsive en móvil (< 768px)
- [ ] **TC-081**: Página responsive en tablet (768-1024px)
- [ ] **TC-082**: Página responsive en desktop (> 1024px)
- [ ] **TC-083**: Formulario usable en pantalla pequeña
- [ ] **TC-084**: Tabla/cards se adaptan correctamente

### 17. ACCESIBILIDAD
- [ ] **TC-085**: Navegación por teclado funciona (Tab, Enter)
- [ ] **TC-086**: Campos tienen labels asociados
- [ ] **TC-087**: Errores se muestran claramente
- [ ] **TC-088**: Colores tienen suficiente contraste

### 18. FEEDBACK AL USUARIO
- [ ] **TC-089**: Loading spinner mientras carga datos
- [ ] **TC-090**: Loading en botón "Guardar" mientras procesa
- [ ] **TC-091**: Mensajes de error claros y útiles
- [ ] **TC-092**: Toasts desaparecen automáticamente
- [ ] **TC-093**: Estados disabled en botones apropiados

---

## 🐛 TESTING DE ERRORES

### 19. MANEJO DE ERRORES
- [ ] **TC-094**: Error de red muestra mensaje apropiado
- [ ] **TC-095**: Error 500 del backend se maneja gracefully
- [ ] **TC-096**: Validación de campos muestra mensajes específicos
- [ ] **TC-097**: Token expirado redirige a login
- [ ] **TC-098**: No crashea si backend está offline

### 20. CASOS NEGATIVOS
- [ ] **TC-099**: Intentar crear con campos vacíos
- [ ] **TC-100**: Intentar editar justificación aprobada (debe fallar)
- [ ] **TC-101**: Intentar eliminar justificación rechazada (debe fallar)
- [ ] **TC-102**: SQL injection en campos de texto (debe estar protegido)
- [ ] **TC-103**: XSS en motivo (debe estar sanitizado)

---

## 📊 RESULTADOS

### Resumen de Testing
```
Total Test Cases: 103
✅ Passed: ___
❌ Failed: ___
⏭️ Skipped: ___
🐛 Bugs Found: ___

Pass Rate: ____%
```

### Bugs Críticos Encontrados
```
1. [CRITICAL] - Descripción del bug
2. [HIGH] - Descripción del bug
3. [MEDIUM] - Descripción del bug
```

### Mejoras Sugeridas
```
1. [UX] - Mejorar...
2. [PERFORMANCE] - Optimizar...
3. [SECURITY] - Agregar...
```

---

## 🚀 APROBACIÓN PARA PRODUCCIÓN

### Criterios de Aceptación
- [ ] Mínimo 95% de test cases pasados
- [ ] 0 bugs críticos
- [ ] 0 bugs de seguridad
- [ ] Performance aceptable (< 3s carga inicial)
- [ ] Responsive funcional en 3 tamaños de pantalla

### Firma de Aprobación
```
Tester: _________________
Fecha: _________________
Estado: ☐ APROBADO  ☐ RECHAZADO  ☐ PENDIENTE
```

---

## 📝 NOTAS ADICIONALES

### Configuración de Testing
- **Browser:** Chrome/Edge
- **Dispositivos:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Network:** Fast 3G, 4G, WiFi
- **Backend:** Development environment
- **Database:** Test data seeded

### Datos de Prueba
```
Usuario: docente.prueba@sanmartin.edu.pe
Password: password123
Docente ID: [UUID del docente de prueba]
```

---

**IMPORTANTE:** No pasar a la siguiente fase hasta que este módulo esté 100% validado y sin bugs críticos.
