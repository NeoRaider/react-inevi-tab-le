export function insertElementAt<T>(array: ReadonlyArray<T>, el: T, index: number): ReadonlyArray<T> {
	return [...array.slice(0, index), el, ...array.slice(index)];
}

export function removeElementAt<T>(array: ReadonlyArray<T>, index: number): ReadonlyArray<T> {
	return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function moveElementAt<T>(array: ReadonlyArray<T>, from: number, to: number): ReadonlyArray<T> {
	const el = array[from];
	const tmp = removeElementAt(array, from);
	return insertElementAt(tmp, el, from < to ? to - 1 : to);
}
