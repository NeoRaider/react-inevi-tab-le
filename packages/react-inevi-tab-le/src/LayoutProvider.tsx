import * as React from 'react';
const { useRef } = React;

import { HtmlPortalNode, createHtmlPortalNode, InPortal } from 'react-reverse-portal';

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

export function useTabPortals(tabs: ReadonlyMap<string, Tab>): Map<string, [HtmlPortalNode, JSX.Element]> {
	return useRefMap(tabs, ({ content }, key): [HtmlPortalNode, JSX.Element] => {
		const portal = createHtmlPortalNode();
		portal.element.className = 'tabContent';

		const el = (
			<InPortal key={key} node={portal}>
				{content}
			</InPortal>
		);
		return [portal, el];
	});
}
