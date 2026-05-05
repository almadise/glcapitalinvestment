import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { type, to, data } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "GL Capital <onboarding@resend.dev>";
    const EMAIL_FOOTER =
      "GL Capital Investment SA · Paris-France & World Office · General Luxury SA, Calle Nord 35, 17700 La Jonquera, Girona, Spain";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let subject = "";
    let html = "";

    if (type === "email_verification") {
      subject = `GL Capital — Verify your email address`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060F1E; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">GL Capital Investment SA</h1>
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0 0;">Conseil en Financement Institutionnel</p>
          </div>
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Verify your email address</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Hello <strong>${data?.name || "Client"}</strong>,</p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Thank you for registering with GL Capital. Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data?.verificationUrl}" style="background: #C9A84C; color: #060F1E; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
              Verify Email Address →
            </a>
          </div>
          <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px;">Or copy this link into your browser:</p>
            <p style="color: #C9A84C; font-size: 11px; word-break: break-all; margin: 0; font-family: monospace;">${data?.verificationUrl}</p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.6;">
            This link expires in <strong style="color: rgba(255,255,255,0.6);">24 hours</strong>. If you did not create an account, please ignore this email.
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 32px;">
            ${EMAIL_FOOTER}
          </p>
        </div>
      `;
    } else if (type === "contact_confirmation") {
      subject = `GL Capital — Confirmation de réception / Submission Received`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060F1E; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">GL Capital Investment SA</h1>
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0 0;">Conseil en Financement Institutionnel</p>
          </div>
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Demande reçue / Request Received</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Bonjour <strong>${data?.name || "Client"}</strong>,</p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Nous avons bien reçu votre demande de contact concernant un projet de <strong style="color: #C9A84C;">${data?.amount || "montant non précisé"}</strong> pour la société <strong>${data?.company || ""}</strong>.
          </p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Notre équipe vous contactera sous <strong style="color: #C9A84C;">48 heures ouvrées</strong> pour un accusé de réception et une analyse de pré-éligibilité.
          </p>
          <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
              GL Capital ne garantit pas l'obtention d'un financement. Toute transaction est exécutée exclusivement par des institutions financières dûment agréées.
            </p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 32px;">
            ${EMAIL_FOOTER}
          </p>
        </div>
      `;
    } else if (type === "contact_admin_notification") {
      subject = `[GL Capital] Nouvelle demande de contact — ${data?.company || "Inconnu"}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1F3A; color: #ffffff; padding: 40px; border-radius: 12px;">
          <h2 style="color: #C9A84C; margin-bottom: 24px;">Nouvelle demande de contact</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px; width: 140px;">Nom</td><td style="color: #fff; padding: 8px 0; font-size: 13px;">${data?.name || "-"}</td></tr>
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px;">Société</td><td style="color: #fff; padding: 8px 0; font-size: 13px;">${data?.company || "-"}</td></tr>
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px;">Email</td><td style="color: #C9A84C; padding: 8px 0; font-size: 13px;">${data?.email || "-"}</td></tr>
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px;">Téléphone</td><td style="color: #fff; padding: 8px 0; font-size: 13px;">${data?.phone || "-"}</td></tr>
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px;">Pays</td><td style="color: #fff; padding: 8px 0; font-size: 13px;">${data?.country || "-"}</td></tr>
            <tr><td style="color: rgba(255,255,255,0.5); padding: 8px 0; font-size: 13px;">Montant</td><td style="color: #C9A84C; padding: 8px 0; font-size: 13px; font-weight: bold;">${data?.amount || "-"}</td></tr>
          </table>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px;">Message:</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; line-height: 1.6;">${data?.message || "-"}</p>
          </div>
        </div>
      `;
    } else if (type === "dossier_status_update") {
      subject = `GL Capital — Mise à jour de votre dossier ${data?.ref || ""}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060F1E; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">GL Capital Investment SA</h1>
          </div>
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Mise à jour de votre dossier</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Bonjour <strong>${data?.clientName || "Client"}</strong>,</p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Le statut de votre dossier <strong style="color: #C9A84C; font-family: monospace;">${data?.ref || ""}</strong> a été mis à jour.
          </p>
          <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Nouveau statut</p>
            <p style="color: #C9A84C; font-size: 20px; font-weight: bold; margin: 0;">${data?.newStatus || ""}</p>
          </div>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Connectez-vous à votre espace client pour consulter les détails et les prochaines étapes.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data?.portalUrl || "https://glcapital8049.builtwithrocket.new/client-portal-dashboard"}" style="background: #C9A84C; color: #060F1E; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Accéder à mon espace →
            </a>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 32px;">
            ${EMAIL_FOOTER}
          </p>
        </div>
      `;
    } else if (type === "dossier_submission_confirmation") {
      subject = `GL Capital — Dossier reçu : ${data?.ref || ""}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060F1E; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">GL Capital Investment SA</h1>
          </div>
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Dossier soumis avec succès</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Bonjour <strong>${data?.clientName || "Client"}</strong>,</p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Votre dossier de financement a bien été reçu et sera examiné par notre équipe.
          </p>
          <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Numéro de référence</p>
            <p style="color: #C9A84C; font-size: 28px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 4px;">${data?.ref || ""}</p>
          </div>
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6;">
            Conservez cette référence pour toutes vos communications. Notre équipe vous contactera sous 1 à 3 jours ouvrés.
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 32px;">
            ${EMAIL_FOOTER}
          </p>
        </div>
      `;
    } else if (type === "institutional_introduction") {
      subject = `GL Capital — Introduction institutionnelle — ${data?.ref || ""}`;
      html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060F1E; color: #ffffff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">GL Capital Investment SA</h1>
          </div>
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Introduction institutionnelle</h2>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">Bonjour <strong>${data?.clientName || "Client"}</strong>,</p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Votre dossier <strong style="color: #C9A84C; font-family: monospace;">${data?.ref || ""}</strong> a été soumis à nos partenaires institutionnels agréés pour examen.
          </p>
          <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">
            Cette étape marque le début du processus de structuration formelle. Vous serez contacté directement par l'institution partenaire dans les meilleurs délais.
          </p>
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0; line-height: 1.6;">
              Toutes les communications sont couvertes par l'accord NCNDA. Les coordonnées de l'institution partenaire sont confidentielles et ne seront pas divulguées.
            </p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin-top: 32px;">
            ${EMAIL_FOOTER}
          </p>
        </div>
      `;
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: result?.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
