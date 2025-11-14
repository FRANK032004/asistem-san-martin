#🚀 COMANDOS ASISTEM SAN MARTÍN

## 🛑 PARAR PROCESOS

### Parar Backend (Puerto 5000):
```powershell
$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process; Write-Host "✅ Backend detenido" } else { Write-Host "ℹ️ Backend no estaba corriendo" }
```

### Parar Frontend (Puerto 3000):
```powershell
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process; Write-Host "✅ Frontend detenido" } else { Write-Host "ℹ️ Frontend no estaba corriendo" }
```

### Parar Ambos Servicios:
```powershell
@(5000, 3000) | ForEach-Object { $port = $_; $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($process) { taskkill /f /pid $process; Write-Host "✅ Proceso en puerto $port detenido" } }
```

## 🚀 INICIAR SERVICIOS

### Ejecutar Backend:
```powershell
cd "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend"
npm run dev
```

### Iniciar Frontend:
```powershell
cd "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\frontend"  
npm run dev
```

### Iniciar Backend (desde cualquier directorio):
```powershell
& npm --prefix "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend" run dev
```

### Iniciar Frontend (desde cualquier directorio):
```powershell  
& npm --prefix "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\frontend" run dev
```

## 🔍 VERIFICAR ESTADO

### Verificar puertos activos:
```powershell
Get-NetTCPConnection -LocalPort 5000,3000 -ErrorAction SilentlyContinue | Format-Table LocalAddress,LocalPort,State,OwningProcess
```

### Probar Backend:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
```

### Probar Frontend:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Select-Object StatusCode, StatusDescription
```

## 🎯 SCRIPTS AUTOMATIZADOS CREADOS

### 📁 **SCRIPTS PRINCIPALES**
- **`menu_sistema.bat`** - ⭐ **MENÚ INTERACTIVO COMPLETO**
- **`iniciar_sistema_completo.bat`** - Inicia backend + frontend automáticamente
- **`detener_sistema.bat`** - Detiene todos los procesos
- **`verificar_estado.bat`** - Verificación completa del sistema

### 📁 **SCRIPTS INDIVIDUALES**
- **`solo_backend.bat`** - Solo backend (desarrollo)
- **`solo_frontend.bat`** - Solo frontend (desarrollo)

### 🚀 **USO RECOMENDADO**
1. **Para uso normal**: Ejecutar `menu_sistema.bat`
2. **Para inicio rápido**: Ejecutar `iniciar_sistema_completo.bat`
3. **Para verificación**: Ejecutar `verificar_estado.bat` 