import { createStore, Store, Action } from "redux";
import { State } from "./types";
import { mainReducer } from "./reducer";
import { fromJS } from "immutable";

const initialState: State = fromJS({
  firstKey: 0,
  nestedDs: { randomProperty: 1 }
});

export const store: Store<State, Action> = createStore(
  mainReducer.bind(null, initialState)
);
