import * as React from 'react';

import { TabDesc } from './Tab';

export interface TabHeaderProps {
	tab: TabDesc;
	active: boolean;

	onClose?: () => void;
	onSelect?: () => void;
}

export class TabHeader extends React.Component<TabHeaderProps> {
	public render() {
		const { active, tab } = this.props;

		return (
			<div className={'tabHeader' + (active ? ' active' : '')} onClick={this.handleClick}>
				<span className='tabTitle'>
					{tab.title}
				</span>
				<span className='tabCloser' onClick={this.handleClose} />
			</div>
		);
	}

	private handleClick = (e: React.MouseEvent) => {
		e.preventDefault();

		const { onSelect } = this.props;
		if (onSelect) {
			onSelect();
		}
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
