export default ({ dispatch }) => (next) => (action) => {
  // check if payload is a promise
  if (!action.payload || !action.payload.then) {
    // if not return action to next middleware
    return next(action);
  }

  // wait for the promise to resolve
  action.payload.then((response) => {
    // create new action with data and dispatch
    const newAction = { ...action, payload: response };
    dispatch(newAction);
  });
};
