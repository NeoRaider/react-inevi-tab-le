import * as React from 'react';

import { Tab } from './Tab';
import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';

export interface TabBarProps {
	realm: symbol;

	tabs: ReadonlyMap<string, Tab>;
	order: ReadonlyArray<string>;
	active: string | null;

	onSelect: (tab: string) => void;
	onClose: (tab: string) => void;

	onDrop: (tab: string, pos: number) => void;
}

export function TabBar({ realm, active, order, tabs, onSelect, onClose, onDrop }: TabBarProps): JSX.Element {
	const entries = order.map((id, i) => {
		const tab = tabs.get(id);
		if (!tab) {
			return null;
		}

		return (
			<TabHeader
				realm={realm}
				key={id}
				id={id}
				tab={tab.desc}
				isActive={id === active}
				onSelect={(): void => onSelect(id)}
				onClose={(): void => onClose(id)}
				onDropLeft={(t): void => onDrop(t, i)}
				onDropRight={(t): void => onDrop(t, i + 1)}
			/>
		);
	});

	return (
		<div className='tabBar'>
			{entries}
			<TabDropArea realm={realm} onDrop={(tab): void => onDrop(tab, order.length)} className='rest' />
		</div>
	);
}
