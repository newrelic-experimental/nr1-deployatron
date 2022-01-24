
import { fetchUserAccounts,setSince as _setSince,changeConfig, toggleTypeFilter as _toggleTypeFilter, changeSelectedAccount as _changeSelectedAccount } from "./accounts";
import { fetchDeployments, filterDeployments } from "./deployments" 


export const dataSetup = () => async (dispatch) => {
    await dispatch(fetchUserAccounts())
    await dispatch(fetchDeployments())
    await dispatch(filterDeployments())
    
};

export const toggleTypeFilter = (type) => async (dispatch) => {
    await dispatch(_toggleTypeFilter(type))
    await dispatch(filterDeployments())

};

export const changeSelectedAccount = (accountId) => async (dispatch) => {
    await dispatch(_changeSelectedAccount(accountId))
    await dispatch(dataSetup())
    };

export const setSince = (newSince,timeRange) => async (dispatch) => {
    await dispatch(_setSince(newSince,timeRange))
    await dispatch(dataSetup())
    };

 
export { changeConfig }