import React from 'react';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from "redux";

import thunk from 'redux-thunk';
import reducers from '../../reducers'

export default ({ children, initialState = {} }) => {
  const store = createStore(
    reducers,
    initialState,
    applyMiddleware(thunk)
  );
  store.subscribe(() => {
    //console.log("redux_store",store.getState())
  });

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}
