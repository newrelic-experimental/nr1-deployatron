import { NerdGraphQuery } from 'nr1'

export const shardedQuery = async (accounts,nrql,label) => {
    const innerNRQL = `
    nrql( query:  "${nrql}")
    {
        results
        metadata { facets }
    }
    `;

    const shardSize=10

    let resultData={}

    const shardedQuery= (accountList) => { //returns a promise!
        return new Promise(function(resolve, reject) {
            let accountQueries=""
            accountList.forEach((account)=>{
                accountQueries+=`
                    account_${account.id}: account(id: ${account.id}) {
                        ${innerNRQL}                       
                    }
                `
            })

            let query = `
                query {
                    actor {
                        ${accountQueries}
                    }
                }
            `
            const x = NerdGraphQuery.query({ query: query, variables: {}, fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE });
            x.then(results => {
                accountList.forEach((account)=>{
                    const accountRef=`account_${account.id}`
                    if(results.data.actor[accountRef] && results.data.actor[accountRef].nrql && results.data.actor[accountRef].nrql.results) {
                        resultData[`account_${account.id}`]= {
                            id: account.id,
                            name: account.name,
                            data: results.data.actor[accountRef].nrql.results,
                            facets: results.data.actor[accountRef].nrql.metadata.facets
                        }
                    }
                })
                resolve()
            }).catch((error) => { console.error(error); reject(error) })
            });
    }

    //chunkArray()
    //convert an array into array of arrays of certain length
    const chunkArray = (arr, len) => {
        var chunks = [],
            i = 0,
            n = arr.length;
        while (i < n) {
          chunks.push(arr.slice(i, i += len));
        }
        return chunks;
      }

      

    let accountListChunks=chunkArray(accounts,shardSize)
    let errors=false
    for (let i = 0; i < accountListChunks.length; i++) {
        try {
            await shardedQuery(accountListChunks[i])
        } catch(e) {
            console.log(`Error with request ${i+1}`,e)
            errors=true
        }
        
    }
    //console.log(`🧮 Shard query results (${label}):`,resultData)
    return { data: resultData, errors: errors}

  };
  