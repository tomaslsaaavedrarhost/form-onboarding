import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send share invitation email
router.post('/send-share-invitation', async (req, res) => {
  const { recipientEmail, ownerEmail, formId } = req.body;

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

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Invitación enviada exitosamente' });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ error: 'Error al enviar la invitación' });
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