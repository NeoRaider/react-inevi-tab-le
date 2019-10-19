import * as React from 'react';
import { OutPortal } from 'react-reverse-portal';

import { TabBar } from './TabBar';
import { TabViewProps } from './LayoutProvider';
import { PaneLayout } from './LayoutManager';

export interface InternalTabPaneProps extends TabViewProps {
	layout: PaneLayout;
	children?: React.ReactNode;
}

export function InternalTabPane({
	children,
	realm,
	layout,
	tabs,
	portals,
	onSelect,
	onClose,
	onMove,
}: InternalTabPaneProps): JSX.Element {
	const { id, order, active } = layout;
	const activePortal = active ? portals.get(active) : undefined;

	return (
		<div className='tabPane'>
			<TabBar
				realm={realm}
				pane={id}
				tabs={tabs}
				order={order}
				active={active}
				onSelect={onSelect}
				onClose={onClose}
				onDrop={onMove}
			/>
			<div className='tabContentArea'>
				{children}
				{active && activePortal && <OutPortal key={active} node={activePortal} />}
			</div>
		</div>
	);
}

export function TabPane(props: TabViewProps): JSX.Element {
	const { id, layouts } = props;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const layout = layouts.get(id)!;

	if (layout.split !== 'none') {
		throw new Error('TabPane does not support split layouts');
	}

	return <InternalTabPane {...props} layout={layout} />;
}
