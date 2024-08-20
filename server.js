const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const PDFDocument = require('pdfkit'); 
const puppeteer = require('puppeteer');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configura la conexión a la base de datos
const db = mysql.createConnection({
    host: 'blb6ywtxsd36c0o6mgqy-mysql.services.clever-cloud.com',  // Verifica este valor
    user: 'ukzcgoa53a2cql7h',
    password: 'UcaSSP9O7sv5Rq8knpUr',
    database: 'blb6ywtxsd36c0o6mgqy'
  });
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado a la base de datos');
});
db.connect((err) => {
    if (err) {
        console.error('Error de conexión: ', err);
        return;
    }
    console.log('Conectado a la base de datos');
});


// Servir el archivo HTML del formulario de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/login.html'));
});

// Ruta para el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            res.status(500).send('Error en el servidor');
            return;
        }

        if (results.length > 0) {
            const user = results[0];
            if (user.role === 'administrador') {
                res.redirect('/admin');
            } else if (user.role === 'vendedor') {
                res.redirect('/vendedor');
            } else {
                res.status(400).send('Rol no reconocido');
            }
        } else {
            res.status(400).send('Credenciales incorrectas');
        }
    });
});

// Rutas para roles específicos
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
<html>
<head>
    <title>Menú Administrador</title>
    <link rel="shortcut icon" href="/image.png" type="image/x-icon">
    <style>
        html, body {
            height: 80%;
            margin: 0;
            font-family: Arial, sans-serif;
            background-color: rgba(240, 207, 183, 0.38);
            color: #327c6e;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .content {
            text-align: center;
        }
        h2 {
            margin-bottom: 30px;
        }
        .button-container {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        .button {
            text-decoration: none;
            color: #fff;
            background-color: #ff7f7f;
            font-size: 16px;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s;
        }
        .button:nth-child(2) {
            background-color: #4a9a8e;
        }
        .button:hover {
            background-color: #e55b5b;
        }
        .button:nth-child(2):hover {
            background-color: #327c6e;
        }
        .img {
            position: absolute;
            top: 20px;
            left: 20px;
        }
        img {
            width: 100px;
        }
    </style>
</head>
<body>
    <div class="img"><img src="/image.png" alt="Logo"></div>
    <div class="content">
        <h2>Menú Administrador</h2>
        <div class="button-container">
            <a href="/admin/register" class="button">Registrar Nuevos Usuarios</a>
            <a href="/admin/payments" class="button">Hacer Pagos</a>
            <a href="/admin/reports" class="button">Generar Reportes</a>
        </div>
    </div>
</body>
</html>


    `);
});

app.get('/admin/register', (req, res) => {
    const query = 'SELECT * FROM usuarios';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener los usuarios');
            return;
        }

        let userList = `
            <h2>Registrar Nuevos Usuarios</h2>
            <form action="/admin/register" method="POST" class="form">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
                <br>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
                <br>
                <label for="role">Role:</label>
                <select id="role" name="role" required>
                    <option value="administrador">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                </select>
                <br>
                <button type="submit">Registrar Usuario</button>
            </form>
            <h2>Lista de Usuarios</h2>
            <ul class="user-list">`;

        results.forEach(user => {
            userList += `<li>${user.username} - ${user.role} 
            <a href="/admin/edit/${user.id}" class="link">Editar</a> 
            <a href="/admin/delete/${user.id}" class="link" onclick="return confirm('¿Estás seguro de que deseas eliminar este usuario?')">Eliminar</a></li>`;
        });
        userList += '</ul>';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Registrar Nuevos Usuarios</title>
                <link rel="shortcut icon" href="/image.png" type="image/x-icon">
                <style>
                    /* Reset de estilos básicos */
                    html, body {
                        height: 100%;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        color: #333;
                        background-color: rgba(240, 207, 183, 0.38);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .container {
                        width: 90%;
                        max-width: 600px;
                        padding: 20px;
                        background: #fff;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        text-align: center;
                    }

                    h2 {
                        margin-bottom: 20px;
                        font-size: 24px;
                        color: #333;
                    }

                    .form {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form label {
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .form input, .form select {
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .form button {
                        padding: 10px;
                        border: none;
                        border-radius: 4px;
                        background-color: #4a9a8e;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }

                    .form button:hover {
                        background-color: #327c6e;
                    }

                    .user-list {
                        list-style-type: none;
                        padding: 0;
                        margin-top: 20px;
                    }

                    .user-list li {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px;
                        border-bottom: 1px solid #ddd;
                    }

                    .user-list .link {
                        text-decoration: none;
                        color: #4a9a8e;
                        margin-left: 10px;
                        font-size: 14px;
                    }

                    .user-list .link:hover {
                        text-decoration: underline;
                    }

                    .back-button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        border: none;
                        border-radius: 4px;
                        background-color: #ddd;
                        color: #333;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        transition: background-color 0.3s;
                    }

                    .back-button:hover {
                        background-color: #ccc;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${userList}
                    <a href="/admin" class="back-button">Regresar</a>
                </div>
            </body>
            </html>
        `);
    });
});

// Ruta para manejar la inserción de nuevos usuarios
app.post('/admin/register', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).send('Faltan campos requeridos.');
    }

    const query = 'INSERT INTO usuarios (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, password, role], (err, result) => {
        if (err) {
            console.error('Error al registrar el usuario:', err);
            return res.status(500).send('Error al registrar el usuario.');
        }
        res.redirect('/admin/register');
    });
});

