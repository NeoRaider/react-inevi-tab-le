import * as React from 'react';
import { useDrag } from 'react-dnd';

import { TabDesc, TabDragDesc, TabDragType } from './Tab';
import { TabDropArea } from './TabDropArea';
import { LayoutAction, closeTab, selectTab, moveTab } from './layout/dockable';

export interface TabHeaderProps {
	tab: string;
	pane: number;
	index: number;
	desc: TabDesc;
	isActive: boolean;

	realm: symbol;

	dispatch(action: LayoutAction): void;
}

export function TabHeader({ tab, pane, index, desc, isActive, realm, dispatch }: TabHeaderProps): JSX.Element {
	const item: TabDragDesc = { type: TabDragType, id: tab, source: pane, realm };
	const [{ isDragging }, drag] = useDrag({
		item,
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const handleMouseDown = (e: React.MouseEvent): void => {
		switch (e.button) {
			case 0:
				dispatch(selectTab(tab, pane));
				break;

			case 1:
				if (desc.closable !== false) {
					dispatch(closeTab(tab, pane));
				}
				break;
		}
	};

	const handleMouseDownClose = (e: React.MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleClose = (e: React.MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		dispatch(closeTab(tab, pane));
	};

	const className =
		'tabHeader' +
		(isActive ? ' active' : '') +
		(isDragging ? ' dragging' : '') +
		(desc.closable !== false ? ' closable' : '');

	return (
		<div ref={drag} className={className} onMouseDown={handleMouseDown}>
			<div className='dropAreaContainer'>
				<TabDropArea
					realm={realm}
					onDrop={(tab, source): void => dispatch(moveTab(tab, source, pane, index))}
					className='left'
				/>
				<TabDropArea
					realm={realm}
					onDrop={(tab, source): void => dispatch(moveTab(tab, source, pane, index + 1))}
					className='right'
				/>
			</div>
			<div className='tabHeaderContent'>
				<span className='tabTitle'>{desc.title}</span>
				{desc.closable !== false && (
					<span
						className='tabCloser'
						onMouseDown={handleMouseDownClose}
						onClick={handleClose}
					/>
				)}
			</div>
		</div>
	);
}
