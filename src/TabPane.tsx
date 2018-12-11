import * as React from 'react';

import { Tab } from './Tab';
import { TabBar } from './TabBar';
import { def, ifset, moveElement, removeElementAt } from './util';

export interface TabPaneProps {
	realm?: {};
	source?: {};

	tabs: Record<string, Tab>;

	order?: string[];
	defaultOrder?: string[];

	active?: string | null;
	defaultActive?: string | null;

	onChange?: (tab: string) => void;
	onClose?: (tab: string) => void;

	onDrop?: (tab: string, index: number, source: any) => void;
}

export interface TabPaneState {
	active: string | null;
	order: string[];
}

export function removeTab(tab: string): ((state: TabPaneState) => TabPaneState | null) {
	return ({ active: prevActive, order: prevOrder }) => {
		const index = prevOrder.indexOf(tab);
		if (index < 0) {
			return null;
		}

		const order = removeElementAt(prevOrder, index);

		let active = prevActive;
		if (tab === prevActive) {
			active = def(order[Math.min(index, order.length - 1)], null);
		}

		return {
			active,
			order,
		};
	};
}

export class TabPane extends React.Component<TabPaneProps, TabPaneState> {
	public constructor(props: TabPaneProps) {
		super(props);

		const {
			defaultActive,
			defaultOrder,
		} = props;

		this.state = {
			active: def(defaultActive, null),
			order: def(defaultOrder, []),
		};
	}

	public render() {
		const {
			order: orderProp,
			active: activeProp,
			realm: realmProp,
			source,
			tabs,
		} = this.props;
		const {
			order: orderState,
			active: activeState,
		} = this.state;

		const realm = def(realmProp, this);

		const active = def(activeProp, activeState);
		const order = def(orderProp, orderState);

		return (
			<div className='tabPane'>
				<TabBar
					realm={realm}
					source={source}
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

		ifset(this.props.onChange)(tab);
	}

	private handleClose = (tab: string) => {
		this.setState(removeTab(tab));

		ifset(this.props.onClose)(tab);
	}

	private handleDrop = (tab: string, index: number, source: any) => {
		this.setState(({ order }) => {
			return {
				order: moveElement(order, tab, index),
			};
		});

		ifset(this.props.onDrop)(tab, index, source);
	}
}
