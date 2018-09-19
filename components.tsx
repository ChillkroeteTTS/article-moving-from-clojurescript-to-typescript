import { State } from "./types";
import { View, Text } from "react-native";
import { connect } from "react-redux";

function Person(props) {
  return <Text>{props.name}</Text>;
}

function mapStateToProps(state: State) {
  return {
    noEmptyNames: state.get("names").filter(str => str !== "")
  };
}

function MyUnmappedComponent(props) {
  return (
    <View>
      {" "}
      {props.noEmptyNames.map(person => (
        <Person key={person.name} name={person.name} />
      ))}{" "}
    </View>
  );
}

export const MyComponent = connect(mapStateToProps)(MyUnmappedComponent);
