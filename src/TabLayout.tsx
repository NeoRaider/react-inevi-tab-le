import * as React from 'react';

import { SplitPane } from 'react-multi-split-pane';

import { InternalTabPane } from './TabPane';
import { TabViewProps } from './LayoutProvider';
import { TabDropArea } from './TabDropArea';

export function TabLayout(props: TabViewProps): JSX.Element {
	const { layout } = props;

	if (layout.split === 'none') {
		const { realm, onMove } = props;
		const { id, order } = layout;

		return (
			<InternalTabPane {...props} layout={layout}>
				<TabDropArea realm={realm} onDrop={(): void => {}} className='top' />
				<div className='dropIndicator' />
				<TabDropArea realm={realm} onDrop={(): void => {}} className='bottom' />
				<div className='dropIndicator' />
				<TabDropArea realm={realm} onDrop={(): void => {}} className='left' />
				<div className='dropIndicator' />
				<TabDropArea realm={realm} onDrop={(): void => {}} className='right' />
				<div className='dropIndicator' />
				<TabDropArea
					realm={realm}
					onDrop={(tab): void => {
						if (!order.includes(tab)) {
							onMove(tab, id, order.length);
						}
					}}
					className='center'
				/>
				<div className='dropIndicator' />
			</InternalTabPane>
		);
	}

	const { children, split } = layout;
	return (
		<div className='tabLayout'>
			<SplitPane split={split} minSize={100}>
				{children.map((child) => (
					<TabLayout key={child.id} {...props} layout={child} />
				))}
			</SplitPane>
		</div>
	);
}
