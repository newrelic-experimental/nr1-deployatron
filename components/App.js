import React from "react";
import { connect } from "react-redux";
import {Spinner, Button, Tabs, TabsItem, Grid, GridItem, ChartGroup, PlatformStateContext, Icon, AreaChart, LineChart, NrqlQuery, Dropdown, DropdownItem} from "nr1";
import { Timeline } from '@newrelic/nr1-community';
import userConfig from '../config.json'
import * as actions from "../actions";
import Configurator from './Configurator'

import { timeRangeToNrql } from '@newrelic/nr1-community';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { sincePicker: null,sincePickerTimeRange: null, focused: false, selectedAccount: null};

    this.accountId = userConfig.configAccountId //put your account id here!
    this.schema = {
        "type":"object",
        "properties": {
            "accountsList": {       
              "type": "string",
              "title": "Accounts",
              "description": "Comma seperated list of accounts to include in account list. Set to 'ALL' to include all accessible accounts."
            },
            "eventQueries": {
              "type": "array",
              "title": "Event queries",
              "items": {
                "type": "object",
                "required": ["title", "nrql"],
                "properties": {
                    "title": {
                      "type": "string",
                      "title": "Name"
                    },
                    "nrql": {
                      "type": "string",
                      "title": "NRQL Query",
                      "description": "Query should return 'title' and 'type' as a miminum. If since clause is ommitted then the date picker since clasue will be used."
                    },
                    "accountScope": {
                      "type": "string",
                      "title": "Account scope (id)",
                      "description": "Leave blank to default to currently selected account, set to 'ALL' to load from all accounts or provide a comma seperated list of specific account IDs"
                    }
                }
              }
            },
            "externalEvents": {
              "type": "array",
              "title": "External events",
              "items": {
                "type": "object",
                "required": ["title", "url"],
                "properties": {
                    "title": {
                      "type": "string",
                      "title": "Name"
                    },
                    "url": {
                      "type": "string",
                      "title": "url"
                    },
                    "accountScope": {
                      "type": "string",
                      "title": "Account scope (id)",
                      "description": "List of specific account ID's this should trigger (leave blank for all)"
                    }
                }
              }
            },
            "eventTypes": {
              "type": "array",
              "title": "Event types",
              "items": {
                "type": "object",
                "required": ["name", "icon","color"],
                "properties": {
                    "name": {
                      "type": "string",
                      "title": "Name"
                    },
                    "code": {
                      "type": "string",
                      "title": "Code",
                      "description": "A short simple code for the type, e.g 'APP'"
                    },
                    "icon": {
                      "type": "string",
                      "title": "Icon"
                    },
                    "color": {
                      "type": "string",
                      "title": "Colour",
                      "description": "CSS color or hex value"
                    }
                }
              }
            },
            "dashboardLinks": {
              "type": "array",
              "title": "Dashboard links",
              "items": {
                "type": "object",
                "required": ["caption", "url"],
                "properties": {
                    "caption": {
                      "type": "string",
                      "title": "Caption",
                      "description": "Caption to appear on link"
                    },
                    "url": {
                      "type": "string",
                      "title": "URL",
                      "description": "Dashboard URL. Time window will be appended."
                    },
                    "accountScope": {
                      "type": "string",
                      "title": "Account scope",
                      "description": "Comma seperated list of account ID's that this dashboard should show for. Leave blank to appear for all accounts."
                    },
                    "eventScope": {
                      "type": "string",
                      "title": "Event scope",
                      "description": "Comma seperated list of event types. Leave blank to appear on all events."
                    },
                }
              }
            },
            "tabs":{
              "type": "array",
              "title": "Tabs",
              "items": {
                "type": "object",
                "properties": {
                    "title": {                      //each chart has a title and a nrql query and they are mandatory
                      "type": "string",
                      "title": "Tab name"
                    },
                    "columns": {                      //each chart has a title and a nrql query and they are mandatory
                      "type": "number",
                      "title": "Columns",
                      "description": "The number of columns per row to display charts"
                    },
                    "charts": {                     //charts is an array, so we can add as many as we like
                      "type": "array",
                      "title": "Charts",
                      "items": {
                          "type": "object",
                          "required": ["title", "nrql"],
                          "properties": {
                              "title": {                      //each chart has a title and a nrql query and they are mandatory
                                  "type": "string",
                                  "title": "Chart Title"
                              },
                              "nrql": {
                                  "type": "string",
                                  "title": "NRQL Query"
                              },
                              "accountId": {
                                "type": "string",
                                "title": "Account Id",
                                "description": "Set account ID that chart should be sourced from. Usually left blank to default to currently selected account. "
                              },
                              "chartType": {                      //each chart has a title and a nrql query and they are mandatory
                                "title": "Chart type",
                                "type": "string",
                                "default": "Line",
                                "enum": ["Line", "Area"]
                            },
                            "explorerFilter": {
                              "type": "string",
                              "title": "Explorer filter pattern",
                              "description": "If present clicking on a series will link through to the explorer with the specified filter pattern. [NAME] is preplaced in the pattern with the series name. e.g. (domain = 'APM' AND type = 'APPLICATION') AND (name = '[NAME]')"
                            },
                          }
                      }
                    }
                }
              }
            }
        }
    }
    this.defaultConfig=userConfig.defaultConfig ? userConfig.defaultConfig : {}
}

  componentDidMount() {
    const { changeConfig, userAccounts, selectedAccount } = this.props;
    if(userConfig.fixedConfig) {
      changeConfig(userConfig.fixedConfig)
    }
  }

  explorerLinkHandler(entityName,accountId,filterString) {
    const {pickerStart, pickerEnd} = this.props
    let domain="one.eu.newrelic.com"
    let filterStringReplace=`"${filterString}\"`.replace(/\[NAME\]/g,entityName)
    let filter="&platform[filters]="+window.btoa(filterStringReplace)
    let newWindow = `https://${domain}/launcher/nr1-core.explorer?account=${accountId}&begin=${pickerStart}&end=${pickerEnd}${filter}`
    window.open(newWindow)
  }

  iconSetup(type) {
    const { deploymentTypes } = this.props;
    let iconConfig=deploymentTypes.find(t=>t.type==type)
    
    if(iconConfig) {
      return iconConfig
    } else {
      return {
        icon: Icon.TYPE.DOCUMENTS__DOCUMENTS__NOTES,
        iconColor: 'grey',
        type: "Unknown",
        name: "Unknown",
        label: "Unknown"
      }
    }
  }

  render() {
    const { userAccounts, setSince,config, changeConfig, deployments, deploymentTypes, pickerSince, pickerStart, pickerEnd, toggleTypeFilter, typeFilters, changeSelectedAccount, selectedAccount } = this.props;


    /*
    * Configurator - this controls all the configuration management
    */
    let configurator
    if(!userConfig.fixedConfig) {
    configurator=<div>
        <Configurator  
          schema={this.schema}                          // schema for the config form data
          default={this.defaultConfig}                  // optional prop to initialise storage if it is empty, this should be wired to the config data from this.state
          dataChangeHandler={(data)=>{changeConfig(data)}}   // callback function run when config changes

          accountId={this.accountId}                    // account ID to save the config
          storageCollectionId="Deployatron"             // the nerdstorage colelciton name to store config
          documentId="deployatron-config"                   // the nerstorage document id prefix

          buttonTitle="Configuration"                   // Some customisation of the configurator UI
          modalTitle="Configuration Editor"
          modalHelp="Use the form below to configure the application."
        />
    </div>
    }




    if(config && Object.keys(config).length > 0) {

      let timeline=<div><Spinner inline/> Loading events...</div>
      let timeLineTypeFilters=null
      let chartDeployments=[]


      /*
      * Account Picker Setup
      */

      let accountPicker=null
      //Only one account, then we might as well select it
      if(!selectedAccount && userAccounts && userAccounts.length == 1) {
        changeSelectedAccount(userAccounts[0].id)
      } else {
          if(userAccounts && userAccounts.length > 1) {
            let accounts=userAccounts.map((account)=>{
              return <DropdownItem onClick={(evt) => {changeSelectedAccount(account.id)}} >{`${account.name} [${account.id}]`}</DropdownItem>
            })
            let title= selectedAccount && selectedAccount.name ? selectedAccount.name : "Select account..."
            accountPicker=<Dropdown title={title}> 
              {accounts}
              <DropdownItem onClick={(evt) => {changeSelectedAccount(null)}} >{`None`}</DropdownItem>
            </Dropdown>;
          }
      }



      if(deployments && deployments.data){

        //Filter out any deployment events not within time picker window
        let filteredDeployments=deployments.data.filter((d)=>{
          return d.timestamp>=pickerStart && d.timestamp <=pickerEnd
        })


        /*
        * Configure type filter toggle buttons
        */
       if(deploymentTypes) {
        timeLineTypeFilters=deploymentTypes.map((type,idx)=>{
            let ToggleButton=React.forwardRef((props, ref) => ( //nastyness to blur
              <Button
                ref={ref}
                type={typeFilters[type.type] ? Button.TYPE.PLAIN_NEUTRAL : Button.TYPE.PLAIN}
                onClick={()=>{toggleTypeFilter(type.type)}}
              >
                <Icon type={Icon.TYPE[type.icon]} color={typeFilters[type.type] ? "grey" : type.color}/>&nbsp;{type.name}</Button>
            ))
            return <ToggleButton />
          })
       }

        /*
        * Configure deployment markers for display on charts
        */
        chartDeployments=filteredDeployments.map((deployment,idx)=>{
            let typeConfig=this.iconSetup(deployment.type)
            return {
              metadata: {
                  id: `deployment-${idx}`,
                  name: `${deployment.label}`,
                  color: typeConfig.color,
                  viz: 'event',
              },
              data: [
                  {
                      x0: deployment.timestamp,
                      x1: deployment.timestamp,
                  },
              ],
          }
        })
        
        /*
        * Configure deployment event stream
        */

        if(chartDeployments.length == 0 ) {
          timeline=<div>No events for time range</div>
        } else {


       

        timeline=<><h3>Event timeline</h3>
        <div className="timeline">
          
          <div className="timeLineWidget"><Timeline data={filteredDeployments} 
              timestampField="timestamp"
              dateFormat={userConfig.dateFormat ? userConfig.dateFormat : "dd/MM/yyyy"}
              labelField="label" 
              iconType={data => {
                let iconConfig= this.iconSetup(data.event.type)
                return {
                    icon: Icon.TYPE[iconConfig.icon],
                    color: iconConfig.color,
                    type: iconConfig.type,
                    label: iconConfig.name
                  }
              }}
              eventContent={({ event }) => {


                 //configure and filter the dashboard links that should appear based on selected account and event type
                let dashboardLinks=[]
                if(config.dashboardLinks && config.dashboardLinks.length > 0){
                  config.dashboardLinks.forEach((link)=>{
                    if(!link.accountScope || (link.accountScope  && selectedAccount && link.accountScope.split(",").includes(selectedAccount.id+""))) {

                      if((!link.eventScope || link.eventScope=="") || link.eventScope.split(",").includes(event.type)) {
                        let linkURL = link.url+`&begin=${pickerStart}&end=${pickerEnd}`
                        dashboardLinks.push(<>
                            <a onClick={(e)=>{e.stopPropagation();}}target="_blank" href={linkURL}>{link.caption}</a>
                            <br />
                            </>
                        )
                      }

                    }
                  })
                }
                let dashboardLinksBlock
                if(dashboardLinks&& dashboardLinks.length > 0) {
                  dashboardLinksBlock=<li className="timeline-item-contents-item dashboardLinksBlock" >
                    <span className="key">Dashboards</span>
                    <span className="value">{dashboardLinks}</span>
                  
                  </li>
                }


                let accountRow= !event['accountId'] ? null : <li className="timeline-item-contents-item">
                            <span className="key">Account</span>
                            <span className="value">{`${event['accountName']} (${event['accountId']})`}</span>
                          </li>

                
                let minutes = userConfig.focusMinutes && Array.isArray(userConfig.focusMinutes) ? userConfig.focusMinutes : [15,30,60]
                let focusButtons = minutes.map((mins)=>{
                    return <Button className="focusButton" type={Button.TYPE.PRIMARY} iconType={Button.ICON_TYPE.DATE_AND_TIME__DATE_AND_TIME__TIME}onClick={(e)=>{
                        e.stopPropagation(); 
                      setSince(null,{duration:null,begin_time:event['timestamp']-(mins*60*1000),end_time:event['timestamp']+(mins*60*1000)})
                      this.setState({focused:true})
                      }}>{`Focus to ${mins*2}m`}</Button> 
                })
                return (
                  <ul className="timeline-item-contents">
                      {accountRow}
                      <li className="timeline-item-contents-item">
                        <span className="key">Source</span>
                        <span className="value">{`${event['eventSource']}`}</span>
                      </li>
                      <li className="timeline-item-contents-item">
                        <span className="key">Type</span>
                        <span className="value">{`${event['type']}`}</span>
                      </li>
                      <li className="timeline-item-contents-item">
                        <span className="key">Description</span>
                        <span className="value">{`${event['description']}`}</span>
                      </li>
                      <li>
  
                       {dashboardLinksBlock}
                          
                      </li>
                      <li>
                        <div className="focusButtonContainer">
                          {focusButtons}
                        </div>
                      </li>
                  </ul>
                );
              }}
            /></div></div>
            </>
      }
      }

      /*
      * Chart area tab rendering
      */
      let tabs = <div className="selectAnAccountMessage">Please select an account to view charts</div>
      if(config.tabs && selectedAccount && selectedAccount.id)  {
      let tabsInner=config.tabs.map((tab,tabidx)=>{
        let charts=tab.charts.map((chart)=>{

          return <GridItem columnSpan={tab.columns ? 12/tab.columns : 12}>
            <h3>{chart.title}</h3>
            {/* multiple account ids can be provided but right now these only render first */}
            <NrqlQuery
              accountIds={chart.accountId ? chart.accountId.split(",") : [selectedAccount.id]}
              query={chart.nrql + " " + pickerSince}
            >
              {({ data }) => {
                if(data ) {
                  data=[...data, ...chartDeployments]
                }
                switch(chart.chartType) {
                  case "Area": 
                    return <AreaChart style={{height: userConfig.chartHeight? userConfig.chartHeight : '23em'}} fullWidth data={data} onClickArea={(e)=>{
                      if(e && e.metadata && e.metadata.name && chart.explorerFilter && chart.explorerFilter!="") { this.explorerLinkHandler(e.metadata.name,selectedAccount.id, chart.explorerFilter)}
                    }
                    }/>;
                  default:
                    return <LineChart style={{height: userConfig.chartHeight? userConfig.chartHeight : '23em'}} fullWidth data={data} onClickLine={(e)=>{
                      if(e && e.metadata && e.metadata.name && chart.explorerFilter && chart.explorerFilter!="") { this.explorerLinkHandler(e.metadata.name,selectedAccount.id, chart.explorerFilter)}
                    }
                    }/>;
                }
                
              }}
            </NrqlQuery>
          </GridItem>
        })
        return <TabsItem value={`tab-${tabidx}`} label={tab.title}>
          <ChartGroup><Grid className="chartsGrid">{charts}</Grid></ChartGroup>
        </TabsItem>
      })
      if(tabsInner) {
        tabs=<Tabs  defaultValue="tab-0">{tabsInner}</Tabs>
      } 
    }
    

    let clearFocusButton = !this.state.focused ? null : <div className='defocusButton'>
        <Button type={Button.TYPE.PRIMARY} iconType={Button.ICON_TYPE.DATE_AND_TIME__DATE_AND_TIME__TIME__A_REMOVE}onClick={(e)=>{
          e.stopPropagation(); 
            setSince(this.state.sincePicker,this.state.sincePickerTimeRange)
            this.setState({focused:false})
      }}>Reset time range</Button>
      </div>

      /*
      * Final app render
      */
      return (
        <div className="app">
          <PlatformStateContext.Consumer>
              {(platformState) => {
                const since = timeRangeToNrql(platformState);
                if(this.state.sincePicker!=since) {
                    this.setState({sincePicker: since, sincePickerTimeRange: platformState.timeRange})
                    setSince(since,platformState.timeRange)
                }
                }}
            </PlatformStateContext.Consumer>
          <Grid>
            <GridItem columnSpan={10} className="accountPickerGrid">
            {accountPicker}
            </GridItem>
            <GridItem columnSpan={2}>
              {clearFocusButton}
            </GridItem>
          </Grid>
          <Grid className="outerGrid">
            <GridItem columnSpan={userConfig.eventStreamColumns ?userConfig.eventStreamColumns : 4}>
                {timeLineTypeFilters}
                {timeline}

              </GridItem>
              <GridItem columnSpan={userConfig.eventStreamColumns ? 12-userConfig.eventStreamColumns : 8}>
                {tabs}
              </GridItem>
          </Grid>
          <Grid className="outerGrid">
            <GridItem columnSpan={12}>{configurator}</GridItem>
          </Grid>
        </div>
      );
    } else {
        return (<div className='configuratorContainer'>
          {configurator}
        </div>)
    }
   
  }
}

/*
* Redux connectors
*/
const mapStateToProps = (state) => { return { 
  userAccounts: state.userAccounts, 
  selectedAccount: state.selectedAccount,
  config: state.config, 
  deployments: state.deployments, 
  pickerSince: state.pickerSince.since, 
  pickerStart: state.pickerSince.start, 
  pickerEnd: state.pickerSince.end,
  typeFilters: state.typeFilters,
  deploymentTypes: state.deploymentTypes
} };
const mapDispatchToProps = (dispatch) => ({ 
  setSince: (newSince,timeRange) => {dispatch(actions.setSince(newSince,timeRange))},
  changeConfig: async (config)=>{
    if(Object.keys(config).length > 0) {
      await dispatch(actions.changeConfig(config))
      await dispatch(actions.dataSetup())
    }
  },
  changeSelectedAccount: (accountId) => dispatch(actions.changeSelectedAccount(accountId)),
  toggleTypeFilter: (type) => dispatch(actions.toggleTypeFilter(type))
})

export default connect(mapStateToProps, mapDispatchToProps)(App);
