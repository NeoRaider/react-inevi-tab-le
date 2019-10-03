import * as React from 'react';
const { useEffect, useState, useRef } = React;

import { Layout, LayoutManager } from './LayoutManager';

interface LayoutState<T> {
	layout: Layout;
	tabs: ReadonlyMap<string, T>;
}

function useLayout<T>(layoutManager: LayoutManager<T>): LayoutState<T> | null {
	const [layoutState, setLayoutState] = useState<LayoutState<T> | null>(null);

	const handleUpdate = (layout: Layout, tabs: ReadonlyMap<string, T>): void => {
		setLayoutState({
			layout,
			tabs,
		});
	};

	useEffect(() => {
		layoutManager.addUpdateListener(handleUpdate);

		return (): void => layoutManager.removeUpdateListener(handleUpdate);
	}, [layoutManager]);

	return layoutState;
}

export interface TabViewProps<T> {
	realm: symbol;
	layout: Layout;
	tabs: ReadonlyMap<string, T>;

	onSelect(tab: string): boolean;
	onClose(tab: string): boolean;
	onMove(tab: string, pos: number, dest: string): boolean;
}

export interface LayoutProviderProps<T> {
	layoutManager: LayoutManager<T>;

	view: React.ComponentType<TabViewProps<T>>;
}

export function LayoutProvider<T>({ layoutManager, view }: LayoutProviderProps<T>): JSX.Element | null {
	const realm = useRef(Symbol('Realm'));
	const layoutState = useLayout(layoutManager);
	if (!layoutState) {
		return null;
	}

	const View = view;
	const { layout, tabs } = layoutState;

	return (
		<View
			layout={layout}
			tabs={tabs}
			realm={realm.current}
			onSelect={(tab): boolean => layoutManager.selectTab(tab)}
			onClose={(tab): boolean => layoutManager.closeTab(tab)}
			onMove={(tab: string, pos: number, dest: string): boolean =>
				layoutManager.moveTab(tab, pos, dest)
			}
		/>
	);
}
