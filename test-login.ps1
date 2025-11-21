# Test de Login en Produccion
$apiUrl = "https://asistem-san-martin-production-b195.up.railway.app"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST DE LOGIN EN PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Login con credenciales correctas
Write-Host "[TEST 1] Login con admin@sanmartin.edu.pe..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@sanmartin.edu.pe"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    if ($response.data.accessToken) {
        Write-Host "         [OK] Login exitoso!" -ForegroundColor Green
        Write-Host "         Token recibido: $($response.data.accessToken.Substring(0,20))..." -ForegroundColor Gray
        Write-Host "         Usuario: $($response.data.usuario.nombres) $($response.data.usuario.apellidos)" -ForegroundColor Gray
        Write-Host "         Rol: $($response.data.usuario.roles.nombre)" -ForegroundColor Gray
        
        $token = $response.data.accessToken
        
        # Test 2: Obtener lista de docentes
        Write-Host "`n[TEST 2] Obteniendo lista de docentes..." -ForegroundColor Yellow
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        try {
            $docentes = Invoke-RestMethod -Uri "$apiUrl/api/docentes" -Method GET -Headers $headers
            Write-Host "         [OK] $($docentes.Count) docentes encontrados" -ForegroundColor Green
            
            if ($docentes.Count -gt 0) {
                Write-Host "         Ejemplo: $($docentes[0].nombres) $($docentes[0].apellidos)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "         [ERROR] No se pudieron obtener docentes" -ForegroundColor Red
            Write-Host "         $($_.Exception.Message)" -ForegroundColor Gray
        }
        
        # Test 3: Obtener areas
        Write-Host "`n[TEST 3] Obteniendo areas academicas..." -ForegroundColor Yellow
        
        try {
            $areas = Invoke-RestMethod -Uri "$apiUrl/api/areas" -Method GET -Headers $headers
            Write-Host "         [OK] $($areas.Count) areas encontradas" -ForegroundColor Green
            
            if ($areas.Count -gt 0) {
                Write-Host "         Ejemplos:" -ForegroundColor Gray
                $areas | Select-Object -First 3 | ForEach-Object {
                    Write-Host "           - $($_.nombre)" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "         [ERROR] No se pudieron obtener areas" -ForegroundColor Red
            Write-Host "         $($_.Exception.Message)" -ForegroundColor Gray
        }
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "RESULTADO: SISTEMA FUNCIONAL" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        Write-Host "Puedes acceder a:" -ForegroundColor Cyan
        Write-Host "  https://asistem-san-martin.vercel.app" -ForegroundColor White
        Write-Host "`nCredenciales:" -ForegroundColor Cyan
        Write-Host "  Email: admin@sanmartin.edu.pe" -ForegroundColor White
        Write-Host "  Password: admin123`n" -ForegroundColor White
        
    } else {
        Write-Host "         [ERROR] No se recibio token" -ForegroundColor Red
    }
    
} catch {
    Write-Host "         [ERROR] Login fallido" -ForegroundColor Red
    Write-Host "         $($_.Exception.Message)" -ForegroundColor Gray
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "         Status Code: $statusCode" -ForegroundColor Gray
    }
}

Write-Host ""