// Ruta para mostrar el formulario de edición de usuario
app.get('/admin/edit/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'SELECT * FROM usuarios WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            res.status(500).send('Error al obtener el usuario');
            return;
        }

        if (result.length === 0) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        const user = result[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Usuario</title>
                <link rel="shortcut icon" href="/image.png" type="image/x-icon">
                <style>
                    /* Reset de estilos básicos */
                    html, body {
                        height: 100%;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        color: #333;
                        background-color: rgba(240, 207, 183, 0.38);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .container {
                        width: 90%;
                        max-width: 600px;
                        padding: 20px;
                        background: #fff;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        text-align: center;
                    }

                    h2 {
                        margin-bottom: 20px;
                        font-size: 24px;
                        color: #333;
                    }

                    .form {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form label {
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .form input, .form select {
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .form button {
                        padding: 10px;
                        border: none;
                        border-radius: 4px;
                        background-color: #4a9a8e;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }

                    .form button:hover {
                        background-color: #327c6e;
                    }

                    .back-button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        border: none;
                        border-radius: 4px;
                        background-color: #ddd;
                        color: #333;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        transition: background-color 0.3s;
                    }

                    .back-button:hover {
                        background-color: #ccc;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Editar Usuario</h2>
                    <form action="/admin/edit/${userId}" method="POST" class="form">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" value="${user.username}" required>
                        <br>
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" value="${user.password}" required>
                        <br>
                        <label for="role">Role:</label>
                        <select id="role" name="role" required>
                            <option value="administrador" ${user.role === 'administrador' ? 'selected' : ''}>Administrador</option>
                            <option value="vendedor" ${user.role === 'vendedor' ? 'selected' : ''}>Vendedor</option>
                        </select>
                        <br>
                        <button type="submit">Guardar Cambios</button>
                    </form>
                    <a href="/admin/register" class="back-button">Regresar</a>
                </div>
            </body>
            </html>
        `);
    });
});

// Ruta para manejar la actualización de usuarios
app.post('/admin/edit/:id', (req, res) => {
    const userId = req.params.id;
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).send('Faltan campos requeridos.');
    }

    const query = 'UPDATE usuarios SET username = ?, password = ?, role = ? WHERE id = ?';
    db.query(query, [username, password, role, userId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el usuario:', err);
            return res.status(500).send('Error al actualizar el usuario.');
        }
        res.redirect('/admin/register');
    });
});
app.get('/admin/delete/:id', (req, res) => {
    const userId = req.params.id;

    const query = 'DELETE FROM usuarios WHERE id = ?';
    db.query(query, [userId], (err) => {
        if (err) {
            res.status(500).send('Error al eliminar el usuario');
            return;
        }
        res.redirect('/admin/register');
    });
});







// Ruta para hacer pagos
app.get('/admin/payments', (req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; 

    
    const monthFormatted = month < 10 ? `0${month}` : month;

    
    const query = `
        SELECT id, type, amount
        FROM payments
        WHERE DATE_FORMAT(timestamp, '%Y-%m') = '${year}-${monthFormatted}'
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener los pagos');
            return;
        }

        let paymentList = `
            <h2>Hacer Pagos</h2>
            <form action="/admin/payments" method="POST" class="form">
                <label for="type">Tipo de Pago:</label>
                <input type="text" id="type" name="type" required>
                <br>
                <label for="amount">Monto:</label>
                <input type="number" id="amount" name="amount" required>
                <br>
                <button type="submit">Hacer Pago</button>
            </form>
            <h2>Lista de Pagos</h2>
            <div class="table-container">
                <table class="payment-table">
                    <thead>
                        <tr>
                            <th>Tipo de Pago</th>
                            <th>Monto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>`;

        results.forEach(payment => {
            paymentList += `
                <tr>
                    <td>${payment.type}</td>
                    <td>${payment.amount} MXN</td>
                    <td>
                        <a href="/admin/payments/edit/${payment.id}" class="link">Editar</a> 
                        <a href="/admin/payments/delete/${payment.id}" class="link" onclick="return confirm('¿Estás seguro de que deseas eliminar este pago?')">Eliminar</a>
                    </td>
                </tr>`;
        });
        paymentList += `</tbody>
                </table>
            </div>
            <a href="/admin" class="back-button">Regresar</a>
        `;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hacer Pagos</title>
                <link rel="shortcut icon" href="/image.png" type="image/x-icon">
                <style>
                    /* Reset de estilos básicos */
                    html, body {
                        height: 100%;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        color: #333;
                        background-color: rgba(240, 207, 183, 0.38);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .container {
                        width: 90%;
                        max-width: 800px;
                        padding: 20px;
                        background: #fff;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        text-align: center;
                        margin-top: 20px;
                        overflow: auto;
                    }

                    h2 {
                        margin-bottom: 20px;
                        font-size: 24px;
                        color: #333;
                    }

                    .form {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form label {
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .form input {
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .form button {
                        padding: 10px;
                        border: none;
                        border-radius: 4px;
                        background-color: #4a9a8e;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }

                    .form button:hover {
                        background-color: #327c6e;
                    }

                    .table-container {
                        overflow-x: auto;
                        margin-top: 20px;
                    }

                    .payment-table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    .payment-table th, .payment-table td {
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }

                    .payment-table th {
                        background-color: #f4f4f4;
                        font-weight: bold;
                    }

                    .payment-table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }

                    .payment-table .link {
                        text-decoration: none;
                        color: #4a9a8e;
                        margin-left: 10px;
                        font-size: 14px;
                    }

                    .payment-table .link:hover {
                        text-decoration: underline;
                    }

                    .back-button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        border: none;
                        border-radius: 4px;
                        background-color: #ddd;
                        color: #333;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        transition: background-color 0.3s;
                    }

                    .back-button:hover {
                        background-color: #ccc;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${paymentList}
                </div>
            </body>
            </html>
        `);
    });
});

app.post('/admin/payments', (req, res) => {
    const { type, amount } = req.body;
    const timestamp = new Date();

    const query = 'INSERT INTO payments (type, amount, timestamp) VALUES (?, ?, ?)';
    db.query(query, [type, amount, timestamp], (err) => {
        if (err) {
            res.status(500).send('Error al registrar el pago');
            return;
        }
        res.redirect('/admin/payments');
    });
});

// Ruta para editar pago
app.get('/admin/payments/edit/:id', (req, res) => {
    const paymentId = req.params.id;

    const query = 'SELECT * FROM payments WHERE id = ?';
    db.query(query, [paymentId], (err, result) => {
        if (err) {
            res.status(500).send('Error al obtener el pago');
            return;
        }

        if (result.length === 0) {
            res.status(404).send('Pago no encontrado');
            return;
        }

        const payment = result[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Pago</title>
                <link rel="shortcut icon" href="/image.png" type="image/x-icon">
                <style>
                    /* Reset de estilos básicos */
                    html, body {
                        height: 100%;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        color: #333;
                        background-color: rgba(240, 207, 183, 0.38);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .container {
                        width: 90%;
                        max-width: 600px;
                        padding: 20px;
                        background: #fff;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        text-align: center;
                    }

                    h2 {
                        margin-bottom: 20px;
                        font-size: 24px;
                        color: #333;
                    }

                    .form {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form label {
                        text-align: left;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .form input {
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .form button {
                        padding: 10px;
                        border: none;
                        border-radius: 4px;
                        background-color: #4a9a8e;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }

                    .form button:hover {
                        background-color: #327c6e;
                    }

                    .back-button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        border: none;
                        border-radius: 4px;
                        background-color: #ddd;
                        color: #333;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        transition: background-color 0.3s;
                    }

                    .back-button:hover {
                        background-color: #ccc;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Editar Pago</h2>
                    <form action="/admin/payments/edit/${paymentId}" method="POST" class="form">
                        <label for="type">Tipo de Pago:</label>
                        <input type="text" id="type" name="type" value="${payment.type}" required>
                        <br>
                        <label for="amount">Monto:</label>
                        <input type="number" id="amount" name="amount" value="${payment.amount}" required>
                        <br>
                        <button type="submit">Guardar Cambios</button>
                    </form>
                    <a href="/admin/payments" class="back-button">Regresar</a>
                </div>
            </body>
            </html>
        `);
    });
});

app.post('/admin/payments/edit/:id', (req, res) => {
    const paymentId = req.params.id;
    const { type, amount } = req.body;

    const query = 'UPDATE payments SET type = ?, amount = ? WHERE id = ?';
    db.query(query, [type, amount, paymentId], (err) => {
        if (err) {
            res.status(500).send('Error al actualizar el pago');
            return;
        }
        res.redirect('/admin/payments');
    });
});

// Ruta para eliminar pago
app.get('/admin/payments/delete/:id', (req, res) => {
    const paymentId = req.params.id;

    const query = 'DELETE FROM payments WHERE id = ?';
    db.query(query, [paymentId], (err) => {
        if (err) {
            res.status(500).send('Error al eliminar el pago');
            return;
        }
        res.redirect('/admin/payments');
    });
});



// Ruta principal para vendedor
app.get('/vendedor', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Menú Vendedor</title>
            <link rel="shortcut icon" href="/image.png" type="image/x-icon">
            <style>
                body {
                    background-color: rgba(240, 207, 183, 0.38);
                    font-family: Arial, sans-serif;
                    color: #327c6e;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                h2 {
                    text-align: center;
                    font-size: 2em;
                    margin-bottom: 20px;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                }
                li {
                    margin: 0 10px;
                    text-align: center;
                }
                a {
                    text-decoration: none;
                    color: #fff;
                    font-size: 1.2em;
                    padding: 10px 20px;
                    border-radius: 5px;
                    transition: background-color 0.3s, color 0.3s;
                    display: inline-block;
                }
                .btn-venta {
                    background-color: #327c6e;
                }
                .btn-lista {
                    background-color: #4CAF50;
                }
                .btn-insumos {
                    background-color: #FF9800;
                }
                .btn-venta:hover,
                .btn-lista:hover,
                .btn-insumos:hover {
                    opacity: 0.8;
                }
                .img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    padding: 20px; 
                }
        
                img {
                    width: 150px; 
                }
            </style>
        </head>
        <body>
        <div class="img"><img src="/image.png" alt="Logo"></div>
            <div>
                <h2>Menú Vendedor</h2>
                <ul>
                    <li><a class="btn-venta" href="/vendedor/ventas">Registrar Nueva Venta</a></li>
                    <li><a class="btn-insumos" href="/vendedor/insumos">Registrar Insumos</a></li>
                </ul>
            </div>
        </body>
        </html>
    `);
});



// Mostrar ventas y productos
app.get('/vendedor/ventas', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const ventasQuery = 'SELECT * FROM ventas WHERE fecha = ?';
    const productosQuery = 'SELECT * FROM productos';

    db.query(ventasQuery, [today], (err, ventas) => {
        if (err) {
            res.status(500).send('Error al obtener las ventas');
            return;
        }

        db.query(productosQuery, (err, productos) => {
            if (err) {
                res.status(500).send('Error al obtener los productos');
                return;
            }

            // Agrupar productos por categoría
            const categorias = [
                'Sandwiches', 'Jochos', 'Aguas', 'Refrescos', 'Comidas',
                'Jugos', 'Bebidas Calientes', 'Sincronizadas', 'Bebidas Frias',
                'Sodas Italianas', 'Malteadas', 'Frapes', 'Otros'
            ];
            const productosPorCategoria = categorias.reduce((acc, categoria) => {
                acc[categoria] = productos.filter(p => p.categoria === categoria);
                return acc;
            }, {});

            let ventasList = '<h2>Ventas de Hoy</h2><ul>';
            ventas.forEach(venta => {
                ventasList += `
                <li>ID: ${venta.id} - Nombre: ${venta.nombre_producto} - Cantidad: ${venta.cantidad} - Total: ${venta.total} MXN
                <form action="/vendedor/ventas/delete" method="POST" style="display:inline;">
                    <input type="hidden" name="venta_id" value="${venta.id}">
                    <button type="submit" onclick="return confirm('¿Estás seguro de que deseas eliminar esta venta?')">Eliminar</button>
                </form>
                <a href="/vendedor/ventas/edit/${venta.id}">Editar</a>
                </li>`;
            });
            ventasList += '</ul>';

            let productosList = '';
            categorias.forEach(categoria => {
                productosList += `<h2>${categoria}</h2><ul>`;
                productosPorCategoria[categoria].forEach(producto => {
                    productosList += `
                    <li>ID: ${producto.id} - ${producto.nombre} - ${producto.precio} MXN
                    <form action="/vendedor/ventas/add" method="POST" style="display:inline;">
                        <input type="hidden" name="producto_id" value="${producto.id}">
                        <input type="hidden" name="nombre" value="${producto.nombre}">
                        <input type="hidden" name="precio" value="${producto.precio}">
                        <input type="number" name="cantidad" placeholder="Cantidad" required>
                        <button type="submit"><i class="fas fa-cart-plus"></i> Vender</button>
                    </form></li>`;
                });
                productosList += '</ul>';
            });

            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Ventas de Hoy</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                        h2 { color: #327c6e; }
                        ul { list-style-type: none; padding: 0; }
                        li { background: #fff; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                        button { background-color: #327c6e; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; }
                        button:hover { background-color: #285a4e; }
                        input { padding: 5px; margin-right: 5px; border-radius: 4px; border: 1px solid #ccc; }
                        .btn-add { background-color: #327c6e; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; text-decoration: none; }
                        .btn-add:hover { background-color: #285a4e; }
                        .add-product-btn, .list-products-btn { 
                            position: fixed; 
                            bottom: 20px; 
                            right: 20px; 
                            background-color: #327c6e; 
                            color: #fff; 
                            border: none; 
                            border-radius: 50%; 
                            padding: 15px; 
                            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); 
                            cursor: pointer; 
                            font-size: 24px; 
                            text-align: center; 
                            width: 50px; 
                            height: 50px;
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                        }
                        .add-product-btn:hover, .list-products-btn:hover { background-color: #285a4e; }
                        .fa-plus, .fa-list { font-size: 24px; }
                        .list-products-btn { bottom: 80px; }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                </head>
                <body>
                    ${productosList}
                    <hr>
                    ${ventasList}
                    <hr>
                    <a href="/vendedor/productos/add" class="add-product-btn">
                        <i class="fas fa-plus"></i>
                    </a>
                    <a href="/vendedor/productos" class="list-products-btn">
                        <i class="fas fa-list"></i>
                    </a>
                </body>
                </html>
            `);
        });
    });
});





