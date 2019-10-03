import { appendElement, insertElementAt, moveElementAt, removeElement, removeElementAt } from './util';

export type Split = 'horizontal' | 'vertical';

export interface InputSplitLayout {
	readonly split: Split;
	readonly children: ReadonlyArray<InputLayout>;
}

export interface SplitLayout extends InputSplitLayout {
	readonly id: string;
	readonly children: ReadonlyArray<Layout>;
}

export interface InputPaneLayout {
	readonly split: 'none';
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

export interface PaneLayout extends InputPaneLayout {
	readonly id: string;
}

export type InputLayout = InputPaneLayout | InputSplitLayout;
export type Layout = PaneLayout | SplitLayout;

interface FlatSplitLayout {
	split: Split;
	children: string[];
}

type FlatLayout = PaneLayout | FlatSplitLayout;

const emptyLayout: InputPaneLayout = {
	split: 'none',
	order: [],
	active: null,
};

export type LayoutUpdateListener<T> = (layout: Layout, tabs: ReadonlyMap<string, T>) => void;

export interface LayoutManager<T> {
	addUpdateListener(listener: LayoutUpdateListener<T>): void;
	removeUpdateListener(listener: LayoutUpdateListener<T>): void;

	selectTab(tab: string): boolean;
	closeTab(tab: string): boolean;
	moveTab(tab: string, pos: number, dest: string): boolean;
}

export class DefaultLayoutManager<T> implements LayoutManager<T> {
	protected static clonePaneLayout(layout: InputPaneLayout, id: string): PaneLayout {
		const { order, active } = layout;
		return {
			split: 'none',
			order: order.slice(0),
			active,
			id,
		};
	}

	protected static removeTab(layout: PaneLayout, tab: string): PaneLayout | null {
		const { id, active: prevActive, order: prevOrder } = layout;

		const index = prevOrder.indexOf(tab);
		if (index < 0) {
			return null;
		}

		const order = removeElementAt(prevOrder, index);

		let active = prevActive;
		if (tab === prevActive) {
			active = order[Math.min(index, order.length - 1)];
		}
		if (active === undefined) {
			active = null;
		}

		return {
			split: 'none',
			id,
			active,
			order,
		};
	}

	private nextID = 0;
	private root: string;
	private tabs: Map<string, T>;
	private layouts: Map<string, FlatLayout> = new Map();
	private tabPanes: Map<string, string> = new Map();
	private updateListeners: ReadonlyArray<LayoutUpdateListener<T>> = [];

	public constructor(tabs: Map<string, T> = new Map(), layout: InputLayout = emptyLayout) {
		this.tabs = new Map(tabs);
		this.root = this.flattenLayout(layout);
	}

	public addUpdateListener(listener: LayoutUpdateListener<T>): void {
		this.updateListeners = appendElement(this.updateListeners, listener);

		const layout = this.unflattenLayout();
		const tabs = new Map(this.tabs);

		this.updateOne(listener, layout, tabs);
	}

	public removeUpdateListener(listener: LayoutUpdateListener<T>): void {
		this.updateListeners = removeElement(this.updateListeners, listener);
	}

	public selectTab(tab: string): boolean {
		const pane = this.tabPanes.get(tab);
		if (!pane) {
			return false;
		}
		const layout = this.layouts.get(pane);
		if (!layout || layout.split !== 'none') {
			throw new Error('Data corruption');
		}

		if (layout.order.indexOf(tab) < 0) {
			return false;
		}

		this.layouts.set(pane, {
			...layout,
			active: tab,
		});

		this.update();
		return true;
	}

	public closeTab(tab: string): boolean {
		const pane = this.tabPanes.get(tab);
		if (!pane) {
			return false;
		}
		const layout = this.layouts.get(pane);
		if (!layout || layout.split !== 'none') {
			throw new Error('Data corruption');
		}

		const newLayout = DefaultLayoutManager.removeTab(layout, tab);
		if (!newLayout) {
			return false;
		}

		this.layouts.set(pane, newLayout);
		this.tabs.delete(tab);
		this.tabPanes.delete(tab);

		this.update();
		return true;
	}

	public moveTab(tab: string, pos: number, dest: string): boolean {
		const source = this.tabPanes.get(tab);
		if (!source) {
			return false;
		}

		const sourceLayout = this.layouts.get(source);
		if (!sourceLayout || sourceLayout.split !== 'none') {
			throw new Error('Data corruption');
		}

		if (source === dest) {
			const { order } = sourceLayout;
			const index = order.indexOf(tab);
			if (index < 0) {
				return false;
			}

			this.layouts.set(source, {
				...sourceLayout,
				order: moveElementAt(order, index, pos),
			});
		} else {
			const destLayout = this.layouts.get(dest);
			if (!destLayout || destLayout.split !== 'none') {
				return false;
			}

			const newSourceLayout = DefaultLayoutManager.removeTab(sourceLayout, tab);
			if (!newSourceLayout) {
				return false;
			}

			const { order } = destLayout;
			const newDestLayout = {
				...destLayout,
				order: insertElementAt(order, tab, pos),
				active: tab,
			};

			this.layouts.set(source, newSourceLayout);
			this.layouts.set(dest, newDestLayout);
			this.tabPanes.set(tab, dest);
		}

		this.update();
		return true;
	}

	protected newID(): string {
		return (this.nextID++).toString();
	}

	protected flattenLayout(layout: InputLayout): string {
		const id = this.newID();

		let flatLayout: FlatLayout;

		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				flatLayout = {
					split,
					children: children.map(this.flattenLayout, this),
				};
				break;

			case 'none':
				flatLayout = DefaultLayoutManager.clonePaneLayout(layout, id);
				for (const tab of layout.order) {
					this.tabPanes.set(tab, id);
				}
				break;

			default:
				throw new Error("Layout with invalid 'split' property");
		}

		this.layouts.set(id, flatLayout);

		return id;
	}

	protected unflattenLayout(id: string = this.root): Layout {
		const layout = this.layouts.get(id);
		if (!layout) {
			throw new Error('Data corruption');
		}

		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				return {
					id,
					split,
					children: children.map(this.unflattenLayout, this),
				};

			case 'none':
				return DefaultLayoutManager.clonePaneLayout(layout, layout.id);
		}
	}

	private updateOne(listener: LayoutUpdateListener<T>, layout: Layout, tabs: Map<string, T>): void {
		listener(layout, tabs);
	}

	private update(): void {
		const layout = this.unflattenLayout();
		const tabs = new Map(this.tabs);

		for (const listener of this.updateListeners) {
			this.updateOne(listener, layout, tabs);
		}
	}
}
