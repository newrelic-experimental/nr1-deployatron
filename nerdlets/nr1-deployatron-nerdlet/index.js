import React from "react";
import { BrowserRouter, Route } from "react-router-dom";

import Root from "./Root";
import App from "../../components/App";

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class Main extends React.Component {
  render() {
    return (
      <Root>
        <BrowserRouter>
          <Route path="/" component={App} />
        </BrowserRouter>
      </Root>
    );
  }
}
