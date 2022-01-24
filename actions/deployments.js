import {shardedQuery} from './shardedQuery'
import {asyncForEach} from '../components/utils'
const axios = require('axios');

export const FETCH_DEPLOYMENTS = "FETCH_DEPLOYMENTS"
export const FILTER_DEPLOYMENTS = "FILTER_DEPLOYMENTS"



export const fetchDeployments = () => async (dispatch,getState) => {
    const { userAccounts,  selectedAccount, config, pickerSince } = getState()
    if( userAccounts && userAccounts.length > 0 ) {

      const marshalResults = (data,type,source) => {
        let deployments=[]
          switch(type) {
            case "deployments":
              const resultsAsArray = Object.keys(data).map((key) => { return data[key] })
              resultsAsArray.forEach((account)=>{
                account.data.forEach((deployment)=>{
                  let title=deployment.title + (deployment.title2 ? ` - ${deployment.title2}` : "") + (deployment.title3 ? ` - ${deployment.title3}` : "" ) 
                  let desc = deployment.description + (deployment.description2 ? ` ${deployment.description2}` : "") + (deployment.description3 ? ` ${deployment.description3}` : "")
                  let thisDeployment={
                    accountId: account.id,
                    accountName: account.name,
                    title: title,
                    description:  desc,
                    timestamp: deployment.altTimestamp && deployment.altTimestamp!="" ? parseInt(deployment.altTimestamp) : deployment.timestamp,
                    type: deployment.type,
                    eventSource: source,
                    label: `${deployment.type}: ${title}`
                  }
                  thisDeployment.timestamp = thisDeployment.timestamp < 100000000000 ? thisDeployment.timestamp*1000 : thisDeployment.timestamp //check for non millisecond timestamps
                  deployments.push(thisDeployment)
                })
              })
              break;
              case "externalEvents":
                  data.forEach((deployment)=>{
                    let thisDeployment={
                      accountId: "",
                      accountName: source,
                      title: deployment.title,
                      description: deployment.description,
                      timestamp: deployment.timestamp,
                      type: deployment.type,
                      eventSource: source,
                      label: `${deployment.type}: ${deployment.title}`
                    }
                    thisDeployment.timestamp = thisDeployment.timestamp < 100000000000 ? thisDeployment.timestamp*1000 : thisDeployment.timestamp //check for non millisecond timestamps
                    deployments.push(thisDeployment)
                  })
                
                break;
          }
        return deployments
      }


      //load event/deployment data ....
      let deployments=[]
      if(config.eventQueries && config.eventQueries.length > 0) {
        await asyncForEach(config.eventQueries,async (eventQuery)=>{
         
          let accountScope=[] 
          if(eventQuery.accountScope && eventQuery.accountScope!="" ) {
            if(eventQuery.accountScope=="ALL") {
              accountScope=userAccounts //All means we search all accoutns for this data regardless of the account selected
            } else {
                //specified account means we only search the sepcified accounts for this query (comma seperated)
                eventQuery.accountScope.split(",").forEach((accId)=>{
                  let accountName=userAccounts.find(account => account.id==accId)
                  accountScope.push({id:accId, name: accountName ? accountName.name : `External account ${accId}`})
                })
            }
          } else {
            if(selectedAccount) {  // blank means we only search the currently selected account
              accountScope=[{id:selectedAccount.id, name: selectedAccount.name}] 
            }
          }
  
          //Now grab the events now we know the scope.
          if(accountScope.length > 0) {
            let nrqlSince = eventQuery.nrql
            //note when looking for events we look back 1 hour before the window, this means any artifacts picked up by the use of 'earliest' are discarded and not shown on the timeline
            if(!eventQuery.nrql.match(/since/gi) && pickerSince && pickerSince.start && pickerSince.end ) {
              nrqlSince=eventQuery.nrql + ` since ${pickerSince.start - (1000*60*60)} until ${pickerSince.end}`
            }  

            let results = await shardedQuery(accountScope,nrqlSince,FETCH_DEPLOYMENTS )
            deployments=[...deployments, ...marshalResults(results.data,"deployments",eventQuery.title && eventQuery.title != "" ? eventQuery.title : "Event")]
          }
        })
      }

      if(config.externalEvents && config.externalEvents.length > 0 ) {
        await asyncForEach(config.externalEvents, async (externalEvent)=>{
          //We skip event loading if its account scoped and we dont currently have an account selected that is in the list
          let skipEventSource=false
          if(externalEvent.accountScope && externalEvent.accountScope!="" && (!externalEvent.accountScope.split(",").includes(selectedAccount ? selectedAccount.id+"" : null))) {
              skipEventSource=true
          }
          if(!skipEventSource) {
            try {
              let data = await axios.get(externalEvent.url,{timeout: 5000})
              deployments=[...deployments, ...marshalResults(data.data,"externalEvents",externalEvent.title && externalEvent.title != "" ? externalEvent.title : "External Event")]
            } catch(error) {
              console.log(`FAILED Gathering external event data ${externalEvent.title} from ${externalEvent.url} `,error);
            }
          } 
        })
      }     

      //sort the deployments by time
      deployments=deployments.sort((a,b)=> b.timestamp - a.timestamp)

      let types=[]
      deployments.forEach((evt)=>{
        if(!types.find(t=>t.type==evt.type)) {
          let eventType = config.eventTypes.find(et=>et.code==evt.type)
          if(eventType) {
            //known type use config for setup
            types.push({
              type: evt.type, 
              name: eventType.name,
              label: eventType.name,
              icon: eventType.icon, 
              color: eventType.color
            })
          } else {
            //unkown type
            types.push({
              type: evt.type, 
              name: `${evt.type} Event`,
              label: `${evt.type} Event`,
              icon: 'HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_WARNING', 
              color: 'grey'
            })
          }
        }
      })
      
      return dispatch({
        type: FETCH_DEPLOYMENTS,
        payload: {data : deployments, types: types},
      })

    } else {
    return dispatch({
        type: FETCH_DEPLOYMENTS,
        payload: { data: null, types: null },
      })
    }
    
  };


  export const filterDeployments = () => async (dispatch,getState) => {

    const { rawDeployments,  typeFilters } = getState()
      let filteredDeployments=rawDeployments.data.filter(d=>{
        return !typeFilters[d.type]
      })
      return dispatch({
        type: FILTER_DEPLOYMENTS,
        payload: {data : filteredDeployments },
      })


    
  };
