import { ActionHandlerMap, ActionHandler } from './action';
import { insertElementAt, moveElementAt, removeElementAt } from '../util';

// State type
export interface Layout {
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

// Actions and action creators
export interface LayoutActionSelectTab {
	type: 'selectTab';
	tab: string;
}
export function selectTab(tab: string): LayoutAction {
	return { type: 'selectTab', tab };
}

export interface LayoutActionInsertTab {
	type: 'insertTab';
	tab: string;
	pos: number;
}
export function insertTab(tab: string, pos: number): LayoutAction {
	return { type: 'insertTab', tab, pos };
}

export interface LayoutActionMoveTab {
	type: 'moveTab';
	tab: string;
	pos: number;
}
export function moveTab(tab: string, pos: number): LayoutAction {
	return { type: 'moveTab', tab, pos };
}

export interface LayoutActionCloseTab {
	type: 'closeTab';
	tab: string;
}
export function closeTab(tab: string): LayoutAction {
	return { type: 'closeTab', tab };
}

export type LayoutAction = LayoutActionSelectTab | LayoutActionInsertTab | LayoutActionMoveTab | LayoutActionCloseTab;

// Action handlers
const HANDLERS: ActionHandlerMap<LayoutAction, Layout> = {
	selectTab(layout: Layout, { tab }: LayoutActionSelectTab): Layout {
		if (layout.order.indexOf(tab) < 0) {
			return layout;
		}

		return { ...layout, active: tab };
	},

	insertTab(layout: Layout, { tab, pos }: LayoutActionInsertTab): Layout {
		return {
			...layout,
			order: insertElementAt(layout.order, tab, pos),
			active: tab,
		};
	},

	moveTab(layout: Layout, { tab, pos }: LayoutActionMoveTab): Layout {
		const { order } = layout;
		const index = order.indexOf(tab);
		if (index < 0) {
			return layout;
		}

		return {
			...layout,
			order: moveElementAt(order, index, pos),
		};
	},

	closeTab(layout: Layout, { tab }: LayoutActionCloseTab): Layout {
		let { active, order } = layout;

		const index = order.indexOf(tab);
		if (index < 0) {
			return layout;
		}

		order = removeElementAt(order, index);

		if (tab === active) {
			active = order[Math.min(index, order.length - 1)];
		}
		if (active === undefined) {
			active = null;
		}

		return {
			...layout,
			active,
			order,
		};
	},
};

export function reducer<L extends Layout>(layout: L, action: LayoutAction): L {
	const handler = HANDLERS[action.type] as ActionHandler<LayoutAction, Layout, typeof action.type>;
	return handler(layout, action) as L;
}
