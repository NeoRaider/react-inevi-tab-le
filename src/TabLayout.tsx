import * as React from 'react';

import { SplitPane } from 'react-multi-split-pane';

import { InternalTabPane } from './TabPane';
import { TabViewProps } from './LayoutProvider';
import { TabDropArea } from './TabDropArea';
import { Direction } from './LayoutManager';

interface TabSplitAreaProps extends TabViewProps {
	dir: Direction;
	ignore?: string;
}

function TabSplitArea({ realm, layout, dir, ignore, onMoveSplit }: TabSplitAreaProps): JSX.Element {
	const { id } = layout;

	return (
		<>
			<TabDropArea
				realm={realm}
				ignore={ignore}
				onDrop={(tab): void => {
					onMoveSplit(tab, id, dir);
				}}
				className={dir}
			/>
			<div className='dropIndicator' />
		</>
	);
}

export function TabLayout(props: TabViewProps): JSX.Element {
	const { layout } = props;

	if (layout.split === 'none') {
		const { realm, onMove } = props;
		const { id, order } = layout;

		const ignore = order.length === 1 ? order[0] : undefined;

		return (
			<InternalTabPane {...props} layout={layout}>
				<TabSplitArea {...props} dir='top' ignore={ignore} />
				<TabSplitArea {...props} dir='bottom' ignore={ignore} />
				<TabSplitArea {...props} dir='left' ignore={ignore} />
				<TabSplitArea {...props} dir='right' ignore={ignore} />
				<TabDropArea
					realm={realm}
					ignore={ignore}
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
