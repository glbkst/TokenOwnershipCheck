
// SPDX-License-Identifier: MIT

const farcasterHubUrl = 'https://hubs.airstack.xyz'
const baseRpcProviderUrl = ''
const airStackApiKey = ''
const ethers = require("ethers")
const axios = require('axios')

//see https://github.com/moxie-protocol/contracts/blob/dev/packages/protocol/ignition/deployments/base-mainnet/deployed_addresses.json
const tokenManagerContractaddr = "0xFfeACE4541276aC65c4e433B7fC63cdA32b30470"

const tokenMgrAbi = [
  {"inputs":[
    {"internalType":"address","name":"subject","type":"address"}
  ],
  "name":"tokens",
  "outputs":[
    {"internalType":"address","name":"token","type":"address"}
  ],
  "stateMutability":"view",
  "type":"function"
  }
]

const tokenAbi = [
  {"inputs":
    [
      {"internalType":"address","name":"account","type":"address"}
    ],
    "name":"balanceOf",
    "outputs":
    [
      {"internalType":"uint256","name":"","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  }
]

const provider = new ethers.JsonRpcProvider(baseRpcProviderUrl)
const tokenMgrContract = new ethers.Contract(tokenManagerContractaddr, tokenMgrAbi, provider)

async function getAddressesForFid(fid) {
    const addresses = []
    try {
      const response = await axios.get(`${farcasterHubUrl}/v1/verificationsByFid?fid=${fid}`, {
        headers: {
          "Content-Type": "application/json",
          "x-airstack-hubs": airStackApiKey,
        },
      });    
      response.data.messages.forEach(element => {
        const data = element.data
        if(data.verificationAddAddressBody.protocol == "PROTOCOL_ETHEREUM"){
          addresses.push(data.verificationAddAddressBody.address)
        }      
      });
      return addresses
    
    } catch (e) {
      console.error(e);
    }
}
  
async function getTokenForAddress(addr) {
    return await tokenMgrContract.tokens(addr)
}

async function hasTokens(addr, token) {
    const tokenContract = new ethers.Contract(token, tokenAbi, provider)
    const balance = await tokenContract.balanceOf(addr)
    if( balance > 0) {
        return true
    }
    return false
}

//example 
//for a real use-case the hasTokens call is probably a separate step
//and also for more than a single call 
async function CheckIfOwner( fidOfToken, addressToCheckIfOwner ) {

    const addresses = await getAddressesForFid(fidOfToken)
    for(var i=0;i<addresses.length;i++) {
      var element = addresses[i]
      const token = await getTokenForAddress(element)
      if(token != ethers.ZeroAddress) {
        console.log("fid: %s with token %s ", fidOfToken, token)

        const isOwner = await hasTokens(addressToCheckIfOwner, token)
        if( isOwner ) {
            console.log("%s has tokens", addressToCheckIfOwner)
        }
      }
    }
}

