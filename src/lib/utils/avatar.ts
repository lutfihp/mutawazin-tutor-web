const COLORS = ['#2563EB', '#0D9488', '#7C3AED', '#E11D48', '#475569'];

export function avatarColor(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	}
	return COLORS[hash % COLORS.length];
}

export function initials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
}
