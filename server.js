import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getPool } from './db.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Para leer JSON del body
app.use(express.json());

// Servir archivos estáticos de la carpeta public
app.use(express.static('public'));

// Endpoint para login (proxy hacia la API de autenticación)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Construimos el JSON tal como lo pide la API
    const payload = {
      Username: username,  // SOLO la parte antes de @miumg.edu.gt
      Password: password
    };

    const apiUrl =
      process.env.AUTH_API_URL ||
      'https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate';

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Aquí suponemos que la API regresa un token tipo Bearer
    // Por si viene con distinto nombre, probamos varias
    const data = response.data;
    const token = data.token || data.Token || data.access_token || data.AccessToken;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'No se recibió token en la respuesta de la API.'
      });
    }

    // Devolvemos el token al front
    return res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error autenticando:', error.response?.data || error.message);

    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas o error en el servidor externo.',
      error: error.response?.data || error.message
    });
  }
});

// NUEVA RUTA: Envío de mensajes protegidos
app.post('/api/mensajes', async (req, res) => {
  try {
    const { codSala, loginEmisor, contenido } = req.body;

    // Leemos el header Authorization que viene del front
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Falta cabecera Authorization con Token Bearer.'
      });
    }

    const payload = {
      Cod_Sala: codSala ?? 0,
      Login_Emisor: loginEmisor,
      Contenido: contenido
    };

    const apiUrl =
      process.env.MENSAJES_API_URL ||
      'https://backcvbgtmdesa.azurewebsites.net/api/Mensajes';

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // reenviamos el mismo Bearer token
      }
    });

    // Devolvemos la respuesta de la API al front
    return res.json({
      success: true,
      apiResponse: response.data
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje a la API externa.',
      error: error.response?.data || error.message
    });
  }
});

//listar mensajes del chat de forma cronológica
app.get('/api/mensajes/list', async (req, res) => {
  try {
    const pool = await getPool();

    // Traemos los mensajes ordenados por fecha (más recientes al final)
    const result = await pool.request().query(`
      SELECT 
        ID_Mensaje,
        Cod_Sala,
        Login_Emisor,
        Contenido,
        Fecha_Envio,
        Estado
      FROM dbo.Chat_Mensaje
      ORDER BY Fecha_Envio DESC;  -- ASC O DESC
    `);

    return res.json({
      success: true,
      mensajes: result.recordset
    });
  } catch (error) {
    console.error('Error consultando mensajes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los mensajes desde SQL Server.',
      error: error.message
    });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
