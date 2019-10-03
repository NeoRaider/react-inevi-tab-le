import * as React from 'react';

import { TabBar } from './TabBar';
import { TabViewProps } from './LayoutProvider';
import { OutPortal } from 'react-reverse-portal';

export function TabPane({ realm, layout, tabs, portals, onSelect, onClose, onMove }: TabViewProps): JSX.Element | null {
	if (layout.split !== 'none') {
		throw new Error('TabPane does not support split layouts');
	}

	const { id, order, active } = layout;
	const activePortal = active ? portals.get(active) : undefined;

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
			{active && activePortal && <OutPortal key={active} node={activePortal} />}
		</div>
	);
}
