import * as log from "loglevel";
import { State, ActionType, Action3 } from "./types";
import { Action } from "redux";
import { Map } from "immutable";

type ActionFn = (state: State, action: Action) => State;

let wiring = Map<ActionType, ActionFn>();

export function clearReducers() {
  wiring = Map<ActionType, ActionFn>();
}

export function registerReducer(type: ActionType, fn: ActionFn) {
  wiring = wiring.set(type, fn);
  return type;
}

export function mainReducer(initialState: State, state: State, action: Action) {
  if (typeof state === "undefined") return initialState; //initialise store/state
  if (!wiring.has(action.type)) {
    const errStr = `Couldn't find action from type ${action.type}`;
    log.error(errStr);
    throw errStr;
  } else {
    const reducer = wiring.get(action.type)!;
    const newState = reducer(state, action);
    if (newState == undefined)
      throw `State returned by reducer ${action.type} is faulty.`;
    return newState;
  }
}

export function registerReducers() {
  clearReducers();
  registerReducer("action1", function(state: State) {
    return state.set("firstKey", true);
  });
  registerReducer("action3", function(state: State, action: Action3) {
    return state.setIn(["nestedDs", "randomProperty"], action.param1);
  });
}
