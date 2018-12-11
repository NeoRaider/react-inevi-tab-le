import * as React from 'react';
import { ConnectDragSource, DragSource, DragSourceConnector, DragSourceMonitor } from 'react-dnd';

import { TabDesc, TabDragType } from './Tab';
import { TabDropArea } from './TabDropArea';

export interface TabHeaderProps {
	id: string;
	tab: TabDesc;
	isActive: boolean;

	realm: symbol;

	onSelect?: () => void;
	onClose?: () => void;

	onDropLeft?: (tab: string) => void;
	onDropRight?: (tab: string) => void;
}

interface TabHeaderSourceProps {
	connectDragSource: ConnectDragSource;
	isDragging: boolean;
}

const tabHeaderSource = {
	beginDrag({id, realm}: TabHeaderProps) {
		return {
			id,
			realm,
		};
	},
};

function collect(
	connect: DragSourceConnector,
	monitor: DragSourceMonitor,
): TabHeaderSourceProps {
	return {
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	};
}

class _TabHeader extends React.Component<TabHeaderProps & TabHeaderSourceProps> {
	public render() {
		const {
			tab,
			isActive,
			realm,
			isDragging,
			connectDragSource,
			onDropLeft,
			onDropRight,
		} = this.props;

		const className = (
			'tabHeader'
			+ (isActive ? ' active' : '')
			+ (isDragging ? ' dragging' : '')
			+ ((tab.closable !== false) ? ' closable' : '')
		);

		return connectDragSource(
			<div className={className} onMouseDown={this.handleMouseDown}>
				<div className='dropAreaContainer'>
					<TabDropArea realm={realm} onDrop={onDropLeft} className='left' />
					<TabDropArea realm={realm} onDrop={onDropRight} className='right' />
				</div>
				<div className='tabHeaderContent'>
					<span className='tabTitle'>
						{tab.title}
					</span>
					{tab.closable !== false &&
						<span
							className='tabCloser'
							onMouseDown={this.handleMouseDownClose}
							onClick={this.handleClose}
						/>
					}
				</div>
			</div>,
		);

	}

	private handleMouseDown = (e: React.MouseEvent) => {
		switch (e.button) {
		case 0:
			const { onSelect } = this.props;
			if (onSelect) {
				onSelect();
			}
			break;

		case 1:
			const { tab, onClose } = this.props;
			if (tab.closable !== false && onClose) {
				onClose();
			}
			break;
		}
	}

	private handleMouseDownClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}

	private handleClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const { onClose } = this.props;
		if (onClose) {
			onClose();
		}
	}
}

export const TabHeader = DragSource(TabDragType, tabHeaderSource, collect)(_TabHeader);