// Ruta para procesar la venta
app.post('/vendedor/ventas/add', (req, res) => {
    const { producto_id, cantidad, precio } = req.body;
    const total = cantidad * precio;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toTimeString().split(' ')[0]; // Obtener hora actual en formato HH:MM:SS

    // Obtener el nombre del producto usando el ID del producto
    const getProductQuery = 'SELECT nombre FROM productos WHERE id = ?';
    
    db.query(getProductQuery, [producto_id], (err, results) => {
        if (err) {
            console.error('Error al obtener el nombre del producto:', err);
            res.status(500).send('Error al registrar la venta');
            return;
        }

        const nombre_producto = results[0].nombre;
        
        const query = 'INSERT INTO ventas (fecha, hora, nombre_producto, cantidad, precio, total) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.query(query, [today, now, nombre_producto, cantidad, precio, total], (err) => {
            if (err) {
                console.error('Error al registrar la venta:', err);
                res.status(500).send('Error al registrar la venta');
                return;
            }
            res.redirect('/vendedor/ventas');
        });
    });
});

// Ruta para eliminar una venta
app.post('/vendedor/ventas/delete', (req, res) => {
    const { venta_id } = req.body;
    const query = 'DELETE FROM ventas WHERE id = ?';

    db.query(query, [venta_id], (err) => {
        if (err) {
            console.error('Error al eliminar la venta:', err);
            res.status(500).send('Error al eliminar la venta');
            return;
        }
        res.redirect('/vendedor/ventas');
    });
});

