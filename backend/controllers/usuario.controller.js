'use strict';

const { Usuario } = require('../models');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Retorna una lista con todos los usuarios registrados en el sistema, excluyendo sus contraseñas por motivos de seguridad.
 *     tags:
 *       - Usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_usuario:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Juan"
 *                       ap_paterno:
 *                         type: string
 *                         example: "Pérez"
 *                       ap_materno:
 *                         type: string
 *                         example: "Gómez"
 *                       correo:
 *                         type: string
 *                         example: "juan.perez@atmora.io"
 *                       rol:
 *                         type: string
 *                         enum: [admin, operador, visualizador]
 *                         example: "visualizador"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al recuperar los usuarios."
 */
const obtenerTodos = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['contrasena'] }
    });
    return res.status(200).json({
      status: 'success',
      data: usuarios
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     description: Recupera un usuario específico utilizando su identificador único.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_usuario:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Juan"
 *                     ap_paterno:
 *                       type: string
 *                       example: "Pérez"
 *                     ap_materno:
 *                       type: string
 *                       example: "Gómez"
 *                     correo:
 *                       type: string
 *                       example: "juan.perez@atmora.io"
 *                     rol:
 *                       type: string
 *                       enum: [admin, operador, visualizador]
 *                       example: "visualizador"
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el usuario con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al recuperar el usuario."
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el usuario con ID ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: usuario
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Registra un nuevo usuario en la plataforma. Valida que el correo no esté duplicado.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - ap_paterno
 *               - correo
 *               - contrasena
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               ap_paterno:
 *                 type: string
 *                 example: "Pérez"
 *               ap_materno:
 *                 type: string
 *                 example: "Gómez"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@atmora.io"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "Segura123!"
 *               rol:
 *                 type: string
 *                 enum: [admin, operador, visualizador]
 *                 example: "visualizador"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_usuario:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Juan"
 *                     ap_paterno:
 *                       type: string
 *                       example: "Pérez"
 *                     ap_materno:
 *                       type: string
 *                       example: "Gómez"
 *                     correo:
 *                       type: string
 *                       example: "juan.perez@atmora.io"
 *                     rol:
 *                       type: string
 *                       example: "visualizador"
 *       400:
 *         description: Solicitud incorrecta o correo ya registrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "El correo electrónico ya está registrado"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al registrar el usuario."
 */
const crear = async (req, res) => {
  try {
    const { nombre, ap_paterno, ap_materno, correo, contrasena, rol } = req.body;

    // Validación preventiva de duplicado de correo electrónico
    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'El correo electrónico ya está registrado'
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre,
      ap_paterno,
      ap_materno,
      correo,
      contrasena, // Se almacena tal como se recibe (asumiendo que viene cifrado o hooks del modelo se encargan de ello)
      rol
    });

    // Excluir la contraseña al retornar los datos creados
    const respuestaData = nuevoUsuario.toJSON();
    delete respuestaData.contrasena;

    return res.status(201).json({
      status: 'success',
      message: 'Usuario registrado correctamente',
      data: respuestaData
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     description: Actualiza los datos de un usuario específico. Si el correo se modifica, se verifica que no esté asignado a otro usuario.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Carlos"
 *               ap_paterno:
 *                 type: string
 *                 example: "Pérez"
 *               ap_materno:
 *                 type: string
 *                 example: "Martínez"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "jc.perez@atmora.io"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "NuevaSegura123!"
 *               rol:
 *                 type: string
 *                 enum: [admin, operador, visualizador]
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_usuario:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Juan Carlos"
 *                     ap_paterno:
 *                       type: string
 *                       example: "Pérez"
 *                     ap_materno:
 *                       type: string
 *                       example: "Martínez"
 *                     correo:
 *                       type: string
 *                       example: "jc.perez@atmora.io"
 *                     rol:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: Correo electrónico duplicado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "El correo electrónico ya está registrado por otro usuario"
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el usuario con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al actualizar el usuario."
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ap_paterno, ap_materno, correo, contrasena, rol } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el usuario con ID ${id}`
      });
    }

    // Verificar si el correo cambia y si ya está en uso por otro usuario
    if (correo && correo !== usuario.correo) {
      const correoDuplicado = await Usuario.findOne({ where: { correo } });
      if (correoDuplicado) {
        return res.status(400).json({
          status: 'error',
          message: 'El correo electrónico ya está registrado por otro usuario'
        });
      }
    }

    // Actualización de campos
    await usuario.update({
      nombre: nombre !== undefined ? nombre : usuario.nombre,
      ap_paterno: ap_paterno !== undefined ? ap_paterno : usuario.ap_paterno,
      ap_materno: ap_materno !== undefined ? ap_materno : usuario.ap_materno,
      correo: correo !== undefined ? correo : usuario.correo,
      contrasena: contrasena !== undefined ? contrasena : usuario.contrasena,
      rol: rol !== undefined ? rol : usuario.rol
    });

    const respuestaData = usuario.toJSON();
    delete respuestaData.contrasena;

    return res.status(200).json({
      status: 'success',
      message: 'Usuario actualizado correctamente',
      data: respuestaData
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     description: Remueve físicamente el registro de un usuario de la base de datos por su ID.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Usuario con ID 1 eliminado correctamente"
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No se encontró el usuario con ID 1"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Error en el servidor al eliminar el usuario."
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el usuario con ID ${id}`
      });
    }

    await usuario.destroy();

    return res.status(200).json({
      status: 'success',
      message: `Usuario con ID ${id} eliminado correctamente`
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
