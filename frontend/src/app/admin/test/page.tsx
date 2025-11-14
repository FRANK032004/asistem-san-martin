'use client';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Página de Prueba</h1>
      <p>Si ves esto, las rutas funcionan correctamente.</p>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
        ✅ Componente cargado exitosamente
      </div>
    </div>
  );
}
