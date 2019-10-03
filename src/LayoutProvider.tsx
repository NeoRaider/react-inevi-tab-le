import * as React from 'react';
const { useEffect, useState, useRef } = React;

import { PortalNode, createPortalNode, InPortal } from 'react-reverse-portal';

import { Layout, LayoutManager } from './LayoutManager';
import { Tab } from './Tab';

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

function useRefMap<K, V1, V2>(inMap: ReadonlyMap<K, V1>, f: (v: V1, k: K) => V2): Map<K, V2> {
	const map = useRef(new Map<K, V2>());

	const prevMap = map.current;
	map.current = new Map<K, V2>();

	inMap.forEach((v, k) => {
		map.current.set(k, prevMap.get(k) || f(v, k));
	});

	return map.current;
}

export interface TabViewProps {
	realm: symbol;
	layout: Layout;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, PortalNode>;

	onSelect(tab: string): boolean;
	onClose(tab: string): boolean;
	onMove(tab: string, pos: number, dest: string): boolean;
}

export interface LayoutProviderProps {
	layoutManager: LayoutManager<Tab>;

	view: React.ComponentType<TabViewProps>;
}

export function LayoutProvider({ layoutManager, view }: LayoutProviderProps): JSX.Element | null {
	const realm = useRef(Symbol('Realm'));
	const layoutState = useLayout(layoutManager);
	const tabs: ReadonlyMap<string, Tab> = layoutState ? layoutState.tabs : new Map();

	const tabPortals = useRefMap(tabs, (tab): [Tab, PortalNode] => {
		const portal = createPortalNode();
		portal.className = 'tabContent';
		return [tab, portal];
	});

	if (!layoutState) {
		return null;
	}

	const View = view;
	const { layout } = layoutState;

	const portals = new Map<string, PortalNode>();
	const inPortals: JSX.Element[] = [];
	tabPortals.forEach(([{ content }, portal], id) => {
		portals.set(id, portal);
		inPortals.push(
			<InPortal key={id} node={portal}>
				{content}
			</InPortal>,
		);
	});

	return (
		<>
			<View
				layout={layout}
				realm={realm.current}
				tabs={tabs}
				portals={portals}
				onSelect={(tab): boolean => layoutManager.selectTab(tab)}
				onClose={(tab): boolean => layoutManager.closeTab(tab)}
				onMove={(tab: string, pos: number, dest: string): boolean =>
					layoutManager.moveTab(tab, pos, dest)
				}
			/>
			{inPortals}
		</>
	);
}
