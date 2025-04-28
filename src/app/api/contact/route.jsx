// Envoi de l'email (exemple avec Nodemailer)
const nodemailer = require('nodemailer');

// Stockage temporaire en mémoire pour le rate limiting (clé = IP, valeur = timestamp dernier envoi)
const rateLimitIpMap = global.rateLimitIpMap || new Map();
global.rateLimitIpMap = rateLimitIpMap;

export async function POST(req) {
	const { name, email, message } = await req.json();

	// Vérification des champs requis
	if (!name || !email || !message) {
		return new Response(JSON.stringify({ error: 'Tous les champs sont requis.' }), { status: 400 });
	}

	// Récupération de l'adresse IP du client
	const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || req.ip || 'unknown';
	console.log('IP du client:', ip);
	// Limite d'un message par heure par IP
	const now = Date.now();
	const lastSent = rateLimitIpMap.get(ip);
	if (lastSent && now - lastSent < 5 * 60 * 1000) {
		return new Response(JSON.stringify({ error: 'Vous avez déjà envoyé un message récemment depuis cette adresse IP. Merci de patienter 5min avant de réessayer.' }), { status: 429 });
	}

	// Mise à jour du timestamp d'envoi
	rateLimitIpMap.set(ip, now);

	const transporter = nodemailer.createTransport({
		service: 'gmail',
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
		// Réponse de succès
		return new Response(JSON.stringify({ message: 'Email envoyé avec succès.' }), { status: 200 });
	} catch (error) {
		console.error('Erreur lors de l\'envoi de l\'email:', error);
		return new Response(JSON.stringify({ error: "Erreur lors de l'envoi de l'email.", details: error.message }), { status: 500 });
	}
}
