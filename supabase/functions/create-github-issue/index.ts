// supabase/functions/create-github-issue/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Definimos los valores exactos que esperamos del formulario
type TipoDeCambio = 'Nuevo Requerimiento' | 'Sugerencia de mejora' | 'Defecto/Error';

interface ReportData {
  titulo: string;
  solicitadoPor: string;
  telefono?: string;
  descripcionCambio: string;
  motivoCambio: string;
  tipoCambio: TipoDeCambio; // Usamos el tipo definido
  prioridad: string;
  email?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
    const GITHUB_REPO = Deno.env.get('GITHUB_REPO')

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      throw new Error('Faltan secretos de GitHub (TOKEN o REPO) en Supabase.')
    }

    const reportData: ReportData = await req.json()
    const issueTitle = `[FSC-Usuario]: ${reportData.titulo}`
    
    // --- NUEVA LÓGICA DE ETIQUETAS DINÁMICAS ---
    
    // Siempre incluimos 'reporte-usuario'
    const labels = ['reporte-usuario'];

    // Añadimos la etiqueta correcta según el tipo de cambio
    switch (reportData.tipoCambio) {
      case 'Defecto/Error':
        labels.push('bug');
        break;
      case 'Nuevo Requerimiento':
        labels.push('feature');
        break;
      case 'Sugerencia de mejora':
        labels.push('enhancement');
        break;
      default:
        // No añadir nada si el tipo no coincide
        break;
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    const issueBody = `
**Reporte generado automáticamente desde la aplicación.**

---

### 1. Información del Solicitante
* **Solicitado por:** ${reportData.solicitadoPor}
* **Email del Usuario:** ${reportData.email || 'No proporcionado'}
* **Teléfono:** ${reportData.telefono || 'No proporcionado'}

### 2. Detalles del Reporte
* **Naturaleza del Cambio:** ${reportData.tipoCambio}
* **Prioridad Solicitada:** ${reportData.prioridad}

### 3. Descripción
${reportData.descripcionCambio}

### 4. Justificación
${reportData.motivoCambio}
    `

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/issues`
    
    const githubRequest = {
      title: issueTitle,
      body: issueBody,
      labels: labels // <-- Usamos nuestro array dinámico 'labels'
    }

    const response = await fetch(githubApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(githubRequest),
    })

    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Error de GitHub API:', errorBody)
      throw new Error(`Error al crear el issue: ${response.statusText}`)
    }

    const responseData = await response.json()

    return new Response(JSON.stringify({ message: 'Issue creado con éxito', url: responseData.html_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})