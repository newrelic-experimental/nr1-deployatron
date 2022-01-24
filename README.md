[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# Deployatron
This app allows you to visualise discrete events such as deployments, infrastructure changes, incidents, even social marketing and TV advert events over your New Relic data. How did that firewall change affect app performance? How did that TV ad affect your auto scaling? Answer these questions and more!

In order to use the app you must supply event sources. You can source events from NRDB or from remote JSON  via url. NRDB event sources can be from existing data you're already reporting or from custom events or metrics submmited via the New Relic ingest API's. For instance, when you make a CI/CD deployment to your environment send a custom event to New Relic describing it and it will appear over your performance data and metrics.

#### To get started:
- Checkout the repo
- Run `npm install` to install node dependencies
- Edit the config.json and pop in your account ID
- Check you have the correct New Relic CLI profile selected with `nr1 profiles:default`
- Run `nr1 nerdpack:uuid -gf` to generate an application GUID
- Run `nr1 nerdpack:serve` to serve the app locally

Instructions on installing into your account permanently rather than running locally can be found in the [New Relic docs.](https://developer.newrelic.com/build-apps/publish-deploy/)


## Configuration

### config.json
Configure the app deployment here. You must supply as a minimum an account ID which is the account used to store the configuration (which is edited through the UI). The exception to this is if you provide a hard coded the configuration.

- **configAccountId**: The account ID that the configuration should be stored in. All users must have access to this account. This is required unless a fixedConfig is used, in which case nerd storage is not used. e.g. `1122334`
- **dateFormat**: Format for dates in the event stream. e.g. `"dd/MM/yyyy"`
- **eventStreamColumns**: The number of columns the event stream takes up. e.g. `4`
- **defaultConfig**: A default configuration to load on startup (use the config object from tools setion). Omit or set to null if not used.
- **fixedConfig**: A hard coded configuration, the config button will be removed (use the config object from tools setion). Omit or set to null if not used.
- **chartHeight**: Allows you to override the height of the charts using css. e.g. `"30em"`
- **focusMinutes*: Override the zoom controls availble. Specify an array of minutes e.g. `[10,30,60]`

## Configuration via UI

### Accounts
This controls what accounts appear in the account drop down and are scanned for data. Supply a comma seperated list of accounts that may appear. Alternatively set to 'ALL' to show all accessible accounts. If in doubt start with 'ALL' :)

### NRQL Event Queries
The event queries allow you to query NRDB for events to display. You can query custom data that you've ingested specifically for this purpose or even capture data from your existing data and custom attributes.
- **Name**: The name of this event source
- **NRQL Query**: The NRQL query to generate events. Events should return a title, description and type field as well as the default timestamp.
- **Account scope**: This allows you to control which accounts the queries will be run. Leave blank to run the query on the currently selected account. Specify an account id (or list of comma seperated id's) to run the query on those specific accounts. Finally use the value 'ALL' to run the query on all accounts regardless of that selected.

**Note:** You can overide the events timestamp by including a altTimestamp value in your query which should be a UTC unix timestamp. 

#### NRQL fields expected:
- **type**: The type code, which may match to a configured icon (but doesnt have to)
- **title**: The title to appear in the stream (Note `title2` and `title3` are also allowed, allowing for three components in the title.)
- **description**: The description. (Again `description2` and `description3` allow for composed descriptions)
- **altTimestamp**: An unix timestamp for specified event time.

#### Some example queries:
```
select type, title, description from myEvents since 1 month ago
select type, title, description, altTimestamp from myEvents since 1 month ago
select type, x as title, y as title2, z as title3, aa as description, bb as description2 from myEvents since 1 month ago
SELECT earliest(version) as title,  earliest(appName) as title2, earliest(version) as description, earliest(appName) as description2, earliest(timestamp) as timestamp, latest('APPDEPLOY') as type from Transaction facet version, appName since 1 month ago 
```


## Submitting custom events
You can submit custom events via the events API and then query them from NRDB with event queries above. Here is a simple example:

```bash
NOW=`date +%s`
curl -o /dev/null -w "%{http_code}" -k -H "Content-Type: application/json" \
    -H "X-Insert-Key:  YOUR-INSERT-API-KEY-HERE" \
    -X POST https://insights-collector.newrelic.com/v1/accounts/YOUR-ACCOUNT-ID-HERE/events \
    --data "[{   \"timestamp\":${NOW}, \"eventType\":\"demoCustomEvent\", \"type\":\"INFRA\", \"title\":\"Firewall firmware update\", \"description\":\"Update the firmware of FW123\" }]"
```

You would then add the query for this to the configuration:
`select type, title, description from demoCustomEvent`

## External events
This allows you to load events from a JSON payload via a URL GET. 
- **Name**: The event source name
- **URL**: A URL that returns JSON events as an array of objects, see below.
- **Account scope**: Leave blank to show events for all accounts. Specify an account id (or list of comma seperated id's) to load and show events only for those acounts listed.

#### JSON format of external events example:
```json
[
    {
        "timestamp" : 1639921564000,
        "type" : "ADVERT",
        "title" : "ITV Downton Abbey Advert",
        "description": "This ad aired during the downton abbey first ad break"
    },
    {
        "timestamp" : 1639820764000,
        "type" : "ADVERT",
        "title" : "Xmas preview",
        "description": "A preview for the industry"
    }
]
```

The fields are as follows:
- **timestamp**: the time of the event
- **type**: the type of the event
- **title**: the title of the event to appear in the event stream
- **description**: description of the event
	  
## Event Types
The event types configuration allows you to specify what icons and colours are used for each type in the event stream. Unkown types will appear grey.

- **Name**: A friendly name for this event type.
- **Code**: A unique code that matches that in the type field of the events.
- **Icon**: An icon reference as listed in the [SDK Icon docs](https://developer.newrelic.com/components/icon/)
- **Colour**: A CSS colour reference. e.g. 'green' or '#00ff00'

## Dashboard Links
The dashboard links section allows you to configure links to dashbaords that appear against each event in the stream. Linking to the dashbaord will include the currently selected timewindow. Dashbaord links tend to be account sepecific.

- **Caption**: The caption to appear on the link
- **URL**: The full dashbaord URL (dont use a short link)
- **Account scope**: Comma seperated list of account ID's that the dashboard should show for. Leave blank to appear for all accounts.

## Tabs
The chart area is divided into tabs. You can create as manay tabs as you like. You can also specify how many columns each tab displays the charts with.

For each chart you can specify the following:
- **Chart title**: The title of the chart
- **NRQL Query**: The NRQL query for the chart. Be sure to include a TIMESERIES keyword and to omit any SINCE clauses
- **Account ID**: Set account ID that chart should be sourced from. Usually you would leave this blank to default to currently selected account. 
- **Chart type**: Line and area charts are currently supported.
- **Explorer filter pattern**: Allows you to specify a filter pattern to use with explorer. If this field has a value then clicking on the series in the chart will navigate to explorer passing over the series name as a value to the search. It also passes through the currently selected time window context. The filter pattern allows you to finely control which entities are returned. A simple pattern is: `(name LIKE '[NAME]' OR id = '[NAME]' OR domainId = '[NAME]')`. You can refine this to specific entity types too, for example if your chart displays apps then use the following pattern: `(domain = 'APM' AND type = 'APPLICATION') AND (name = '[NAME]')` Another example is for hosts: `(domain = 'INFRA' AND type = 'HOST') AND (name LIKE '[NAME]' OR id = '[NAME]' OR domainId = '[NAME]')` (Note that the string `[NAME]` is replaced by the series name at runtime).


## Support

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

>Add the url for the support thread here

## Contributing
We encourage your contributions to improve [project name]! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.
If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company,  please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## License
Deployatron is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.


