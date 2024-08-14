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
    host: 'fdb1027.runhosting.com',
    user: '	4514958_sistema',
    password: 'delicias1',
    database: '4514958_sistema',
    port:'3306'
});

db.connect((err) => {
    if (err) {
        throw err;
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
                    <li><a class="btn-lista" href="/vendedor/ventas/list">Ver Lista de Ventas</a></li>
                    <li><a class="btn-insumos" href="/vendedor/insumos">Registrar Insumos</a></li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

//ruta venta VENDEDOR
app.get('/vendedor/ventas', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const query = 'SELECT * FROM ventas WHERE DATE(fecha) = ?';

    db.query(query, [today], (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener las ventas');
            return;
        }

        // Generar la tabla de ventas
        let ventasTable = '<table class="ventas-table"><thead><tr><th>Tipo de Producto</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Fecha y Hora</th></tr></thead><tbody>';
        results.forEach(venta => {
            ventasTable += `<tr>
                                <td>${venta.tipo_producto}</td>
                                <td>${venta.descripcion}</td>
                                <td>${venta.cantidad}</td>
                                <td>${venta.precio}</td>
                                <td>${new Date(venta.fecha).toLocaleString()}</td>
                            </tr>`;
        });
        ventasTable += '</tbody></table>';

        // Enviar el HTML al cliente
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Registrar Ventas</title>
                <link rel="shortcut icon" href="/image.png" type="image/x-icon">
                <style>

                    body {
                        background-color: rgba(240, 207, 183, 0.38);
                        color: #327c6e;
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    h2 {
                        color: #333;
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
                    }
                    input[type="text"], input[type="number"], select {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    button {
                        background-color: #28a745;
                        color: #fff;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover {
                        background-color: #218838;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        background-color: #fff;
                        border-radius: 5px;
                        overflow: hidden;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    th, td {
                        padding: 10px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                    tr:hover {
                        background-color: #f1f1f1;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                        margin-left: 10px;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <h2>Registrar Nueva Venta</h2>
                <form action="/vendedor/ventas" method="POST">
                    <label for="tipo_producto">Tipo de Producto:</label>
                    <select id="tipo_producto" name="tipo_producto" required>
                        <option value="bebida">Bebida</option>
                        <option value="comida">Comida</option>
                    </select>
                    <br>
                    <label for="descripcion">Descripción:</label>
                    <input type="text" id="descripcion" name="descripcion" required>
                    <br>
                    <label for="cantidad">Cantidad:</label>
                    <input type="number" id="cantidad" name="cantidad" required>
                    <br>
                    <label for="precio">Precio:</label>
                    <input type="number" id="precio" name="precio" step="0.01" required>
                    <br>
                    <button type="submit">Registrar Venta</button>
                </form>
                
                <h2>Ventas de Hoy</h2>
                ${ventasTable}
                <br>
                <a href="/vendedor/ventas/list">Ver Lista Completa de Ventas</a>
            </body>
            </html>
        `);
    });
});

app.post('/vendedor/ventas', (req, res) => {
    const { tipo_producto, descripcion, cantidad, precio } = req.body;

    const query = 'INSERT INTO ventas (tipo_producto, descripcion, cantidad, precio, fecha) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [tipo_producto, descripcion, cantidad, precio], (err) => {
        if (err) {
            res.status(500).send('Error al registrar la venta');
            return;
        }
        res.redirect('/vendedor/ventas');
    });
});

// Listar ventas
app.get('/vendedor/ventas/list', (req, res) => {
    const query = 'SELECT * FROM ventas';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error al obtener las ventas');
            return;
        }

        let ventasList = '<h2>Lista de Ventas</h2><ul>';
        results.forEach(venta => {
            ventasList += `
            <li>ID: ${venta.id} - ${venta.tipo_producto} - ${venta.descripcion} - ${venta.cantidad} - ${venta.precio} MXN - ${venta.total} MXN - ${new Date(venta.fecha).toLocaleString()}
            <a href="/vendedor/ventas/edit/${venta.id}">Editar</a>
            <form action="/vendedor/ventas/delete/${venta.id}" method="POST" style="display:inline;">
                <button type="submit" onclick="return confirm('¿Estás seguro de que deseas eliminar esta venta?')">Eliminar</button>
            </form></li>`;
        });
        ventasList += '</ul>';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Ventas</title>
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
                    }
                    a {
                        color: #327c6e;
                        text-decoration: none;
                        margin-left: 10px;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    button {
                        background-color: #d9534f;
                        color: #fff;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    button:hover {
                        background-color: #c9302c;
                    }
                </style>
            </head>
            <body>
                ${ventasList}
                <br>
                <a href="/vendedor/ventas">Volver a Registrar Ventas</a>
            </body>
            </html>
        `);
    });
});

// Editar venta
app.get('/vendedor/ventas/edit/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM ventas WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            res.status(500).send('Error al obtener los datos de la venta');
            return;
        }
        
        const venta = results[0];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Editar Venta</title>
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
                    input[type="text"], input[type="number"], select {
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
                <h2>Editar Venta</h2>
                <form action="/vendedor/ventas/edit/${venta.id}" method="POST">
                    <label for="tipo_producto">Tipo de Producto:</label>
                    <select id="tipo_producto" name="tipo_producto" required>
                        <option value="bebida" ${venta.tipo_producto === 'bebida' ? 'selected' : ''}>Bebida</option>
                        <option value="comida" ${venta.tipo_producto === 'comida' ? 'selected' : ''}>Comida</option>
                    </select>
                    <br>
                    <label for="descripcion">Descripción:</label>
                    <input type="text" id="descripcion" name="descripcion" value="${venta.descripcion}" required>
                    <br>
                    <label for="cantidad">Cantidad:</label>
                    <input type="number" id="cantidad" name="cantidad" value="${venta.cantidad}" required>
                    <br>
                    <label for="precio">Precio:</label>
                    <input type="number" id="precio" name="precio" step="0.01" value="${venta.precio}" required>
                    <br>
                    <button type="submit">Actualizar Venta</button>
                </form>
                <a href="/vendedor/ventas/list">Volver a la Lista de Ventas</a>
            </body>
            </html>
        `);
    });
});

// Actualizar venta
app.post('/vendedor/ventas/edit/:id', (req, res) => {
    const id = req.params.id;
    const { tipo_producto, descripcion, cantidad, precio } = req.body;

    const query = 'UPDATE ventas SET tipo_producto = ?, descripcion = ?, cantidad = ?, precio = ? WHERE id = ?';
    db.query(query, [tipo_producto, descripcion, cantidad, precio, id], (err) => {
        if (err) {
            res.status(500).send('Error al actualizar la venta');
            return;
        }
        res.redirect('/vendedor/ventas/list');
    });
});

// Eliminar venta
app.post('/vendedor/ventas/delete/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM ventas WHERE id = ?';

    db.query(query, [id], (err) => {
        if (err) {
            res.status(500).send('Error al eliminar la venta');
            return;
        }
        res.redirect('/vendedor/ventas/list');
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
    const queryVentas = `SELECT * FROM ventas WHERE DATE_FORMAT(fecha, '%Y-%m') = '${year}-${formattedMonth}'`;
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
                        <th>Tipo de Producto</th>
                        <th>Descripción</th>
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
                            <td>${venta.tipo_producto}</td>
                            <td>${venta.descripcion}</td>
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
