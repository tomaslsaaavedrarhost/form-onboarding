import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Error verifying email configuration:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send share invitation email
router.post('/send-share-invitation', async (req, res) => {
  console.log('Received share invitation request:', req.body);
  
  const { recipientEmail, ownerEmail, formId } = req.body;

  if (!recipientEmail || !ownerEmail || !formId) {
    console.error('Missing required fields:', { recipientEmail, ownerEmail, formId });
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      details: { recipientEmail: !recipientEmail, ownerEmail: !ownerEmail, formId: !formId }
    });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: 'Invitación para colaborar en un formulario',
      html: `
        <h2>Has sido invitado a colaborar en un formulario</h2>
        <p>${ownerEmail} te ha invitado a colaborar en su formulario de configuración.</p>
        <p>Puedes acceder al formulario iniciando sesión con tu cuenta de Google en nuestra aplicación.</p>
        <p>Una vez que inicies sesión, podrás ver y editar el formulario compartido.</p>
        <br>
        <p>¡Gracias por usar nuestra plataforma!</p>
      `,
    };

    console.log('Attempting to send email with options:', { 
      to: recipientEmail, 
      from: process.env.EMAIL_USER 
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
    
    return res.status(200).json({ 
      message: 'Invitación enviada exitosamente',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return res.status(500).json({ 
      error: 'Error al enviar la invitación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Notify users about form updates
router.post('/notify-form-update', async (req, res) => {
  const { formId, updatedBy, sharedWith } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sharedWith.join(','),
      subject: 'Actualización en formulario compartido',
      html: `
        <h2>El formulario compartido ha sido actualizado</h2>
        <p>${updatedBy} ha realizado cambios en el formulario que comparte contigo.</p>
        <p>Puedes ver los cambios iniciando sesión en la aplicación.</p>
        <br>
        <p>¡Gracias por usar nuestra plataforma!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Notificación enviada exitosamente' });
  } catch (error) {
    console.error('Error sending update notification:', error);
    res.status(500).json({ error: 'Error al enviar la notificación' });
  }
});

export default router; 