// Mostrar el formulario para editar una venta
app.get('/vendedor/ventas/edit/:id', (req, res) => {
    const ventaId = req.params.id;
    const query = 'SELECT * FROM ventas WHERE id = ?';

    db.query(query, [ventaId], (err, ventas) => {
        if (err) {
            res.status(500).send('Error al obtener la venta');
            return;
        }

        if (ventas.length === 0) {
            res.status(404).send('Venta no encontrada');
            return;
        }

        const venta = ventas[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Venta</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                    h2 { color: #327c6e; }
                    form { background: #fff; padding: 20px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                    label { display: block; margin: 10px 0 5px; }
                    input { padding: 5px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc; width: 100%; }
                    button { background-color: #327c6e; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                    button:hover { background-color: #285a4e; }
                </style>
            </head>
            <body>
                <h2>Editar Venta</h2>
                <form action="/vendedor/ventas/update" method="POST">
                    <input type="hidden" name="id" value="${venta.id}">
                    <label for="descripcion">Nombre del Producto:</label>
                    <input type="text" id="descripcion" name="descripcion" value="${venta.nombre_producto}" required>
                    <label for="cantidad">Cantidad:</label>
                    <input type="number" id="cantidad" name="cantidad" value="${venta.cantidad}" required>
                    <label for="precio">Precio:</label>
                    <input type="number" id="precio" name="precio" value="${venta.precio}" required>
                    <button type="submit">Actualizar Venta</button>
                </form>
            </body>
            </html>
        `);
    });
});

// Ruta para actualizar una venta
app.post('/vendedor/ventas/update', (req, res) => {
    const { id, descripcion, cantidad, precio } = req.body;
    const total = cantidad * precio;
    const query = 'UPDATE ventas SET nombre_producto = ?, cantidad = ?, precio = ?, total = ? WHERE id = ?';

    db.query(query, [descripcion, cantidad, precio, total, id], (err) => {
        if (err) {
            console.error('Error al actualizar la venta:', err);
            res.status(500).send('Error al actualizar la venta');
            return;
        }
        res.redirect('/vendedor/ventas');
    });
});

// Listar productos
app.get('/vendedor/productos', (req, res) => {
    const query = 'SELECT * FROM productos';
    
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener los productos');
            return;
        }

        let productosList = '<h2>Lista de Productos</h2><ul>';
        results.forEach(producto => {
            productosList += `
            <li>
                ID: ${producto.id} - ${producto.nombre} - ${producto.precio} MXN
                <div class="actions">
                    <a href="/vendedor/productos/edit/${producto.id}" class="btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </a>
                    <form action="/vendedor/productos/delete/${producto.id}" method="POST" style="display:inline;">
                        <button type="submit" class="btn-delete" onclick="return confirm('¿Estás seguro de que deseas eliminar este producto?')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </form>
                </div>
            </li>`;
        });
        productosList += '</ul>';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Productos</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                    h2 { color: #327c6e; }
                    ul { list-style-type: none; padding: 0; }
                    li { background: #fff; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); position: relative; }
                    .actions { 
                        position: absolute; 
                        right: 10px; 
                        top: 10px; 
                        display: flex; 
                        gap: 10px;
                    }
                    .btn-edit, .btn-delete { 
                        background: none; 
                        border: none; 
                        cursor: pointer; 
                        font-size: 16px; 
                        color: #327c6e; 
                    }
                    .btn-edit:hover { color: #285a4e; }
                    .btn-delete { 
                        color: #d9534f; 
                    }
                    .btn-delete:hover { color: #c9302c; }
                    .fa-edit { font-size: 18px; }
                    .fa-trash { font-size: 18px; }
                    .add-product-btn { 
                        position: fixed; 
                        bottom: 20px; 
                        right: 20px; 
                        background-color: #327c6e; 
                        color: #fff; 
                        border: none; 
                        border-radius: 50%; 
                        padding: 15px; 
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); 
                        cursor: pointer; 
                        font-size: 24px; 
                        text-align: center; 
                        width: 50px; 
                        height: 50px;
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                    }
                    .add-product-btn:hover { background-color: #285a4e; }
                    .fa-plus { font-size: 24px; }
                </style>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            </head>
            <body>
                ${productosList}
                <br>
                <a href="/vendedor/productos/add" class="add-product-btn">
                    <i class="fas fa-plus"></i>
                </a>
            </body>
            </html>
        `);
    });
});

// Mostrar el formulario para agregar un nuevo producto
app.get('/vendedor/productos/add', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Agregar Nuevo Producto</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                h2 { color: #327c6e; }
                form { background: #fff; padding: 20px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                input, select { padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc; width: 100%; }
                button { background-color: #327c6e; color: #fff; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
                button:hover { background-color: #285a4e; }
            </style>
        </head>
        <body>
            <h2>Agregar Nuevo Producto</h2>
            <form action="/vendedor/productos/add" method="POST">
                <input type="text" name="nombre" placeholder="Nombre del Producto" required>
                <input type="number" name="precio" placeholder="Precio" step="0.01" required>
                <select name="categoria" required>
                    <option value="" disabled selected>Selecciona una Categoría</option>
                    <option value="Sandwiches">Sandwiches</option>
                    <option value="Jochos">Jochos</option>
                    <option value="Aguas">Aguas</option>
                    <option value="Refrescos">Refrescos</option>
                    <option value="Comidas">Comidas</option>
                    <option value="Jugos">Jugos</option>
                    <option value="Bebidas Calientes">Bebidas Calientes</option>
                    <option value="Sincronizadas">Sincronizadas</option>
                    <option value="Bebidas Frias">Bebidas Frias</option>
                    <option value="Sodas Italianas">Sodas Italianas</option>
                    <option value="Malteadas">Malteadas</option>
                    <option value="Frapes">Frapes</option>
                    <option value="Frapes">Otros</option>
                </select>
                <button type="submit">Agregar Producto</button>
            </form>
        </body>
        </html>
    `);
});

// Ruta para procesar la solicitud de agregar un nuevo producto
app.post('/vendedor/productos/add', (req, res) => {
    const { nombre, precio, categoria } = req.body;
    
    const query = 'INSERT INTO productos (nombre, precio, categoria) VALUES (?, ?, ?)';
    
    db.query(query, [nombre, precio, categoria], (err) => {
        if (err) {
            console.error('Error al agregar el producto:', err);
            res.status(500).send('Error al agregar el producto');
            return;
        }
        res.redirect('/vendedor/productos');
    });
});
// Formulario para editar producto
app.get('/vendedor/productos/edit/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM productos WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            res.status(500).send('Error al obtener los datos del producto');
            return;
        }

        const producto = results[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Producto</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                    h2 { color: #327c6e; }
                    form { background: #fff; padding: 20px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                    input, select { padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc; width: 100%; }
                    button { background-color: #327c6e; color: #fff; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
                    button:hover { background-color: #285a4e; }
                </style>
            </head>
            <body>
                <h2>Editar Producto</h2>
                <form action="/vendedor/productos/edit/${producto.id}" method="POST">
                    <input type="text" name="nombre" value="${producto.nombre}" required>
                    <input type="number" name="precio" value="${producto.precio}" step="0.01" required>
                    <select name="categoria" required>
                        <option value="Sandwiches" ${producto.categoria === 'Sandwiches' ? 'selected' : ''}>Sandwiches</option>
                        <option value="Jochos" ${producto.categoria === 'Jochos' ? 'selected' : ''}>Jochos</option>
                        <option value="Aguas" ${producto.categoria === 'Aguas' ? 'selected' : ''}>Aguas</option>
                        <option value="Refrescos" ${producto.categoria === 'Refrescos' ? 'selected' : ''}>Refrescos</option>
                        <option value="Comidas" ${producto.categoria === 'Comidas' ? 'selected' : ''}>Comidas</option>
                        <option value="Jugos" ${producto.categoria === 'Jugos' ? 'selected' : ''}>Jugos</option>
                        <option value="Bebidas Calientes" ${producto.categoria === 'Bebidas Calientes' ? 'selected' : ''}>Bebidas Calientes</option>
                        <option value="Sincronizadas" ${producto.categoria === 'Sincronizadas' ? 'selected' : ''}>Sincronizadas</option>
                        <option value="Bebidas Frias" ${producto.categoria === 'Bebidas Frias' ? 'selected' : ''}>Bebidas Frias</option>
                        <option value="Sodas Italianas" ${producto.categoria === 'Sodas Italianas' ? 'selected' : ''}>Sodas Italianas</option>
                        <option value="Malteadas" ${producto.categoria === 'Malteadas' ? 'selected' : ''}>Malteadas</option>
                        <option value="Frapes" ${producto.categoria === 'Frapes' ? 'selected' : ''}>Frapes</option>
                        <option value="Otros" ${producto.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                    </select>
                    <button type="submit">Actualizar Producto</button>
                </form>
                <a href="/vendedor/productos">Volver a la Lista de Productos</a>
            </body>
            </html>
        `);
    });
});

//eliminar producto
app.post('/vendedor/productos/delete/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM productos WHERE id = ?';

    db.query(query, [id], (err) => {
        if (err) {
            console.error('Error al eliminar el producto:', err);
            res.status(500).send('Error al eliminar el producto');
            return;
        }
        res.redirect('/vendedor/productos');
    });
});



// Procesar la edición de un producto
app.post('/vendedor/productos/edit/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, precio, categoria } = req.body;
    const query = 'UPDATE productos SET nombre = ?, precio = ?, categoria = ? WHERE id = ?';

    db.query(query, [nombre, precio, categoria, id], (err) => {
        if (err) {
            res.status(500).send('Error al actualizar el producto');
            return;
        }
        res.redirect('/vendedor/productos');
    });
});




//lista de venta 
app.get('/vendedor/ventas/list', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const ventasQuery = 'SELECT * FROM ventas WHERE fecha = ?';
    
    db.query(ventasQuery, [today], (err, ventas) => {
        if (err) {
            res.status(500).send('Error al obtener las ventas');
            return;
        }

        let ventasList = '<h2>Ventas de Hoy</h2><ul>';
        ventas.forEach(venta => {
            ventasList += `
            <li>ID: ${venta.id} - Nombre: ${venta.descripcion} - Cantidad: ${venta.cantidad} - Total: ${venta.total} MXN
            </li>`;
        });
        ventasList += '</ul>';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Ventas</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: rgba(240, 207, 183, 0.38); }
                    h2 { color: #327c6e; }
                    ul { list-style-type: none; padding: 0; }
                    li { background: #fff; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                </style>
            </head>
            <body>
                ${ventasList}
                <br>
                <a href="/vendedor">Volver al Menú</a>
            </body>
            </html>
        `);
    });
});




app.get('/vendedor/insumos', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Registrar Insumos</title>
            <link rel="shortcut icon" href="/image.png" type="image/x-icon">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: rgba(240, 207, 183, 0.38);
                }
                h2 {
                    color: #327c6e;
                }
                form {
                    background: #fff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 8px;
                    color: #327c6e;
                }
                input[type="text"], input[type="number"] {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    background-color: #327c6e;
                    color: #fff;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: #285a4e;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                }
                li {
                    background: #fff;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                }
                .actions a {
                    color: #327c6e;
                    text-decoration: none;
                }
                .actions a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h2>Registrar Nuevo Insumo</h2>
            <form action="/vendedor/insumos" method="POST">
                <label for="tipo_insumo">Tipo de Insumo:</label>
                <input type="text" id="tipo_insumo" name="tipo_insumo" required>
                <br>
                <label for="costo">Costo:</label>
                <input type="number" id="costo" name="costo" step="0.01" required>
                <br>
                <button type="submit">Registrar Insumo</button>
            </form>
            <h2>Lista de Insumos del Mes Actual</h2>
            <ul id="insumos-list"></ul>
            <script>
                fetch('/vendedor/insumos/list')
                    .then(response => response.json())
                    .then(data => {
                        const list = document.getElementById('insumos-list');
                        data.forEach(insumo => {
                            const li = document.createElement('li');
                            li.innerHTML = \`
                                ID: \${insumo.id} - Tipo: \${insumo.tipo_insumo} - Costo: \${insumo.costo} - Fecha: \${insumo.fecha}
                                <div class="actions">
                                    <a href="/vendedor/insumos/edit/\${insumo.id}">Editar</a>
                                    <a href="/vendedor/insumos/delete/\${insumo.id}" onclick="return confirm('¿Estás seguro de que deseas eliminar este insumo?')">Eliminar</a>
                                </div>
                            \`;
                            list.appendChild(li);
                        });
                    });
            </script>
        </body>
        </html>
    `);
});

app.post('/vendedor/insumos', (req, res) => {
    const { tipo_insumo, costo } = req.body;
    const timestamp = new Date();

    const query = 'INSERT INTO insumos (tipo_insumo, costo, fecha) VALUES (?, ?, ?)';
    db.query(query, [tipo_insumo, costo, timestamp], (err) => {
        if (err) {
            res.status(500).send('Error al registrar el insumo');
            return;
        }
        res.redirect('/vendedor/insumos');
    });
});

app.get('/vendedor/insumos/list', (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startOfMonthStr = startOfMonth.toISOString().slice(0, 19).replace('T', ' ');
    const endOfMonthStr = endOfMonth.toISOString().slice(0, 19).replace('T', ' ');

    const query = 'SELECT * FROM insumos WHERE fecha BETWEEN ? AND ?';
    db.query(query, [startOfMonthStr, endOfMonthStr], (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener los insumos');
            return;
        }
        res.json(results);
    });
});

app.get('/vendedor/insumos/edit/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM insumos WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            res.status(500).send('Error al obtener los datos del insumo');
            return;
        }
        
        const insumo = results[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Insumo</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: rgba(240, 207, 183, 0.38);
                    }
                    h2 {
                        color: #327c6e;
                    }
                    form {
                        background: #fff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        color: #327c6e;
                    }
                    input[type="text"], input[type="number"] {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    button {
                        background-color: #327c6e;
                        color: #fff;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover {
                        background-color: #285a4e;
                    }
                </style>
            </head>
            <body>
                <h2>Editar Insumo</h2>
                <form action="/vendedor/insumos/edit/${insumo.id}" method="POST">
                    <label for="tipo_insumo">Tipo de Insumo:</label>
                    <input type="text" id="tipo_insumo" name="tipo_insumo" value="${insumo.tipo_insumo}" required>
                    <br>
                    <label for="costo">Costo:</label>
                    <input type="number" id="costo" name="costo" step="0.01" value="${insumo.costo}" required>
                    <br>
                    <button type="submit">Actualizar Insumo</button>
                </form>
                <a href="/vendedor/insumos">Volver a la Lista de Insumos</a>
            </body>
            </html>
        `);
    });
});

app.post('/vendedor/insumos/edit/:id', (req, res) => {
    const id = req.params.id;
    const { tipo_insumo, costo } = req.body;

    const query = 'UPDATE insumos SET tipo_insumo = ?, costo = ? WHERE id = ?';
    db.query(query, [tipo_insumo, costo, id], (err) => {
        if (err) {
            res.status(500).send('Error al actualizar el insumo');
            return;
        }
        res.redirect('/vendedor/insumos');
    });
});

app.get('/vendedor/insumos/delete/:id', (req, res) => {
    const id = req.params.id;

    const query = 'DELETE FROM insumos WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            res.status(500).send('Error al eliminar el insumo');
            return;
        }
        res.redirect('/vendedor/insumos');
    });
});
//Reportes
app.get('/admin/reports', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Generar Reportes</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background-color: rgba(240, 207, 183, 0.38); 
                    margin: 0; 
                    padding: 20px; 
                    color: #333; 
                }
                h2 { 
                    color: #327c6e; 
                }
                form { 
                    background: #fff; 
                    padding: 20px; 
                    border-radius: 8px; 
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); 
                    max-width: 400px; 
                    margin: 0 auto; 
                }
                label { 
                    display: block; 
                    margin-bottom: 10px; 
                    font-weight: bold; 
                }
                input[type="month"] { 
                    padding: 10px; 
                    border-radius: 4px; 
                    border: 1px solid #ccc; 
                    width: calc(100% - 22px); 
                    margin-bottom: 20px; 
                }
                button { 
                    background-color: #327c6e; 
                    color: #fff; 
                    border: none; 
                    padding: 10px 15px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 16px; 
                    margin-right: 10px; 
                }
                button:hover { 
                    background-color: #285a4e; 
                }
                button:last-child { 
                    margin-right: 0; 
                }
            </style>
        </head>
        <body>
            <h2>Generar Reportes</h2>
            <form action="/admin/reports/generate" method="POST">
                <label for="month">Selecciona el mes:</label>
                <input type="month" id="month" name="month" required>
                <br>
                <button type="submit" name="action" value="view">Ver Reporte</button>
                <button type="submit" name="action" value="pdf">Descargar PDF</button>
            </form>
        </body>
        </html>
    `);
});


