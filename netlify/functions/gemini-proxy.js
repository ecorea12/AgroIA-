// Guarda este código en: /netlify/functions/gemini-proxy.js
// Esta versión no necesita 'node-fetch'.

exports.handler = async function(event) {
  // Obtiene la clave de API de las variables de entorno seguras de Netlify.
  const { GEMINI_API_KEY } = process.env;
  
  // Verifica si la clave de API está configurada.
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'La clave de API no está configurada en el servidor.' })
    };
  }

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Solo permite peticiones de tipo POST.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Reenvía el cuerpo de la petición del frontend a la API de Gemini usando el 'fetch' nativo.
    const payload = JSON.parse(event.body);

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Devuelve la respuesta de Gemini (sea exitosa o de error) al frontend.
    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };

  } catch (error) {
    // Captura cualquier otro error.
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno en el servidor proxy.' })
    };
  }
};
