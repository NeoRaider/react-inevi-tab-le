export interface Action {
	type: string;
}

export type ActionType<A extends Action> = A['type'];
export type ActionOf<A extends Action, T extends ActionType<A>> = Extract<A, { type: T }>;

export type ActionHandler<A extends Action, S, T extends ActionType<A>> = (state: S, action: ActionOf<A, T>) => S;
export type ActionHandlerMap<A extends Action, S> = {
	[T in ActionType<A>]: ActionHandler<A, S, T>;
};
