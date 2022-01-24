import { AccountsQuery, Toast } from "nr1";
import { timeRangeToNrql } from '@newrelic/nr1-community';

export const FETCH_ACCOUNTS = "FETCH_ACCOUNTS"
export const CHANGE_TIME_PICKER = "CHANGE_TIME_PICKER"
export const CHANGE_CONFIG = "CHANGE_CONFIG"
export const CHANGE_TYPE_FILTER = "CHANGE_TYPE_FILTER"
export const CHANGE_SELECTED_ACCOUNT = "CHANGE_SELECTED_ACCOUNT"

//Gets all the accounts the current user can view
export const fetchUserAccounts = () => async (dispatch,getState) => {
    const { config } = getState()
    const response = await AccountsQuery.query();
  
    let filteredAccounts=[]
    //If supplied filter accounts by list. If ALL then allow all valid accounts
    if(config.accountsList && config.accountsList!="ALL") {
        let allowedAccounts=config.accountsList.split(",")
        filteredAccounts=response.data.filter((account)=>{
            return allowedAccounts.find((e)=> e==account.id)
        })
    } else {
        if(config.accountsList=="ALL") {
            filteredAccounts=response.data
        }
    }
    if(response.data.length > 0 && filteredAccounts.length <=0) {
        Toast.showToast({
            title: 'Account Error',
            description: 'Some user accounts were found but none of them are in the configured list of accounts. Check the configuration.',
            type: Toast.TYPE.CRITICAL
        });
    
    }

    dispatch({
        type: FETCH_ACCOUNTS,
        payload: filteredAccounts,
    });
};


export const setSince = (newSince,timeRange) => async (dispatch) => {
    //console.log("Action: changing time picker",newSince,timeRange)
    let endTime=new Date().getTime()
    let startTime=endTime
    let sinceClause=newSince

    if(timeRange.duration) {
        startTime=endTime-timeRange.duration
    } else {
        startTime=timeRange.begin_time
        endTime=timeRange.end_time
        sinceClause=timeRangeToNrql({timeRange:{duration:null,begin_time:startTime, end_time:endTime}})
    }
   

    dispatch({
        type: CHANGE_TIME_PICKER,
        payload: {since: sinceClause, start: startTime, end: endTime}
    });

};


export const changeConfig = (config) => async (dispatch) => {
    //console.log("Action: Change config",config)
    dispatch({
        type: CHANGE_CONFIG,
        payload: config,
    });

};


export const changeSelectedAccount = (accountId) => async (dispatch, getState) => {
    //console.log("Action: Change selected account",accountId)
    const { userAccounts } = getState()
    const accountData=userAccounts.find(account => account.id==accountId)
    dispatch({
        type: CHANGE_SELECTED_ACCOUNT,
        payload: { id: accountId, name: accountData ? accountData.name : null},
    });

};

export const toggleTypeFilter = (type) => async (dispatch, getState) => {
    //console.log("Action: toggle type filter ",type)
    const { typeFilters, deploymentTypes } = getState()
    let newTypeFilters={}
    console.log("typeFilters",typeFilters,type)
    //only 1 selected? then make that the only one selected and disable the rest

    let countFilters=0
    Object.keys(typeFilters).forEach((key)=>{
        if(typeFilters[key]===true) {
            countFilters++
        }
    })
    if(countFilters==0) {
        Object.keys(deploymentTypes).forEach((key)=>{
            if(deploymentTypes[key].type!=type) {
                newTypeFilters[deploymentTypes[key].type]=true
            } else {
                newTypeFilters[deploymentTypes[key].type]=false
            }
         })
    } else {
        newTypeFilters = Object.assign({},typeFilters)
        newTypeFilters[type]=!newTypeFilters[type]
    }

    let countTypeFilters=0
    Object.keys(newTypeFilters).forEach((key)=>{
        if(newTypeFilters[key]===true) {
            countTypeFilters++
        }
    })
    //none selected? revert to all selected!
    if(Object.keys(deploymentTypes).length == countTypeFilters) {
        newTypeFilters={}
    }
    dispatch({
        type: CHANGE_TYPE_FILTER,
        payload: newTypeFilters,
    });

};

