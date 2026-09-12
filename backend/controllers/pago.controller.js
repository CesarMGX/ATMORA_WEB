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

    let rawEmail = userEmail || usuario.correo;
    // Mercado Pago rechaza emails reales cuando el Access Token es de prueba (TEST-...)
    // arrojando: "Both payer and collector must be real or test users".
    // En modo TEST, si no es un email de testuser explícito, evitamos enviar payer_email para que el checkout no bloquee.
    const isTestEmail = rawEmail && (rawEmail.toLowerCase().includes('test') || rawEmail.toLowerCase().includes('testuser'));
    const validPayerEmail = isTestToken ? (isTestEmail ? rawEmail : undefined) : rawEmail;

    let initPoint = '';
    let sandboxInitPoint = '';
    let subscriptionId = '';

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

      if (validPayerEmail) {
        bodyPayload.payer_email = validPayerEmail;
      }

      const preapprovalData = await preapproval.create({ body: bodyPayload });

      initPoint = preapprovalData.init_point;
      sandboxInitPoint = preapprovalData.sandbox_init_point || preapprovalData.init_point;
      subscriptionId = preapprovalData.id;
    } catch (preApprovalError) {
      console.warn('ℹReintentando con Preference checkout por:', preApprovalError.message);
      
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

      if (validPayerEmail) {
        prefBody.payer = { email: validPayerEmail };
      }

      const preferenceData = await preference.create({ body: prefBody });

      initPoint = preferenceData.init_point;
      sandboxInitPoint = preferenceData.sandbox_init_point || preferenceData.init_point;
      subscriptionId = preferenceData.id;
    }

    // Si se está usando un token de prueba (TEST-), preferir el sandbox_init_point
    const finalUrl = (isTestToken && sandboxInitPoint) ? sandboxInitPoint : (initPoint || sandboxInitPoint);

    return res.status(200).json({
      status: 'success',
      init_point: finalUrl,
      sandbox_init_point: sandboxInitPoint || initPoint,
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

module.exports = {
  crearSuscripcion,
  webhook
};