// Ruta para generar el reporte
app.post('/admin/reports/generate', (req, res) => {
    const { month } = req.body;
    const action = req.body.action;

    const [year, monthNumber] = month.split('-');
    const formattedMonth = monthNumber.padStart(2, '0'); // Formatea el mes a dos dígitos

    // Ajusta las consultas SQL para utilizar la columna 'fecha' y 'timestamp'
    const queryVentas = `SELECT id, nombre_producto, cantidad, precio, total, fecha FROM ventas WHERE DATE_FORMAT(fecha, '%Y-%m') = '${year}-${formattedMonth}'`;
    const queryInsumos = `SELECT * FROM insumos WHERE DATE_FORMAT(fecha, '%Y-%m') = '${year}-${formattedMonth}'`;
    const queryPayments = `SELECT * FROM payments WHERE DATE_FORMAT(timestamp, '%Y-%m') = '${year}-${formattedMonth}'`;

    db.query(queryVentas, (err, ventas) => {
        if (err) {
            console.error('Error al obtener las ventas:', err);
            res.status(500).send('Error al obtener las ventas');
            return;
        }

        db.query(queryInsumos, (err, insumos) => {
            if (err) {
                console.error('Error al obtener los insumos:', err);
                res.status(500).send('Error al obtener los insumos');
                return;
            }

            db.query(queryPayments, (err, payments) => {
                if (err) {
                    console.error('Error al obtener los payments:', err);
                    res.status(500).send('Error al obtener los payments');
                    return;
                }

                const ganancias = calcularGanancias(ventas, insumos, payments);
                const reportHTML = generateReportHTML(ventas, insumos, payments, ganancias);

                if (action === 'pdf') {
                    generatePDF(reportHTML, res);
                } else {
                    res.send(reportHTML);
                }
            });
        });
    });
});

