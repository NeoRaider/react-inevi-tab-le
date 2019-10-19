import * as React from 'react';
const { useReducer, useRef } = React;

import { PortalNode, createPortalNode, InPortal } from 'react-reverse-portal';

import { LayoutMap, layoutReducer, LayoutAction } from './LayoutManager';
import { Tab } from './Tab';

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

	dispatch(action: LayoutAction): void;
}

export interface LayoutProviderProps {
	initialLayout: LayoutMap;
	tabs: ReadonlyMap<string, Tab>;

	view: React.ComponentType<TabViewProps>;
}

export function LayoutProvider({ initialLayout, tabs, view }: LayoutProviderProps): JSX.Element | null {
	const realm = useRef(Symbol('Realm')).current;

	const [layouts, dispatch] = useReducer(layoutReducer, initialLayout);

	const tabPortals = useRefMap(tabs, (tab): [Tab, PortalNode] => {
		const portal = createPortalNode();
		portal.className = 'tabContent';
		return [tab, portal];
	});

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
				{...{
					realm,
					layouts,
					dispatch,
					tabs,
					portals,
				}}
			/>
			{inPortals}
		</>
	);
}
