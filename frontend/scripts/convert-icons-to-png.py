#!/usr/bin/env python3
"""
🎨 CONVERTIDOR SVG A PNG DE ALTA CALIDAD
Convierte iconos SVG a PNG con antialiasing profesional
Requiere: pip install cairosvg pillow
"""

import os
from pathlib import Path

try:
    import cairosvg
    from PIL import Image
    import io
except ImportError:
    print("❌ Error: Instala las dependencias primero:")
    print("   pip install cairosvg pillow")
    exit(1)

# Directorio de iconos
icons_dir = Path(__file__).parent.parent / 'public' / 'icons'

# Tamaños a generar
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

print("🎨 Convirtiendo iconos SVG a PNG de alta calidad...\n")

for size in sizes:
    svg_file = icons_dir / f'icon-{size}x{size}.svg'
    png_file = icons_dir / f'icon-{size}x{size}.png'
    
    if not svg_file.exists():
        print(f"⚠️  {svg_file.name} no encontrado, saltando...")
        continue
    
    try:
        # Convertir SVG a PNG con alta calidad
        cairosvg.svg2png(
            url=str(svg_file),
            write_to=str(png_file),
            output_width=size,
            output_height=size,
            dpi=300  # Alta resolución
        )
        
        # Optimizar con Pillow
        img = Image.open(png_file)
        img = img.convert('RGBA')
        img.save(png_file, 'PNG', optimize=True, quality=100)
        
        print(f"✅ {png_file.name} ({size}x{size}px)")
        
    except Exception as e:
        print(f"❌ Error con {svg_file.name}: {e}")

print("\n🎉 ¡Conversión completada!")
print("\n📱 Los nuevos iconos están en:")
print(f"   {icons_dir}")
