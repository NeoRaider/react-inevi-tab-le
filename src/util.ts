export function insertElementAt<T>(array: T[], el: T, index: number) {
	return [...array.slice(0, index), el, ...array.slice(index)];
}

export function replaceElementAt<T>(array: T[], el: T, index: number) {
	return [...array.slice(0, index), el, ...array.slice(index + 1)];
}

export function removeElementAt<T>(array: T[], index: number): T[] {
	return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function removeElement<T>(array: T[], el: T): T[] {
	const index = array.indexOf(el);
	if (index < 0) {
		return array;
	}

	return removeElementAt(array, index);
}

export function moveElementAt<T>(array: T[], from: number, to: number): T[] {
	const el = array[from];
	const tmp = removeElementAt(array, from);
	return insertElementAt(tmp, el, (from < to) ? (to - 1) : to);
}

export function moveElement<T>(array: T[], el: T, to: number): T[] {
	const index = array.indexOf(el);
	if (index < 0) {
		return array;
	}

	return moveElementAt(array, index, to);
}

export function ifset<T extends any[]>(f?: (...args: T) => void) {
	return (...args: T): void => {
		if (f) {
			f(...args);
		}
	};
}

export function def<T1, T2>(v: T1 | undefined, d: T2): T1 | T2 {
	if (v === undefined) {
		return d;
	}

	return v;
}
