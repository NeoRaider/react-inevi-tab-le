import { insertElementAt, removeElementAt, moveElementAt } from 'react-inevi-tab-le/dist/layout/util';
export { insertElementAt, removeElementAt, moveElementAt };

export function insertElementsAt<T>(array: ReadonlyArray<T>, els: ReadonlyArray<T>, index: number): ReadonlyArray<T> {
	return [...array.slice(0, index), ...els, ...array.slice(index)];
}

export function removeElement<T>(array: ReadonlyArray<T>, el: T): ReadonlyArray<T> {
	const index = array.indexOf(el);
	if (index < 0) {
		return array;
	}

	return removeElementAt(array, index);
}
