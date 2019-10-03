import * as React from 'react';

import { TabBar } from './TabBar';
import { Tab } from './Tab';
import { TabViewProps } from './LayoutProvider';

export function TabPane({ realm, layout, tabs, onSelect, onClose, onMove }: TabViewProps<Tab>): JSX.Element | null {
	if (layout.split !== 'none') {
		throw new Error('TabPane does not support split layouts');
	}

	const { id, order, active } = layout;
	const activeTab = active ? tabs.get(active) : undefined;
	const content = activeTab ? activeTab.content : null;

	return (
		<div className='tabPane'>
			<TabBar
				realm={realm}
				tabs={tabs}
				order={order}
				active={active}
				onSelect={onSelect}
				onClose={onClose}
				onDrop={(tab, pos): boolean => onMove(tab, pos, id)}
			/>
			{active && (
				<div key={active} className='tabContent'>
					{content}
				</div>
			)}
		</div>
	);
}
