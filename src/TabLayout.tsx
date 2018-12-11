import * as React from 'react';

import Splitter from 'm-react-splitters';

import { Tab } from './Tab';
import { removeTab, TabPane, TabPaneState } from './TabPane';
import { def, insertElementAt, moveElement } from './util';

export interface TabLayoutProps {
	realm?: {};

	tabs: Record<string, Tab>;

	order1?: string[];
	defaultOrder1?: string[];
	order2?: string[];
	defaultOrder2?: string[];

	active1?: string | null;
	defaultActive1?: string;
	active2?: string | null;
	defaultActive2?: string;
}

interface TabLayoutState {
	panes: TabPaneState[];
}

export class TabLayout extends React.Component<TabLayoutProps, TabLayoutState> {
	public constructor(props: TabLayoutProps) {
		super(props);

		const {
			defaultOrder1,
			defaultActive1,
			defaultOrder2,
			defaultActive2,
		} = props;

		this.state = {
			panes: [
				{
					active: def(defaultActive1, null),
					order: def(defaultOrder1, []),
				},
				{
					active: def(defaultActive2, null),
					order: def(defaultOrder2, []),
				},
			],
		};
	}

	public render() {
		const {
			realm: realmProp,
			tabs,
			order1: order1Prop,
			active1: active1Prop,
			order2: order2Prop,
			active2: active2Prop,
		} = this.props;
		const {
			panes: [
				{
					order: order1State,
					active: active1State,
				},
				{
					order: order2State,
					active: active2State,
				},
			],
		} = this.state;

		const realm = def(realmProp, this);

		const active1 = def(active1Prop, active1State);
		const order1 = def(order1Prop, order1State);
		const active2 = def(active2Prop, active2State);
		const order2 = def(order2Prop, order2State);

		return (
			<Splitter
				position='vertical'
				primaryPaneWidth='50%'
			>
				<TabPane
					realm={realm}
					source={0}
					tabs={tabs}
					order={order1}
					active={active1}
					onChange={this.handleChange(0)}
					onClose={this.handleClose(0)}
					onDrop={this.handleDrop(0)}
				/>
				<TabPane
					realm={realm || this}
					source={1}
					tabs={tabs}
					order={order2}
					active={active2}
					onChange={this.handleChange(1)}
					onClose={this.handleClose(1)}
					onDrop={this.handleDrop(1)}
				/>
			</Splitter>
		);
	}

	private withPane = (
		pane: number,
		f: (ps: Readonly<TabPaneState>) => Partial<TabPaneState> | null,
	) => (
		{ panes }: TabLayoutState,
	): TabLayoutState => {
		const front = panes.slice(0, pane);
		const prev = panes[pane];
		const after = f(panes[pane]) || {};
		const back = panes.slice(pane + 1);

		return {
			panes: front.concat([{ ...prev, ...after }], back),
		};
	}

	private setPaneState = (
		pane: number,
		f: (ps: Readonly<TabPaneState>) => Partial<TabPaneState> | null,
	) => {
		this.setState(this.withPane(pane, f));
	}

	private handleChange = (pane: number) => (tab: string) => {
		this.setPaneState(pane, () => {
			return {
				active: tab,
			};
		});
	}

	private handleClose = (pane: number) => (tab: string) => {
		this.setPaneState(pane, removeTab(tab));
	}

	private handleDrop = (pane: number) => (tab: string, index: number, source: number) => {
		if (pane === source) {
			this.setPaneState(pane, ({ order }) => {
				return {
					order: moveElement(order, tab, index),
				};
			});
		} else {
			this.setPaneState(source, removeTab(tab));
			this.setPaneState(pane, ({ order }) => {
				return {
					order: insertElementAt(order, tab, index),
					active: tab,
				};
			});
		}
	}
}
