After finishing my first React Native application with Clojurescript, my next application felt like a good opportunity to revisit Javascript. Although I love Clojure(script), using third-party libraries clearly designed for JS proved to be a painful experience.
As my last intensive contact with Javascript was 3 years ago, I was curious about how my own perspective and the language itself evolved. However, programming wouldn't be programming if this project wouldn't have its pitfalls prepared for me.
By sharing my experience I hope to spare you from some mistakes I did.

After my time using Clojure I didn't want to miss concepts like the great state management I was used from [(re-frame)](https://github.com/Day8/re-frame), Clojure's immutable data structures and a flexible way to assert their structure [(clojure.spec)](https://clojure.org/about/spec).
Luckily I found promising counterparts in Javascript. Namely [redux (State Management)](https://redux.js.org/), [Immutable.JS](https://facebook.github.io/immutable-js/) and [Typescript](https://www.typescriptlang.org/). Setting them up was pretty straightforward and especially Typescript amazed me by not forcing you into some tight rule corset - if you don't feel the need to type everything, just turn the rule off.
The only thing I couldn't find a replacement for is my precious REPL, but you can't have everything I guess... Anyway, let's get started!

## Main Differences

In this part, I want to talk briefly about the main differences between the aforementioned Clojurescript+re-frame tech stack and Typescript+redux. If you are familiar with Javascript/React (Native)/Redux you can easily skip this section. Also, this is far from a thorough guide and does not replace a good look at each technologies documentation.

### Redux

Coming from re-frame, understanding redux is easy. You can compare re-frames 'dominoes' directly to the concepts of redux. What the `app-state` is for re-frame is the `store` for redux. However, there are a few things to consider:

- Instead of being managed by the re-frame library, redux's `store` is an object created by yourself, e.g. `const store = createStore(reducer)`.
- Mutating your state happens by explicit calls to the object methods of your store. In theory, you could have multiple stores in your application... However, don't do something just because you can. The creators of re-frame [explain](https://github.com/Day8/re-frame/blob/master/docs/ApplicationState.md) way better than I ever could why it's a good idea to have your state in one place.
- As a result, I distinguish between the `store` and the `state` where the former controls the mutation of the latter.

**1st Domino: Event Dispatch**

What re-frame describes as `event` is in redux an `action`. It is a plain JS object containing the key 'type', e.g. `{type: 'logout'}`.
Actions are dispatched by a function literally called `store.dispatch(action)`

**2nd/3rd Domino: Event/Effect Handling**

Instead of registering different event handlers as in re-frame, redux passes each action to a function given to the store while creation. This function is called a `reducer`. The reducer takes the current snapshot of the state and the action to be handled as parameters, computes a new state version based on the action's 'type' property and returns it. More about how I designed my reducer function comes later in [#Adding Reducers](#adding-reducers).

**4th Domino: Query**

It is worth mentioning that in theory, redux's functionality ends here by providing the `store.subscribe(listener)` function. This subscribe function is not to be confused with the one re-frame provides and much more low-level. In redux `subscribe` registers a state listener which is called **any time** the state **might** have changed. For comparison, components using re-frame's `subscribe` function are re-rendered only if the part of the state that's of interest actually changed.

A better comparison (and commonly used) is [react-redux](https://github.com/reduxjs/react-redux).
It provides you with the `connect(mapStateToProps)(YourComponent)` function which returns you a wrapped version of your component. This wrapped version's props contain injected data from your state as defined in your `mapStateToProps` function.

_Example Using connect() and mapStateToProps()_

```
const mapStateToProps = (state: State) => {
  return {
    noEmptyNames: state.names.filter(str=>str!=="")
  }
}

const MyUnmappedComponent(props) {
  return <View> {props.noEmptyNames.map(person => <Person key={person.name} name={person.name} />)} </View>
}

export const MyComponent = connect(mapStateToProps)(MyUnmappedComponent)
```

**5th Domino: View**

_Example Simple JSX_

```
return <Text>2+2={2+2}</Text> /* Evaluates to 2+2=4 */
```

[JSX](https://reactjs.org/docs/introducing-jsx.html) is an HTML like syntax extension used to describe your React (Native) UI. Formerly using [Hiccup](https://github.com/weavejester/hiccup) I did have some moments where I missed having simple lists for this but JSX really does a good job. It compiles to function calls and thus can be handled (almost) as easily as any other first-class citizen.

_Example JSX as Datastructure_

```
  const persons = List(['Lucy', 'Andrew']);
  const personsJsx = persons.map(name => <Person key={name} name={name} />)
  return <View> {personsJsx} </View>
```

### The Struggle with **this**

For all our stateful components we need to create classes so they can hold the UI state. Maybe it's just me but intuitively I would say the following looks rock solid:

_Simple Stateful Component_

```
class ThisIsAwesome extends Component<any> {
  state: {toggle:boolean}
  constructor(props) {
    super(props);
    this.state = {toggle:false}
  }

  switchToggle() {this.setState({ toggle: !this.state.toggle })}

  render() {
      <Button onPress={this.switchToggle2}>
      <Text>{this.state.toggle.toString()}</Text>
      </Button>
  }
}
```

However, for Javascript, the **this** in the switchToggle function refers to the Button object which leads to an exception because Button misses a state member named 'toggle'. I saw some people fixing this by binding each function's **this** in the constructor:

_Explicit this Binding_

```
constructor(props) {
  super(props);
  this.state = { toggle: false };
  this.switchToggle = this.switchToggle.bind(this);
}
```

In my opinion, this is not just tedious, it is also error prone(easy to forget) and somehow nagging on my immutable opinion on mutability.
Instead, I use an arrow function for each and every class function. This way I can stop thinking about this matter.

_Implicit this Binding With Arrow Functions_

```
switchToggle2 = () => { this.setState({ toggle: !this.state.toggle }) }
```

### Adding Reducers

I didn't like the way redux handles actions with a giant [switch statement](https://redux.js.org/basics/reducers#handling-actions).
Redux proposes an [alternative](https://redux.js.org/recipes/reducingboilerplate#generating-reducers) which is nice because it offers pluggable action handlers. However complex action handlers need to be defined in a dedicated function with which I end up having 2 places to edit: the function definition and the mapping from action type to function.

I ended up using an approach similar to reframe where I can dynamically register reducers during runtime:

```
type ActionFn = (state: State, action: Action) => State;

let wiring = Map<ActionType, ActionFn>();

export function registerReducer(type: ActionType, fn: ActionFn) {
  wiring = wiring.set(type, fn);
  return type;
}

function mainReducer(initialState: State, state: State, action: Action) {
  if (typeof state === "undefined") return initialState;
  if (!wiring.has(action.type)) {
    const errStr = `Couldn't find action from type ${action.type}`
    log.error(errStr);
    throw errStr;
  } else {
    const reducer = wiring.get(action.type)!;
    const newState = reducer(state, action);
    if (newState == undefined) throw `State returned by reducer ${action.type} is faulty.";
    return newState;
  }
}

export function registerReducers() {
  clearReducers();
  registerReducer('testActionHandler', function (state: State) {
    return state.set('tested', true);
  });
}
```

This allows for a different set of action handlers for testing and provides me with a single place to edit when adding new handlers.

> , To be honest, there are still 2 places edit: the function definition/registering and the enum definition with the set of valid action types. However looking at it this way, redux's proposal requires me to edit 3 places in the code.

## Marrying Typescript with Immutable.js

Holding the state in an immutable data structure makes me feel a lot safer while rushing through code at 2 am. However, although Immutable.js provides proper type definitions for its exported Objects, Typescript's type system describes the structure of plain JS Objects, not the key-value pairs your immutable.Map object contains. Expecting to work in an environment where my data structures are validated at compile time, this was a real bummer for me.

### What I Expected

- auto-completion and validation of state/props
- auto-completion and validation of dispatched actions (type and parameters)
- one place to edit when adding a new data structures to the state
- one place to edit when adding a new event handler
- mockable event handlers (and when I say mockable, I mean pluggable)
- having an immutable, typed state

### Typing Immutable Data Structures

Browsing StackOverflow the common solution to type immutable.Map seems to be to create 1. the interface for the mutable JS object and 2. an interface for the immutable.Map object which is expected to contain kv-pairs with the keys defined in the former.

_One Solution to validate object access to immutable.Map_

```
interface State {
  firstKey: boolean
  [..]
}
interface ImmutableDatastructure extends Map<string, any> {
  toJS(): State;
  get<K extends keyof State>(key: K): State[K];
}
```

However, this requires me to duplicate a lot of code any time I add a new type. Instead, I created a generic interface which describes this pattern for me:

```
interface ImmutableOf<T> extends Map<string, any> {
  toJS(): T;
  get<K extends keyof T>(key: K): T[K];
}
```

This way the type definition for the immutable.Map happens in one place:

```
export type Datastructure1 = ImmutableOf<{
  [..]
}>;

export type State = ImmutableOf<{
  firstKey: boolean
  nestedDs: Datastructure1
  […]
}>;
```

### Typing Reducers

For this we need two important types:

- the `Action` type describes the structure of a dispatchable action
- the `ActionType` describes which values the 'type' property of an action can take

By specifying the first during store creation

_Describe the Structure of the Stores State and Actions_

```
export const store: Store<State, Action> = createStore(mainReducer.bind(null, initialStore));
```

and the second in the [registerReducer()](#adding-reducers) definition, Typescript knows which actions are valid and which are not.  
Question now is how `Action` and `ActionType` look like.
My first approach was the following:

_Typing of Action and Actiontype with 'type' validation_

```
export enum ActionType {
  invalidateFirstStartup,
  appIsConfigured,
  removeProductFromSearchResult
}
export interface Action {
  type: ActionType,
  [x: string]: any
}
```

This way the action type is validated and I get auto-completion when dispatching actions or registering event handlers. Also, I have a single place for defining new action types. This worked very well for until I added event handlers with parameters. As to be expected this lead to numerous manual lookups for the exact parameter name and runtime errors while adding new parameters to old event handlers. To fix this I came up with a second approach:

_Typing of Action and Actiontype with parameter validation_

```
interface ActionWithoutParams {
  type: 'action1' | 'action2'
}

export interface Action3 {
  type: 'action3'
  param1: number
  param2: boolean
  [..]
}

export type Action = ActionWithoutParams | Action3

export type ActionType = Action['type']
```

This way every time an action without params is added, only the `ActionWithoutParams` interface is changed. Actions with params however require to add a dedicated interface as well as to add this interface to the `Action` type definition. In my opinion, the additional work is totally worth it.
Whenever an action with the action type 'action3' is dispatched, Typescript infers that 'param1' and 'param2' are also required for a valid action object. Including auto-completion.

### What is Still Missing

The only thing I couldn't achieve so far is to touch a single place in my codebase when adding a new event handler. In fact, when I add an event handler with parameters, there are 3 places to touch: registration, interface declaration for parameters, `Action` definition.
