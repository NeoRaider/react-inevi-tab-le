import * as React from 'react';
import { useDrag } from 'react-dnd';

import { TabDesc, TabDragDesc, TabDragType, Realm } from './Tab';
import { TabDropArea } from './TabDropArea';
import { closeTab, selectTab, moveTab, GenericLayoutAction } from './layout/pane';

export interface TabHeaderProps<TabID> {
	tab: TabID;
	index: number;
	desc: TabDesc;
	isActive: boolean;

	realm: Realm<TabID>;

	dispatch(action: GenericLayoutAction<TabID>): void;
}

export function TabHeader<TabID>({ tab, index, desc, isActive, realm, dispatch }: TabHeaderProps<TabID>): JSX.Element {
	const item: TabDragDesc<TabID> = { type: TabDragType, id: tab, realm };
	const [{ isDragging }, drag] = useDrag({
		item,
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const handleMouseDown = (e: React.MouseEvent): void => {
		switch (e.button) {
			case 0:
				dispatch(selectTab(tab));
				break;

			case 1:
				if (desc.closable !== false) {
					dispatch(closeTab(tab));
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

		dispatch(closeTab(tab));
	};

	const className =
		'tabHeader' +
		(isActive ? ' active' : '') +
		(isDragging ? ' dragging' : '') +
		(desc.closable !== false ? ' closable' : '');

	return (
		<div ref={drag} className={className} onMouseDown={handleMouseDown}>
			<div className='dropAreaContainer'>
				<TabDropArea<TabID>
					realm={realm}
					onDrop={(tab): void => dispatch(moveTab(tab, index))}
					className='left'
				/>
				<TabDropArea<TabID>
					realm={realm}
					onDrop={(tab): void => dispatch(moveTab(tab, index + 1))}
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
