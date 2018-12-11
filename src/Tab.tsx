import React = require('react');

export const TabDragType = Symbol('Tab');

export interface TabDesc {
	title: string;
	icon?: string;
	closable?: boolean;
}

export interface Tab {
	desc: TabDesc;
	content: React.ReactNode;
}
