/**
 * ============================================================
 * EJEMPLO DE IMPLEMENTACIÓN DE PAGINACIÓN
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 * Este archivo muestra cómo implementar la paginación profesional
 * en un endpoint existente
 */

import { Request, Response } from 'express';
import prisma from '../utils/database';
import {
  createPaginatedResponse,
} from '../shared/middleware/pagination.middleware';

/**
 * ==========================================================
 * ANTES (Sin paginación - RIESGO DE SOBRECARGA)
 * ==========================================================
 */
export const getDocentesSinPaginacion = async (_req: Request, res: Response) => {
  try {
    // ⚠️ PROBLEMA: Sin límite, puede devolver 10,000+ registros
    const docentes = await prisma.docentes.findMany({
      where: { estado: 'activo' },
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        areas: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: docentes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener docentes',
    });
  }
};

/**
 * ==========================================================
 * DESPUÉS (Con paginación profesional - OPTIMIZADO)
 * ==========================================================
 */

/**
 * Obtener docentes con paginación
 * 
 * @route GET /api/docentes
 * @query page - Número de página (default: 1)
 * @query limit - Items por página (default: 10, max: 100)
 * @query sort - Campo para ordenar (default: 'created_at')
 * @query order - Dirección (asc|desc, default: 'desc')
 * @query busqueda - Texto de búsqueda opcional
 * @query area - Filtro por área opcional
 * @query estado - Filtro por estado (activo|inactivo)
 * 
 * @example GET /api/docentes?page=2&limit=20&sort=nombres&order=asc&busqueda=juan
 */
export const getDocentesConPaginacion = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Obtener parámetros de paginación (agregados por middleware)
    const { skip, limit, sort, order } = req.pagination!;

    // 2️⃣ Construir filtros de búsqueda (opcionales)
    const { busqueda, area, estado } = req.query;
    
    const where: any = {};

    // Filtro por búsqueda (nombre o código)
    if (busqueda) {
      where.OR = [
        {
          usuarios: {
            nombres: {
              contains: busqueda as string,
              mode: 'insensitive',
            },
          },
        },
        {
          usuarios: {
            apellidos: {
              contains: busqueda as string,
              mode: 'insensitive',
            },
          },
        },
        {
          codigo_docente: {
            contains: busqueda as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filtro por área
    if (area && area !== 'todos') {
      where.area_id = parseInt(area as string);
    }

    // Filtro por estado
    if (estado && estado !== 'todos') {
      where.estado = estado as string;
    }

    // 3️⃣ Ejecutar queries en paralelo (más eficiente)
    const [docentes, totalCount] = await Promise.all([
      // Query de datos con paginación
      prisma.docentes.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort || 'created_at']: order,
        },
        include: {
          usuarios: {
            select: {
              nombres: true,
              apellidos: true,
              email: true,
              telefono: true,
            },
          },
          areas: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      }),
      // Query de conteo total
      prisma.docentes.count({ where }),
    ]);

    // 4️⃣ Formatear respuesta con metadata de paginación
    return res.json(
      createPaginatedResponse(docentes, totalCount, req.pagination!)
    );

  } catch (error) {
    console.error('Error al obtener docentes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener docentes',
    });
  }
};

/**
 * ==========================================================
 * COMPARACIÓN DE RESPONSES
 * ==========================================================
 */

/**
 * ANTES (Sin paginación):
 * {
 *   "success": true,
 *   "data": [10000 docentes...] // ⚠️ Puede crashear el navegador
 * }
 * 
 * Query time: 3000-5000ms ❌
 * Tamaño response: 5-10MB ❌
 * Memoria navegador: 100-300MB ❌
 */

/**
 * DESPUÉS (Con paginación):
 * {
 *   "success": true,
 *   "data": [20 docentes...], // ✅ Solo lo necesario
 *   "pagination": {
 *     "currentPage": 2,
 *     "pageSize": 20,
 *     "totalPages": 500,
 *     "totalItems": 10000,
 *     "hasNextPage": true,
 *     "hasPreviousPage": true
 *   }
 * }
 * 
 * Query time: 50-200ms ✅ (15-30x más rápido)
 * Tamaño response: 10-50KB ✅ (100x más pequeño)
 * Memoria navegador: 2-5MB ✅ (50x menos)
 */

/**
 * ==========================================================
 * CONFIGURACIÓN EN ROUTES
 * ==========================================================
 */

// ANTES:
// router.get('/docentes', authenticateToken, requireAdmin, getDocentesSinPaginacion);

// DESPUÉS:
// import { paginationMiddleware } from '../shared/middleware/pagination.middleware';
// router.get('/docentes', authenticateToken, requireAdmin, paginationMiddleware, getDocentesConPaginacion);

/**
 * ==========================================================
 * USO EN FRONTEND
 * ==========================================================
 */

/**
 * Ejemplo en React/Next.js:
 * 
 * ```typescript
 * const [page, setPage] = useState(1);
 * const [limit, setLimit] = useState(20);
 * 
 * const { data: response } = useQuery({
 *   queryKey: ['docentes', page, limit],
 *   queryFn: () => api.get(`/api/docentes?page=${page}&limit=${limit}`)
 * });
 * 
 * const { data: docentes, pagination } = response;
 * 
 * // Componente de paginación
 * <Pagination
 *   currentPage={pagination.currentPage}
 *   totalPages={pagination.totalPages}
 *   onPageChange={setPage}
 * />
 * ```
 */

/**
 * ==========================================================
 * OTROS ENDPOINTS PARA IMPLEMENTAR PAGINACIÓN
 * ==========================================================
 */

// Prioridad ALTA (más consultados):
// 1. GET /api/asistencias          ⚠️ Implementar YA
// 2. GET /api/usuarios             ⚠️ Implementar YA
// 3. GET /api/justificaciones      ⚠️ Implementar YA

// Prioridad MEDIA:
// 4. GET /api/reportes             ⏳ Próximamente
// 5. GET /api/horarios             ⏳ Próximamente
// 6. GET /api/logs-actividad       ⏳ Próximamente

/**
 * ==========================================================
 * TESTING DE PAGINACIÓN
 * ==========================================================
 */

/**
 * Ejemplo de test con Jest + Supertest:
 * 
 * ```typescript
 * describe('GET /api/docentes - Paginación', () => {
 *   it('debe devolver 20 docentes en página 1', async () => {
 *     const response = await request(app)
 *       .get('/api/docentes?page=1&limit=20')
 *       .set('Authorization', `Bearer ${adminToken}`)
 *       .expect(200);
 * 
 *     expect(response.body.data).toHaveLength(20);
 *     expect(response.body.pagination.currentPage).toBe(1);
 *     expect(response.body.pagination.pageSize).toBe(20);
 *   });
 * 
 *   it('debe respetar el límite máximo de 100', async () => {
 *     const response = await request(app)
 *       .get('/api/docentes?page=1&limit=200') // Intenta 200
 *       .set('Authorization', `Bearer ${adminToken}`)
 *       .expect(200);
 * 
 *     expect(response.body.pagination.pageSize).toBe(100); // Máximo 100
 *   });
 * 
 *   it('debe manejar página inválida', async () => {
 *     const response = await request(app)
 *       .get('/api/docentes?page=-1&limit=10')
 *       .set('Authorization', `Bearer ${adminToken}`)
 *       .expect(200);
 * 
 *     expect(response.body.pagination.currentPage).toBe(1); // Corrige a 1
 *   });
 * });
 * ```
 */

export default {
  // Exportar para comparación
  sinPaginacion: getDocentesSinPaginacion,
  conPaginacion: getDocentesConPaginacion,
};
