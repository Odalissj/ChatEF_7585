// public/js/mensajes.js
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  const loginEmisorInput = document.getElementById('loginEmisor');
  const form = document.getElementById('messageForm');
  const statusDiv = document.getElementById('messageStatus');
  const listaMensajesDiv = document.getElementById('listaMensajes');

  // Validar que haya token y usuario
  if (!token || !username) {
    alert('No hay sesión activa. Debe iniciar sesión primero.');
    window.location.href = '/';
    return;
  }

  // Mostrar login del emisor (solo usuario, como en la BD)
  loginEmisorInput.value = username;

  // ==========================
  //  SERIE III: cargar mensajes
  // ==========================
  async function cargarMensajes() {
    // Solo tocamos el contenido de la lista, no los títulos
    listaMensajesDiv.innerHTML = '<div class="text-muted">Cargando mensajes...</div>';

    try {
      const resp = await fetch('/api/mensajes/list');
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        listaMensajesDiv.innerHTML = `
          <div class="text-danger">
            No se pudieron cargar los mensajes.
          </div>
        `;
        return;
      }

      const mensajes = data.mensajes;

      if (!mensajes.length) {
        listaMensajesDiv.innerHTML = `
          <div class="text-muted">
            No hay mensajes registrados.
          </div>
        `;
        return;
      }

      // Construimos la lista. Si el backend ya ordena DESC, los nuevos van arriba.
      listaMensajesDiv.innerHTML = '';
      mensajes.forEach((m) => {
        const fecha = new Date(m.Fecha_Envio);

        const item = document.createElement('div');
        item.className = 'list-group-item';

        item.innerHTML = `
          <div class="d-flex justify-content-between">
            <strong>${m.Login_Emisor}</strong>
            <span class="text-muted">
              ${fecha.toLocaleString()}
            </span>
          </div>
          <div class="mt-1">
            ${m.Contenido}
          </div>
          <div class="mt-1">
            <span class="badge bg-${m.Estado === 'A' ? 'success' : 'secondary'}">
              Estado: ${m.Estado}
            </span>
            <span class="badge bg-light text-dark ms-1">
              Sala: ${m.Cod_Sala}
            </span>
          </div>
        `;

        listaMensajesDiv.appendChild(item);
      });

      // Si algún día cambias a ASC, puedes hacer scroll al final:
      // listaMensajesDiv.scrollTop = listaMensajesDiv.scrollHeight;

    } catch (error) {
      console.error('Error cargando mensajes:', error);
      listaMensajesDiv.innerHTML = `
        <div class="text-danger">
          Error de conexión al cargar mensajes.
        </div>
      `;
    }
  }

  // Cargar mensajes al abrir la página
  cargarMensajes();

  // ==========================
  //  SERIE II: Envío de mensajes
  // ==========================
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusDiv.innerHTML = '';

    const codSala = parseInt(document.getElementById('codSala').value, 10) || 0;
    const contenido = document.getElementById('contenido').value.trim();

    if (!contenido) {
      statusDiv.innerHTML = `
        <div class="alert alert-warning" role="alert">
          El contenido del mensaje no puede estar vacío.
        </div>
      `;
      return;
    }

    try {
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token Bearer CRÍTICO
        },
        body: JSON.stringify({
          codSala,
          loginEmisor: username,
          contenido
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        statusDiv.innerHTML = `
          <div class="alert alert-danger" role="alert">
            ${data.message || 'Error al enviar el mensaje.'}
          </div>
        `;
        return;
      }

      statusDiv.innerHTML = `
        <div class="alert alert-success" role="alert">
          Mensaje enviado correctamente.
        </div>
      `;

      // Limpiar textarea
      document.getElementById('contenido').value = '';

      // Volver a cargar mensajes para ver el nuevo
      cargarMensajes();
    } catch (error) {
      console.error('Error de red:', error);
      statusDiv.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Ocurrió un error de conexión. Intente de nuevo.
        </div>
      `;
    }
  });
});
