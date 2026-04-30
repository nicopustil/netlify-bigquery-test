# Leadership Victoria · Marketing Dashboard

## Setup en Netlify

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Leadership Victoria Dashboard"
git remote add origin https://github.com/TU-USUARIO/lv-dashboard.git
git push -u origin main
```

### 2. Deploy en Netlify
1. netlify.com → New site from Git
2. Conectar tu repo
3. Build settings: dejar todo vacío (es HTML estático)
4. Deploy

### 3. Variables de entorno en Netlify
Site settings → Environment variables → Add variable:
```
Key:   GOOGLE_CREDENTIALS
Value: (pegar el contenido completo del JSON de la service account)
```

### 4. Links para compartir
- **HOP Agency (vos):** https://tu-site.netlify.app?token=HOP2024
- **Cliente (Leadership Victoria):** https://tu-site.netlify.app?token=LV2024

### 5. Para agregar un cliente nuevo
1. Crear nueva service account en Google Cloud
2. Nuevo repo con el mismo código
3. Cambiar project_id y dataset en bigquery.js
4. Deploy nuevo site en Netlify
5. Listo en 30 minutos

## Tokens
- `HOP2024` → Vista agencia (insights internos, notas)
- `LV2024` → Vista cliente (métricas limpias)
