import { FETCH_DEPLOYMENTS,FILTER_DEPLOYMENTS  } from "../actions/deployments";

const initState = null //default state for startup
export const rawDeployments = (state = initState, action) => {
    switch (action.type) {
        case FETCH_DEPLOYMENTS:
            return action.payload
        default:
            return state
    }
};


export const deploymentTypes = (state = initState, action) => {
    switch (action.type) {
        case FETCH_DEPLOYMENTS:
            return action.payload.types
        default:
            return state
    }
};



export const deployments = (state = initState, action) => {
    switch (action.type) {
        case FILTER_DEPLOYMENTS:
            return action.payload
        default:
            return state
    }
};
