import * as React from 'react';
const { useEffect, useState, useRef } = React;

import { PortalNode, createPortalNode, InPortal } from 'react-reverse-portal';

import { LayoutManager, Direction, LayoutMap } from './LayoutManager';
import { Tab } from './Tab';

function useLayout(layoutManager: LayoutManager): LayoutMap | null {
	const [layoutState, setLayoutState] = useState<LayoutMap | null>(null);

	const handleUpdate = (layouts: LayoutMap): void => {
		setLayoutState(layouts);
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
	id: number;
	layouts: LayoutMap;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, PortalNode>;

	onSelect(tab: string): void;
	onClose(tab: string): void;
	onMove(tab: string, dest: number, pos: number): void;
	onMoveSplit(tab: string, dest: number, dir: Direction): void;
}

export interface LayoutProviderProps {
	layoutManager: LayoutManager;
	tabs: ReadonlyMap<string, Tab>;

	view: React.ComponentType<TabViewProps>;
}

export function LayoutProvider({ layoutManager, tabs, view }: LayoutProviderProps): JSX.Element | null {
	const realm = useRef(Symbol('Realm'));
	const layouts = useLayout(layoutManager);

	const tabPortals = useRefMap(tabs, (tab): [Tab, PortalNode] => {
		const portal = createPortalNode();
		portal.className = 'tabContent';
		return [tab, portal];
	});

	if (!layouts) {
		return null;
	}

	const View = view;

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
				id={1}
				layouts={layouts}
				realm={realm.current}
				tabs={tabs}
				portals={portals}
				onSelect={(tab): void => {
					layoutManager.selectTab(tab);
				}}
				onClose={(tab): void => {
					layoutManager.closeTab(tab);
				}}
				onMove={(tab: string, dest: number, pos: number): void => {
					layoutManager.moveTab(tab, dest, pos);
				}}
				onMoveSplit={(tab: string, dest: number, dir: Direction): void => {
					layoutManager.moveTabSplit(tab, dest, dir);
				}}
			/>
			{inPortals}
		</>
	);
}
