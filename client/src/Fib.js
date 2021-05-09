import React, { Component } from "react";
import axios from "axios";

class Fib extends Component {
  state = {
    seenIndexes: [],
    values: {},
    value: "",
  };

  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  async fetchValues() {
    const values = await axios.get("/api/values/current");
    this.setState({ values: values.data });
  }

  async fetchIndexes() {
    const seenIndexes = await axios.get("/api/values/all");
    this.setState({ seenIndexes: seenIndexes.data });
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    await axios.post("/api/values", {
      value: this.state.value,
    });

    this.setState({ value: "" });
  };

  renderSennIndexes() {
    return this.state.seenIndexes.map(({ number }) => number).join(", ");
  }

  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>enter your index:</label>
          <input
            value={this.state.index}
            onChange={(e) => this.setState({ value: e.target.value })}
          />
          <button>Submit</button>
        </form>
        <h3>Indexes I heve seen:</h3>
        {this.renderSennIndexes()}
        <h3> Calculated Values</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
