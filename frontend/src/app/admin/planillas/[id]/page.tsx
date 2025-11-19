'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminPlanillaService, type PlanillaDetalle } from '@/services/admin-planilla.service';
import { toast } from 'sonner';

export default function DetallePlanillaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [planilla, setPlanilla] = useState<PlanillaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [planillaId, setPlanillaId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setPlanillaId(p.id);
      cargarPlanilla(p.id);
    });
  }, []);

  const cargarPlanilla = async (id: string) => {
    try {
      setLoading(true);
      const data = await adminPlanillaService.obtenerDetallePlanilla(id);
      setPlanilla(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar planilla');
      router.push('/admin/planillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!planilla) return;

    try {
      await adminPlanillaService.actualizarEstado(planilla.id, nuevoEstado);
      toast.success(`Planilla marcada como ${nuevoEstado}`);
      cargarPlanilla(planillaId);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 mt-4">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  if (!planilla) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/planillas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-600" />
                Planilla - {planilla.periodo}
              </h1>
              <p className="text-gray-600 mt-1">{planilla.docente.nombreCompleto}</p>
            </div>
          </div>
          <Badge className={adminPlanillaService.getColorEstado(planilla.estado)}>
            {adminPlanillaService.formatearEstado(planilla.estado)}
          </Badge>
        </div>

        {/* Información del Docente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Docente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{planilla.docente.nombreCompleto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-medium">{planilla.docente.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Especialidad</p>
                <p className="font-medium">{planilla.docente.especialidad}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium">{planilla.docente.area}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Horas y Montos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Horas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Horas Regulares:</span>
                <span className="font-semibold">{planilla.horas.regulares.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horas Extras:</span>
                <span className="font-semibold text-blue-600">{planilla.horas.extras.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">{planilla.horas.total.toFixed(2)}h</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Montos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Base:</span>
                <span className="font-semibold">{adminPlanillaService.formatearMonto(planilla.montos.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bonificaciones:</span>
                <span className="font-semibold text-green-600">+{adminPlanillaService.formatearMonto(planilla.montos.bonificaciones)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descuentos:</span>
                <span className="font-semibold text-red-600">-{adminPlanillaService.formatearMonto(planilla.montos.descuentos)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total Neto:</span>
                <span className="font-bold text-lg text-green-600">
                  {adminPlanillaService.formatearMonto(planilla.montos.totalNeto)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        {planilla.estado === 'PENDIENTE' && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleCambiarEstado('EN_PROCESO')}
                >
                  Marcar En Proceso
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleCambiarEstado('PAGADO')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Pagado
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCambiarEstado('ANULADO')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular Planilla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalle Diario */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Horas</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Extras</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tardanza</th>
                  </tr>
                </thead>
                <tbody>
                  {planilla.detalle.map((dia, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{new Date(dia.fecha).toLocaleDateString('es-PE')}</td>
                      <td className="px-4 py-2 text-right">{dia.horasTrabajadas.toFixed(2)}h</td>
                      <td className="px-4 py-2 text-right text-blue-600">{dia.horasExtras.toFixed(2)}h</td>
                      <td className="px-4 py-2 text-right text-red-600">{dia.tardanzaMinutos} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
