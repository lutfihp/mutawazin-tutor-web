export function formatDate(iso: string, locale = 'en'): string {
	try {
		return new Date(iso).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	} catch {
		return iso;
	}
}

export function relativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);
	const weeks = Math.floor(days / 7);

	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
	return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

export function formatMonth(year: number, month: number, locale = 'en'): string {
	return new Date(year, month, 1).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
		month: 'long',
		year: 'numeric',
	});
}

export function getDaysInMonth(year: number, month: number): Date[] {
	const days: Date[] = [];
	const date = new Date(Date.UTC(year, month, 1));
	while (date.getUTCMonth() === month) {
		days.push(new Date(date));
		date.setUTCDate(date.getUTCDate() + 1);
	}
	return days;
}

export function toISODate(date: Date): string {
	return date.toISOString().split('T')[0];
}

export function formatSessionWindow(starts_at: string, ends_at: string, locale = 'en'): string {
	try {
		const startTime = starts_at.slice(11, 16);
		const endTime   = ends_at.slice(11, 16);
		const dateStr   = starts_at.slice(0, 10);
		const date = new Date(dateStr + 'T00:00:00Z');
		const formatted = date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
			weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
		});
		return `${startTime} – ${endTime} · ${formatted}`;
	} catch {
		return starts_at;
	}
}

export function calendarGrid(year: number, month: number): (Date | null)[] {
	const firstDay = new Date(Date.UTC(year, month, 1));
	// Monday-start: 0=Mon ... 6=Sun
	const startOffset = (firstDay.getUTCDay() + 6) % 7;
	const days = getDaysInMonth(year, month);
	const grid: (Date | null)[] = Array(startOffset).fill(null).concat(days);
	// Pad to full rows of 7
	while (grid.length % 7 !== 0) grid.push(null);
	return grid;
}
