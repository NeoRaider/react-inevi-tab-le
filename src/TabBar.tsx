import * as React from 'react';

import { Tab } from './Tab';
import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';

export interface TabBarProps {
	realm: symbol;
	pane: number;

	tabs: ReadonlyMap<string, Tab>;
	order: ReadonlyArray<string>;
	active: string | null;

	onSelect: (tab: string, pane: number) => void;
	onClose: (tab: string, pane: number) => void;

	onDrop: (tab: string, source: number, dest: number, pos: number) => void;
}

export function TabBar({ realm, pane, active, order, tabs, onSelect, onClose, onDrop }: TabBarProps): JSX.Element {
	const entries = order.map((id, i) => {
		const tab = tabs.get(id);
		if (!tab) {
			return null;
		}

		return (
			<TabHeader
				realm={realm}
				pane={pane}
				key={id}
				id={id}
				tab={tab.desc}
				isActive={id === active}
				onSelect={(): void => onSelect(id, pane)}
				onClose={(): void => onClose(id, pane)}
				onDropLeft={(tab, source): void => onDrop(tab, source, pane, i)}
				onDropRight={(tab, source): void => onDrop(tab, source, pane, i + 1)}
			/>
		);
	});

	return (
		<div className='tabBar'>
			{entries}
			<TabDropArea
				realm={realm}
				onDrop={(tab, source): void => onDrop(tab, source, pane, order.length)}
				className='rest'
			/>
		</div>
	);
}
