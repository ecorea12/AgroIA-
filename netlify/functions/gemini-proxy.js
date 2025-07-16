// Guarda este código en: /netlify/functions/gemini-proxy.js

// Usamos 'node-fetch' para hacer llamadas de red en el entorno de Node.js de Netlify
// Netlify lo instalará automáticamente si lo detecta.
const fetch = require('node-fetch');

exports.handler = async function(event) {
  // Obtiene la clave de API de las variables de entorno seguras de Netlify.
  const { GEMINI_API_KEY } = process.env;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Solo permite peticiones de tipo POST para mayor seguridad.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Reenvía el cuerpo de la petición del frontend a la API de Gemini.
    const payload = JSON.parse(event.body);

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // Si la API de Gemini devuelve un error, lo pasamos al frontend.
    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      return { statusCode: response.status, body: JSON.stringify(errorBody) };
    }

    // Si todo va bien, devolvemos la respuesta de Gemini al frontend.
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    // Captura cualquier otro error (ej. JSON mal formado).
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error in Proxy' })
    };
  }
};
