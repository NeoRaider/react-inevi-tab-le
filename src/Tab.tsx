import React = require('react');

export interface TabDesc {
	title: string;
	icon?: string;
}

export class Tab {
	constructor(
		public desc: TabDesc,
		public content: React.ReactNode,
	) {}
}
