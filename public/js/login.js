document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const messageDiv = document.getElementById("message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evita recarga de página

    // Tomamos valores de los inputs
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Limpia mensajes
    messageDiv.innerHTML = "";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        messageDiv.innerHTML = `
          <div class="alert alert-danger" role="alert">
            ${data.message || "Error al iniciar sesión."}
          </div>
        `;
        return;
      }

      const token = data.token;

      // Guardar token y username
      localStorage.setItem("authToken", token);
      localStorage.setItem("username", username);

      messageDiv.innerHTML = `
  <div class="alert alert-success" role="alert">
    Inicio de sesión exitoso. Token guardado en localStorage.
  </div>
`;

      window.location.href = '/mensajes.html';
    } catch (error) {
      console.error("Error de red:", error);
      messageDiv.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Ocurrió un error de conexión. Intente de nuevo.
        </div>
      `;
    }
  });
});
