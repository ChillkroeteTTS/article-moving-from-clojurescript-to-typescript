import { Map } from "immutable";

interface ImmutableOf<T> extends Map<string, any> {
  toJS(): T;
  get<K extends keyof T>(key: K): T[K];
}

export type Datastructure1 = ImmutableOf<{
  randomProperty: number;
}>;

export type State = ImmutableOf<{
  firstKey: boolean;
  nestedDs: Datastructure1;
}>;

interface ActionWithoutParams {
  type: "action1" | "action2";
}

export interface Action3 {
  type: "action3";
  param1: number;
  param2: boolean;
}

export type Action = ActionWithoutParams | Action3;

export type ActionType = Action["type"];
