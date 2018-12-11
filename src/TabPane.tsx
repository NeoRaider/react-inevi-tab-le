import * as React from 'react';

import { Tab } from './Tab';
import { TabBar } from './TabBar';

export interface TabPaneProps {
	realm?: symbol;

	tabs: Record<string, Tab>;

	order?: string[];
	defaultOrder?: string[];

	active?: string;
	defaultActive?: string;

	onChange?: (tab: string) => void;
	onClose?: (tab: string) => void;

	onDrop?: (tab: string, index: number) => void;
}

interface TabPaneState {
	active?: string;
	order: string[];
}

export class TabPane extends React.Component<TabPaneProps, TabPaneState> {
	private readonly defaultRealm = Symbol('Tab realm');

	public constructor(props: TabPaneProps) {
		super(props);

		this.state = {
			active: props.defaultActive,
			order: props.defaultOrder || [],
		};
	}

	public render() {
		const { order: orderProp, active: activeProp, realm, tabs } = this.props;
		const { order: orderState, active: activeState } = this.state;

		const active = activeProp || activeState;
		const order = orderProp || orderState;

		return (
			<div className='tabPane'>
				<TabBar
					realm={realm || this.defaultRealm}
					tabs={tabs}
					order={order}
					active={active}
					onChange={this.handleChange}
					onClose={this.handleClose}
					onDrop={this.handleDrop}
				/>
				<div className='tabContent'>
					{active && tabs[active].content}
				</div>
			</div>
		);
	}

	private handleChange = (tab: string) => {
		this.setState({
			active: tab,
		});

		const { onChange } = this.props;
		if (onChange) {
			onChange(tab);
		}
	}

	private handleClose = (tab: string) => {
		this.setState(({ active: active, order: order }) => {
			const index = order.indexOf(tab);
			if (index < 0) {
				return null;
			}

			order = order.filter((t, i) => i !== index);

			if (tab === active) {
				if (index < order.length) {
					active = order[index];
				} else {
					active = order[order.length - 1];
				}
			}

			return {
				active,
				order,
			};
		});

		const { onClose } = this.props;
		if (onClose) {
			onClose(tab);
		}
	}

	private handleDrop = (tab: string, index: number) => {
		this.setState(({ order: oldOrder }) => {
			const order = oldOrder.slice(0);

			const oldIndex = order.indexOf(tab);
			if (oldIndex >= 0) {
				order.splice(oldIndex, 1);

				if (index <= oldIndex) {
					order.splice(index, 0, tab);
				} else {
					order.splice(index - 1, 0, tab);
				}
			}

			return {
				order,
			};
		});

		const { onDrop } = this.props;
		if (onDrop) {
			onDrop(tab, index);
		}
	}
}
