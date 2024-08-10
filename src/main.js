// main.js
class User {
    //los pongo dentro de los parametros porque se los voy a pedir al cliente
    constructor(nombre, username, password) {
        this.nombre = nombre;
        this.username = username;
        this.password = password;
    }

    static createUser(nombre, username, password, role) {
        if (localStorage.getItem(username)) {
            throw new Error('Usuario ya existe');
        }
        if (role === 'admin') {
            return new AdminUser(nombre, username, password);
        } else {
            return new RegularUser(nombre, username, password);
        }
    }

    singUp() {
        localStorage.setItem(this.username, JSON.stringify(this));
    }

    static login(username, password) {
        const user = JSON.parse(localStorage.getItem(username));
        if (user && user.password === password) {
            return user.role === 'admin' ? new AdminUser(user.nombre, user.username, user.password) : new RegularUser(user.nombre, user.username, user.password);
        }
        return null;
    }
}

class RegularUser extends User {
    constructor(nombre, username, password) {
        super(nombre, username, password);
        this.role = 'user';
    }

    createBooking(reserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas.push({ ...reserva, usuario: this.username });
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }
}

class AdminUser extends User {
    constructor(nombre, username, password) {
        super(nombre, username, password);
        this.role = 'admin';
    }

    createBooking(reserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas.push(reserva);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }

    deleteBooking(id) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas = reservas.filter(reserva => reserva.id !== id);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }

    updateBooking(id, nuevaReserva) {
        let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
        reservas = reservas.map(reserva => reserva.id === id ? { ...reserva, ...nuevaReserva } : reserva);
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }
}

class Auth {
    static login(username, password) {
        const user = User.login(username, password);
        if (user) {
            localStorage.setItem('session', JSON.stringify(user));
            return user;
        }
        return null;
    }

    static cerrarSesion() {
        localStorage.removeItem('session');
    }

    static obtenerUsuarioActual() {
        return JSON.parse(localStorage.getItem('session'));
    }
}

// Aquí manejamos el DOM
document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const nombre = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const usuario = User.createUser(nombre, username, password, role);
        usuario.singUp();
        alert('Usuario registrado exitosamente');
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const usuario = Auth.login(username, password);
    if (usuario) {
        displayBookings();
        document.getElementById('auth').style.display = 'none';
        document.getElementById('bookings').style.display = 'block';
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

document.getElementById('logout').addEventListener('click', function () {
    Auth.cerrarSesion();
    document.getElementById('auth').style.display = 'block';
    document.getElementById('bookings').style.display = 'none';
});

document.getElementById('createBooking').addEventListener('click', function () {
    const usuario = Auth.obtenerUsuarioActual();
    if (usuario) {
        const reserva = {
            id: Date.now(),
            descripcion: prompt('Ingrese la descripción de la reserva:')
        };

        if (usuario.role === 'admin') {
            new AdminUser(usuario.nombre, usuario.username, usuario.password).createBooking(reserva);
        } else {
            new RegularUser(usuario.nombre, usuario.username, usuario.password).createBooking(reserva);
        }

        displayBookings();
    } else {
        alert('Debe iniciar sesión para crear una reserva');
    }
});

function displayBookings() {
    const usuario = Auth.obtenerUsuarioActual();
    const reservas = JSON.parse(localStorage.getItem('reservas')) || [];
    const listaReservas = document.getElementById('bookingList');
    listaReservas.innerHTML = '';

    reservas.forEach(reserva => {
        const li = document.createElement('li');
        li.textContent = `Reserva: ${reserva.descripcion} - Usuario: ${reserva.usuario}`;

        if (usuario.role === 'admin') {
            const eliminarBtn = document.createElement('button');
            eliminarBtn.textContent = 'Eliminar';
            eliminarBtn.addEventListener('click', function () {
                new AdminUser(usuario.nombre, usuario.username, usuario.password).deleteBooking(reserva.id);
                displayBookings();
            });

            const editarBtn = document.createElement('button');
            editarBtn.textContent = 'Editar';
            editarBtn.addEventListener('click', function () {
                const nuevaDescripcion = prompt('Ingrese la nueva descripción de la reserva:', reserva.descripcion);
                new AdminUser(usuario.nombre, usuario.username, usuario.password).updateBooking(reserva.id, { descripcion: nuevaDescripcion });
                displayBookings();
            });

            li.appendChild(editarBtn);
            li.appendChild(eliminarBtn);
        }

        listaReservas.appendChild(li);
    });
}

window.onload = function () {
    const usuario = Auth.obtenerUsuarioActual();
    if (usuario) {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('bookings').style.display = 'block';
        displayBookings();
    }
};