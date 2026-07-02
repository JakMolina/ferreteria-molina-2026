const userInput = document.getElementById('username');
const passInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin') || document.querySelector('button');
const errorMsg = document.getElementById('msg');

document.addEventListener('DOMContentLoaded', () => {
    if (!window.api) {
        alert("ERROR CRÍTICO: Preload no cargado. Revisa la consola.");
        if(btnLogin) btnLogin.disabled = true;
    }
});

const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', handleLogin);
} else if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
}

async function handleLogin(e) {
    if(e) e.preventDefault();
    
    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) {
        showError("Por favor, ingrese usuario y contraseña.");
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Verificando...";
    if(errorMsg) errorMsg.textContent = "";

    try {
        console.log("Enviando credenciales...");
        const result = await window.api.auth.login({ username, password });
        console.log("Respuesta login:", result);

        if (result.success) {
            btnLogin.textContent = "Ingresando...";
            sessionStorage.setItem('user', JSON.stringify(result.user));
            sessionStorage.setItem('permissions', JSON.stringify(result.user.permissions));

            console.log("Navegando a Home...");
            await window.api.navigation.goTo("home/index.html");
            
        } else {
            showError(result.message);
            resetButton();
        }

    } catch (error) {
        console.error("Error en login:", error);
        showError("No se pudo conectar con el sistema.");
        resetButton();
    }
}

function resetButton() {
    btnLogin.disabled = false;
    btnLogin.textContent = "Ingresar al Sistema";
}

function showError(msg) {
    if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.color = "#dc2626";
        errorMsg.style.display = 'block';
    } else {
        alert(msg);
    }
}