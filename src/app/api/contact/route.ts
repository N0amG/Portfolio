import nodemailer from "nodemailer";

const rateLimitIpMap: Map<string, number> =
  (globalThis as Record<string, unknown>).rateLimitIpMap as Map<string, number> ??
  new Map<string, number>();
(globalThis as Record<string, unknown>).rateLimitIpMap = rateLimitIpMap;

export async function POST(req: Request) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return Response.json(
      { error: "Tous les champs sont requis." },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const lastSent = rateLimitIpMap.get(ip);
  if (lastSent && now - lastSent < 5 * 60 * 1000) {
    return Response.json(
      {
        error:
          "Vous avez déjà envoyé un message récemment. Merci de patienter 5 minutes avant de réessayer.",
      },
      { status: 429 }
    );
  }

  rateLimitIpMap.set(ip, now);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Portfolio : Nouveau message de ${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return Response.json(
      { message: "Email envoyé avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return Response.json(
      { error: "Erreur lors de l'envoi de l'email." },
      { status: 500 }
    );
  }
}
