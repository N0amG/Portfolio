"use client";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici, vous pouvez ajouter la logique d'envoi (API, email, etc.)
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-background">
      <main className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Contactez-moi</h1>
        {submitted ? (
          <div className="text-green-600 text-center font-semibold">Merci pour votre message !</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1">
              Nom
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </label>
            <label className="flex flex-col gap-1">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </label>
            <label className="flex flex-col gap-1">
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </label>
            <button
              type="submit"
              className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
            >
              Envoyer
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
