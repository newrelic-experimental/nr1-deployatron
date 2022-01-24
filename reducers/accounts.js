import {
    FETCH_ACCOUNTS,
    CHANGE_TIME_PICKER,
    CHANGE_CONFIG,
    CHANGE_TYPE_FILTER,
    CHANGE_SELECTED_ACCOUNT

} from "../actions/accounts";

export const userAccounts = (state = null, action) => {
    switch (action.type) {
        case FETCH_ACCOUNTS:
            return action.payload;
        default:
            return state;
    }
};

let endTime=new Date().getTime()
let sinceDefault={
    since: "since 1 hour ago",
    start: endTime - (60*60),
    end: endTime
}
export const pickerSince = (state = sinceDefault, action) => {
    switch (action.type) {
        case CHANGE_TIME_PICKER:
            return action.payload;
        default:
            return state;
    }
};


export const config = (state = null, action) => {
    switch (action.type) {
        case CHANGE_CONFIG:
            return action.payload;
        default:
            return state;
    }
};

export const selectedAccount = (state = null, action, getState) => {
    switch (action.type) {
        case CHANGE_SELECTED_ACCOUNT:
            return action.payload;
        default:
            return state;
    }
};


export const typeFilters = (state = {}, action) => {
    switch (action.type) {
        case CHANGE_TYPE_FILTER:
            return action.payload;
        default:
            return state;
    }
};

