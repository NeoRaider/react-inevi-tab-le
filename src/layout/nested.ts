import { Map } from 'immutable';

import { Split, Layout, LayoutMap } from './types';

export interface NestedSplitLayout {
	readonly split: Split;
	readonly children: ReadonlyArray<NestedLayout>;
}

export interface NestedPaneLayout {
	readonly split: 'none';
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

export type NestedLayout = NestedPaneLayout | NestedSplitLayout;

export function fromNested(layout: NestedLayout): LayoutMap {
	let layouts = Map<number, Layout>();
	let nextID = 1;

	function flatten(layout: NestedLayout, parent: number): number {
		const id = nextID++;
		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				if (children.length < 2) {
					throw new Error('Split layout with single child');
				}
				const flatChildren = children.map((c) => flatten(c, id));
				layouts = layouts.set(id, {
					split,
					children: flatChildren,
					parent,
				});
				break;

			case 'none':
				layouts = layouts.set(id, { ...layout, parent });
				break;

			default:
				throw new Error("Layout with invalid 'split' property");
		}

		return id;
	}

	flatten(layout, 0);

	return layouts;
}
