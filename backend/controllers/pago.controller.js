'use strict';

const { MercadoPagoConfig, PreApproval, Preference } = require('mercadopago');
const { Usuario } = require('../models');

// Inicializar cliente de Mercado Pago con el token de acceso
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
let mpClient = null;

if (accessToken) {
  try {
    mpClient = new MercadoPagoConfig({ accessToken });
  } catch (err) {
    console.error('Error al inicializar Mercado Pago SDK:', err.message);
  }
} else {
  console.warn('MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno.');
}

/**
 * POST /api/pagos/crear-suscripcion
 * Genera un Checkout / PreApproval de Mercado Pago para el plan Atmora PRO ($39 MXN/mes)
 */
const crearSuscripcion = async (req, res) => {
  try {
    const { id_usuario, email } = req.body;
    
    // Obtener id de usuario
    const userId = id_usuario || (req.user && req.user.id_usuario);
    const userEmail = email || (req.user && req.user.correo);

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'El id_usuario es obligatorio para asociar la suscripción.'
      });
    }

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró ningún usuario registrado con ID #${userId}`
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://atmora-web.vercel.app';
    const isTestToken = accessToken.startsWith('TEST-');
    const rawEmail = userEmail || usuario.correo;

    if (!mpClient) {
      return res.status(200).json({
        status: 'success',
        init_point: `${frontendUrl}/precios?status=success`,
        sandbox_init_point: `${frontendUrl}/precios?status=success`,
        simulated: true,
        message: 'MERCADOPAGO_ACCESS_TOKEN no configurado; retornando flujo de prueba.'
      });
    }

    const backUrls = {
      success: `${frontendUrl}/precios?status=success`,
      failure: `${frontendUrl}/precios?status=failure`,
      pending: `${frontendUrl}/precios?status=pending`
    };

    let initPoint = '';
    let sandboxInitPoint = '';
    let subscriptionId = '';

    // En modo Sandbox (TEST-), NO enviamos el email real del usuario autenticado a Mercado Pago
    // para evitar la excepción "Both payer and collector must be real or test users".
    // Solo enviamos el email en credenciales de producción (APP_USR-).
    const payerEmailToUse = (!isTestToken && rawEmail && !rawEmail.includes('test')) ? rawEmail : undefined;

    try {
      // 1. Intentar con PreApproval (Suscripción Recurrente)
      const preapproval = new PreApproval(mpClient);
      const bodyPayload = {
        reason: 'Atmora PRO - Acceso a Predicciones IA',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 39,
          currency_id: 'MXN'
        },
        back_url: `${frontendUrl}/precios?status=success`,
        external_reference: String(userId),
        status: 'authorized'
      };

      if (payerEmailToUse) {
        bodyPayload.payer_email = payerEmailToUse;
      }

      const preapprovalData = await preapproval.create({ body: bodyPayload });

      initPoint = preapprovalData.init_point;
      sandboxInitPoint = preapprovalData.sandbox_init_point || preapprovalData.init_point;
      subscriptionId = preapprovalData.id;
    } catch (preApprovalError) {
      console.log('ℹ️ Generando Checkout de preferencia de suscripción...');
      
      // 2. Fallback a Preference de checkout
      const preference = new Preference(mpClient);
      const prefBody = {
        items: [
          {
            id: 'atmora-pro-mensual',
            title: 'Atmora PRO - Acceso a Predicciones IA',
            unit_price: 39,
            quantity: 1,
            currency_id: 'MXN'
          }
        ],
        back_urls: backUrls,
        auto_return: 'approved',
        external_reference: String(userId),
        metadata: {
          id_usuario: userId
        }
      };

      if (payerEmailToUse) {
        prefBody.payer = { email: payerEmailToUse };
      }

      const preferenceData = await preference.create({ body: prefBody });

      initPoint = preferenceData.init_point;
      sandboxInitPoint = preferenceData.sandbox_init_point || preferenceData.init_point;
      subscriptionId = preferenceData.id;
    }

    // En modo TEST-, retornar siempre sandbox_init_point. En producción (APP_USR-), retornar init_point.
    const finalUrl = isTestToken ? (sandboxInitPoint || initPoint) : (initPoint || sandboxInitPoint);

    return res.status(200).json({
      status: 'success',
      init_point: finalUrl,
      sandbox_init_point: sandboxInitPoint || initPoint,
      subscription_id: subscriptionId
    });

  } catch (error) {
    console.error('Error al crear suscripción en Mercado Pago:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al comunicarse con Mercado Pago',
      details: error.message
    });
  }
};

/**
 * POST /api/pagos/confirmar-exito
 * Permite la actualización inmediata de la suscripción al retornar exitosamente del checkout
 */
