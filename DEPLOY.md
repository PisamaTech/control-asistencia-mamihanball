# Pasos para Desplegar a Firebase

## 1. Construir el proyecto
```bash
npm run build
```

## 2. Verificar que los archivos se generaron correctamente
```bash
ls out/_next/static/css/
```
Deberías ver un archivo CSS generado (ej: `91702bdf3dbd0c14.css`)

## 3. Desplegar a Firebase
```bash
firebase deploy
```

## Solución de problemas

Si los estilos aún no se cargan:

1. **Verificar en la consola del navegador**: Abre las herramientas de desarrollador (F12) y ve a la pestaña "Network". Busca el archivo CSS y verifica si se está cargando con un error 404 o 200.

2. **Limpiar caché**:
   - En Chrome/Edge: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
   - O abre en modo incógnito

3. **Verificar que se desplegaron todos los archivos**:
   - Ve a tu sitio de Firebase Hosting
   - Revisa que la carpeta `_next/static/css/` contenga los archivos CSS

4. **Reconstruir desde cero**:
```bash
# Limpiar
rm -rf .next out

# Reconstruir
npm run build

# Redesplegar
firebase deploy
```
