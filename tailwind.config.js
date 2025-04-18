module.exports = {
	content: [
	  './pages/**/*.{js,ts,jsx,tsx}', // Ajoute ici les dossiers et fichiers Next.js où tu utilises Tailwind
	  './components/**/*.{js,ts,jsx,tsx}'
	],
	darkMode: 'class', // Permet de basculer en mode sombre via la classe "dark"
	theme: {
	  extend: {
		colors: {
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
		  muted: 'hsl(var(--muted))',
		  'muted-foreground': 'hsl(var(--muted-foreground))',
		  popover: 'hsl(var(--popover))',
		  'popover-foreground': 'hsl(var(--popover-foreground))',
		  card: 'hsl(var(--card))',
		  'card-foreground': 'hsl(var(--card-foreground))',
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  primary: 'hsl(var(--primary))',
		  'primary-foreground': 'hsl(var(--primary-foreground))',
		  secondary: 'hsl(var(--secondary))',
		  'secondary-foreground': 'hsl(var(--secondary-foreground))',
		  accent: 'hsl(var(--accent))',
		  'accent-foreground': 'hsl(var(--accent-foreground))',
		  destructive: 'hsl(var(--destructive))',
		  'destructive-foreground': 'hsl(var(--destructive-foreground))',
		  ring: 'hsl(var(--ring))',
		  'chart-1': 'hsl(var(--chart-1))',
		  'chart-2': 'hsl(var(--chart-2))',
		  'chart-3': 'hsl(var(--chart-3))',
		  'chart-4': 'hsl(var(--chart-4))',
		  'chart-5': 'hsl(var(--chart-5))',
		}
	  }
	},
	plugins: [],
  }