// Calcula las ganancias
function calcularGanancias(ventas, insumos, payments) {
    return {
        totalVentas: ventas.reduce((acc, venta) => acc + parseFloat(venta.total || 0), 0),
        totalInsumos: insumos.reduce((acc, insumo) => acc + parseFloat(insumo.costo || 0), 0),
        totalPayments: payments.reduce((acc, payment) => acc + parseFloat(payment.amount || 0), 0),
    };
}

// Genera el HTML del reporte
function generateReportHTML(ventas, insumos, payments, ganancias) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte del Mes</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                table, th, td { border: 1px solid #ddd; }
                th, td { padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
            </style>
        </head>
        <body>
            <h2>Reporte del Mes</h2>
            <h3>Ventas</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${ventas.map(venta => `
                        <tr>
                            <td>${venta.id}</td>
                            <td>${venta.nombre_producto}</td>
                            <td>${venta.cantidad}</td>
                            <td>${venta.precio}</td>
                            <td>${venta.total}</td>
                            <td>${new Date(venta.fecha).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Insumos</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo de Insumo</th>
                        <th>Costo</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${insumos.map(insumo => `
                        <tr>
                            <td>${insumo.id}</td>
                            <td>${insumo.tipo_insumo}</td>
                            <td>${insumo.costo}</td>
                            <td>${new Date(insumo.fecha).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Pagos</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                        <tr>
                            <td>${payment.id}</td>
                            <td>${payment.type}</td>
                            <td>${payment.amount}</td>
                            <td>${new Date(payment.timestamp).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Ganancias</h3>
            <p>Total Ventas: ${ganancias.totalVentas.toFixed(2)}</p>
            <p>Total Insumos: ${ganancias.totalInsumos.toFixed(2)}</p>
            <p>Total Pagos: ${ganancias.totalPayments.toFixed(2)}</p>
            <p>Ganancia/Pérdida: ${(ganancias.totalVentas - ganancias.totalInsumos - ganancias.totalPayments).toFixed(2)}</p>
        </body>
        </html>
    `;
}

// Genera el archivo PDF del reporte
async function generatePDF(html, res) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    
    // Genera el PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Enviar el PDF al cliente
    res.contentType("application/pdf");
    res.send(pdfBuffer);
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
