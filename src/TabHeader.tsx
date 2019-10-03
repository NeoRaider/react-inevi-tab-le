import * as React from 'react';
import { useDrag } from 'react-dnd';

import { TabDesc, TabDragDesc, TabDragType } from './Tab';
import { TabDropArea } from './TabDropArea';

export interface TabHeaderProps {
	id: string;
	tab: TabDesc;
	isActive: boolean;

	realm: symbol;

	onSelect: () => void;
	onClose: () => void;

	onDropLeft: (tab: string) => void;
	onDropRight: (tab: string) => void;
}

export function TabHeader({
	id,
	tab,
	isActive,
	realm,
	onDropLeft,
	onDropRight,
	onClose,
	onSelect,
}: TabHeaderProps): JSX.Element {
	const item: TabDragDesc = { type: TabDragType, id, realm };
	const [{ isDragging }, drag] = useDrag({
		item,
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const handleMouseDown = (e: React.MouseEvent): void => {
		switch (e.button) {
			case 0:
				onSelect();
				break;

			case 1:
				if (tab.closable !== false) {
					onClose();
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

		onClose();
	};

	const className =
		'tabHeader' +
		(isActive ? ' active' : '') +
		(isDragging ? ' dragging' : '') +
		(tab.closable !== false ? ' closable' : '');

	return (
		<div ref={drag} className={className} onMouseDown={handleMouseDown}>
			<div className='dropAreaContainer'>
				<TabDropArea realm={realm} onDrop={onDropLeft} className='left' />
				<TabDropArea realm={realm} onDrop={onDropRight} className='right' />
			</div>
			<div className='tabHeaderContent'>
				<span className='tabTitle'>{tab.title}</span>
				{tab.closable !== false && (
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
