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
    console.error('⚠️ Error al inicializar Mercado Pago SDK:', err.message);
  }
} else {
  console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno.');
}

/**
 * POST /api/pagos/crear-suscripcion
 * Genera un Checkout / PreApproval de Mercado Pago para el plan Atmora PRO ($39 MXN/mes)
 */
const crearSuscripcion = async (req, res) => {
  try {
    const { id_usuario, email } = req.body;
    
    // Si no vienen en req.body, intentar obtener del usuario autenticado si existe en el objeto req
    const userId = id_usuario || (req.user && req.user.id_usuario);
    const userEmail = email || (req.user && req.user.correo);

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'El id_usuario es obligatorio para asociar la suscripción.'
      });
    }

    // Buscar al usuario en la base de datos para validar su correo
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró ningún usuario registrado con ID #${userId}`
      });
    }

    const payerEmail = userEmail || usuario.correo;
    const frontendUrl = process.env.FRONTEND_URL || 'https://atmora-web.vercel.app';

    if (!mpClient) {
      // Si el cliente no está inicializado (por ejemplo en entorno de pruebas sin token), retornar URL simulada/sandbox
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

    try {
      // Intentar primero con PreApproval (Suscripción Recurrente oficial de Mercado Pago)
      const preapproval = new PreApproval(mpClient);
      const preapprovalData = await preapproval.create({
        body: {
          reason: 'Atmora PRO - Acceso a Predicciones IA',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 39,
            currency_id: 'MXN'
          },
          back_url: `${frontendUrl}/precios?status=success`,
          payer_email: payerEmail,
          external_reference: String(userId),
          status: 'authorized'
        }
      });

      initPoint = preapprovalData.init_point;
      sandboxInitPoint = preapprovalData.sandbox_init_point || preapprovalData.init_point;
      subscriptionId = preapprovalData.id;
    } catch (preApprovalError) {
      console.warn('ℹ️ Reintentando con Preference checkout por:', preApprovalError.message);
      
      // Fallback a Preference de checkout
      const preference = new Preference(mpClient);
      const preferenceData = await preference.create({
        body: {
          items: [
            {
              id: 'atmora-pro-mensual',
              title: 'Atmora PRO - Acceso a Predicciones IA',
              unit_price: 39,
              quantity: 1,
              currency_id: 'MXN'
            }
          ],
          payer: {
            email: payerEmail
          },
          back_urls: backUrls,
          auto_return: 'approved',
          external_reference: String(userId),
          metadata: {
            id_usuario: userId
          }
        }
      });

      initPoint = preferenceData.init_point;
      sandboxInitPoint = preferenceData.sandbox_init_point || preferenceData.init_point;
      subscriptionId = preferenceData.id;
    }

    return res.status(200).json({
      status: 'success',
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
      subscription_id: subscriptionId
    });

  } catch (error) {
    console.error('❌ Error al crear suscripción en Mercado Pago:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al comunicarse con Mercado Pago',
      details: error.message
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

    console.log(`🔔 Webhook recibido de Mercado Pago: topic=${topic}, action=${action}, resourceId=${resourceId}`);

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
            console.log(`✅ Usuario #${userId} actualizado exitosamente a PRO_MENSUAL por Webhook PreApproval.`);
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
          console.log(`✅ Usuario #${userId} actualizado a PRO_MENSUAL por Webhook Payment.`);
        }
      }
    }

    // Responder siempre 200 OK a Mercado Pago para confirmar recepción
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('⚠️ Error al procesar Webhook de Mercado Pago:', error.message);
    return res.status(200).json({ status: 'ok', warning: error.message });
  }
};

module.exports = {
  crearSuscripcion,
  webhook
};