const confirmarExito = async (req, res) => {
  try {
    const { id_usuario, email } = req.body;
    let userId = id_usuario || (req.user && req.user.id_usuario);

    if (!userId && email) {
      const u = await Usuario.findOne({ where: { correo: email } });
      if (u) userId = u.id_usuario;
    }

    if (!userId) {
      // Si no se envió id_usuario, tomar el usuario #1 por defecto para desarrollo
      userId = 1;
    }

    await Usuario.update(
      {
        tipo_suscripcion: 'PRO_MENSUAL',
        subscription_status: 'authorized'
      },
      { where: { id_usuario: userId } }
    );

    const usuarioActualizado = await Usuario.findByPk(userId);
    console.log(`✅ Usuario #${userId} actualizado exitosamente a PRO_MENSUAL mediante redirección de éxito.`);

    return res.status(200).json({
      status: 'success',
      message: 'Suscripción PRO_MENSUAL activada con éxito',
      tipo_suscripcion: 'PRO_MENSUAL',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al confirmar éxito de suscripción:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * POST /api/pagos/webhook
 * Recibe notificaciones de eventos (Webhooks / IPN) de Mercado Pago
 */
const webhook = async (req, res) => {
  try {
    const { type, action, data } = req.body;
    const topic = req.query.topic || req.query.type || type;
    const resourceId = (data && data.id) || req.query.id || req.body.id;

    console.log(`Webhook recibido de Mercado Pago: topic=${topic}, action=${action}, resourceId=${resourceId}`);

    if (topic === 'subscription_preapproval' || topic === 'preapproval') {
      if (mpClient && resourceId) {
        const preapproval = new PreApproval(mpClient);
        const preapprovalInfo = await preapproval.get({ id: resourceId });

        if (preapprovalInfo && (preapprovalInfo.status === 'authorized' || preapprovalInfo.status === 'active')) {
          const userId = preapprovalInfo.external_reference;
          if (userId) {
            await Usuario.update(
              {
                tipo_suscripcion: 'PRO_MENSUAL',
                subscription_id: String(resourceId),
                payer_id: preapprovalInfo.payer_id ? String(preapprovalInfo.payer_id) : null,
                subscription_status: preapprovalInfo.status
              },
              { where: { id_usuario: userId } }
            );
            console.log(`Usuario #${userId} actualizado exitosamente a PRO_MENSUAL por Webhook PreApproval.`);
          }
        }
      }
    } else if (topic === 'payment' || action === 'payment.created') {
      const externalRef = req.body?.data?.id || req.body?.external_reference;
      if (externalRef && req.body?.status === 'approved') {
        const userId = req.body?.external_reference || req.body?.metadata?.id_usuario;
        if (userId) {
          await Usuario.update(
            {
              tipo_suscripcion: 'PRO_MENSUAL',
              subscription_status: 'approved'
            },
            { where: { id_usuario: userId } }
          );
          console.log(`Usuario #${userId} actualizado a PRO_MENSUAL por Webhook Payment.`);
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error al procesar Webhook de Mercado Pago:', error.message);
    return res.status(200).json({ status: 'ok', warning: error.message });
  }
};

/**
 * POST /api/pagos/cancelar-suscripcion
 * Cancela la suscripción activa del usuario en el sistema y en Mercado Pago (si aplica)
 */
const cancelarSuscripcion = async (req, res) => {
  try {
    const { id_usuario, email } = req.body;
    let userId = id_usuario || (req.user && req.user.id_usuario);

    if (!userId && email) {
      const u = await Usuario.findOne({ where: { correo: email } });
      if (u) userId = u.id_usuario;
    }

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'No se especificó el ID de usuario para cancelar la suscripción.'
      });
    }

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró el usuario con ID #${userId}`
      });
    }

    if (mpClient && usuario.subscription_id) {
      try {
        const preapproval = new PreApproval(mpClient);
        await preapproval.update({
          id: usuario.subscription_id,
          body: { status: 'cancelled' }
        });
        console.log(`PreApproval #${usuario.subscription_id} cancelado en Mercado Pago.`);
      } catch (mpErr) {
        console.warn(`No se pudo cancelar en Mercado Pago directamente (${mpErr.message}), actualizando en BD local.`);
      }
    }

    await usuario.update({
      tipo_suscripcion: 'GRATIS',
      subscription_status: 'cancelled'
    });

    console.log(`❌ Suscripción del usuario #${userId} cancelada exitosamente.`);

    return res.status(200).json({
      status: 'success',
      message: 'Suscripción cancelada exitosamente.',
      tipo_suscripcion: 'GRATIS',
      subscription_status: 'cancelled'
    });
  } catch (error) {
    console.error('Error al cancelar la suscripción:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  crearSuscripcion,
  confirmarExito,
  cancelarSuscripcion,
  webhook
};
