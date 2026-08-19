import path from 'path';

export function formatDate(date) {
	const d = new Date(date);
	const day = d.getDate();
	const monthNames = [
		'Januar',
		'Februar',
		'März',
		'April',
		'Mai',
		'Juni',
		'Juli',
		'August',
		'September',
		'Oktober',
		'November',
		'Dezember',
	];
	const monthName = monthNames[d.getMonth()];
	const year = d.getFullYear();
	return `${day}. ${monthName} ${year}`;
}

export function toArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

export function normalizeDisplayValue(value, fallback = null) {
	if (value === null || value === undefined) return fallback;
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'object') {
		if (value.name) return value.name;
		if (value.display_name) return value.display_name;
		if (value.title) return value.title;
	}
	return fallback;
}

export function getFileBaseName(fileName) {
	return path.parse(fileName).name;
}

export function buildFullMatchRegExp(pattern, flags = '') {
	return new RegExp(`^(?:${pattern})$`, flags);
}

export function replaceCaptureGroups(template, match) {
	return template.replace(/\$(\d+)/g, (_, groupIndex) => match[Number(groupIndex)] ?? '');
}

export function hasAnyReferencedCaptureValue(template, match) {
	const referencedGroups = [...template.matchAll(/\$(\d+)/g)].map((token) => Number(token[1]));
	if (referencedGroups.length === 0) return true;
	return referencedGroups.some((groupIndex) => {
		const value = match[groupIndex];
		return value !== undefined && value !== null && value !== '';
	});
}

export function applyRenamePattern(entry, fileName) {
	const renamePatterns = toArray(entry.rename_patterns);
	if (renamePatterns.length === 0) return null;

	const candidate = getFileBaseName(fileName);

	for (const rule of renamePatterns) {
		if (!rule || typeof rule.pattern !== 'string' || rule.pattern.length === 0) {
			continue;
		}

		let regex;
		try {
			regex = buildFullMatchRegExp(rule.pattern, rule.flags || '');
		} catch (error) {
			console.warn(`Invalid rename pattern for ${entry.display_name}:`, error.message);
			continue;
		}

		if (!regex.test(candidate)) {
			continue;
		}

		const match = candidate.match(regex);
		if (!match) {
			continue;
		}

		const displayName = typeof rule.display_name === 'string' ? replaceCaptureGroups(rule.display_name, match).trim() : null;
		const date = typeof rule.date === 'string' && hasAnyReferencedCaptureValue(rule.date, match)
			? replaceCaptureGroups(rule.date, match).trim()
			: null;

		return {
			display_name: displayName,
			date
		};
	}

	return null;
}

export function buildDocumentFileData(entry, fileName, stats) {
	const fileData = {
		file_name: fileName,
		date: formatDate(stats.mtime),
		date_iso: stats.mtime.toISOString(),
		date_ts: stats.mtime.getTime(),
		path: `/docs/${entry.directory}/${fileName}`,
	};

	const renamedFile = applyRenamePattern(entry, fileName);
	if (renamedFile) {
		if (renamedFile.display_name) fileData.display_name = renamedFile.display_name;
		if (renamedFile.date) fileData.date = renamedFile.date;
	}

	const override = toArray(entry.files).find((item) => item.file_name === fileName);
	if (override) {
		if (override.display_name) fileData.display_name = override.display_name;
		if (override.date) fileData.date = override.date;
	}

	return fileData;
}