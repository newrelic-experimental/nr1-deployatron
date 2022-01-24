export const AGGREGATE_OPTIONS = {
    SUM: "SUM",
    AVG: "AVG"
}

export const aggregateFunction = (aggregateType, data, fieldName) => {
    const dataArray = Object.keys(data).map((key) => { return data[key] }) //convert multi account object ot array


    const sumData = (dataArr) =>{
        let result = 0;
        dataArr.forEach((acc) => {
            if (acc.data && acc.data.length == 1) {
                if (acc.data[0][fieldName]) {
                    result = result + acc.data[0][fieldName]
                }
            }
        })
        return result
    } 

    switch (aggregateType) {
        case AGGREGATE_OPTIONS.SUM:
            return sumData(dataArray)
        case AGGREGATE_OPTIONS.AVG:
            return sumData(dataArray)/dataArray.length
        default:
            console.error(`Unknown aggregate function: ${aggregateType}`)
    }
}

export const combineAccountTimeseriesChartData = (data,field,units) => {
    let chartDataPoints=[]
    const dataArray = Object.keys(data.data).map((key) => { return data.data[key] }) //convert multi account object ot array
    dataArray.forEach((account,idx)=>{
        chartDataPoints.push({
            metadata: {
                id: `series_${idx}`,
                name: account.name,
                color: account.color,
                viz: 'main',
                units_data: {
                    x: 'TIMESTAMP',
                    y: units,
                }
            } ,
            data: account.data.map((dataPoint)=>{
                return { 
                    x: dataPoint.endTimeSeconds*1000,
                    y: dataPoint[field]
                }
            }) 
                               
        })
    })
    return chartDataPoints
}

/*
* asyncForEach()
*
* A handy version of forEach that supports await.
* @param {Object[]} array     - An array of things to iterate over
* @param {function} callback  - The callback for each item
*/
export const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }