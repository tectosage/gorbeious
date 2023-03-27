import { keyringArray as keyringArrayStore, historyArray, transactionPromise, coins as coinStore, funds as fundsStore,
   promise, signals as SignalStore, payments as paymentStore, websocket, loaded} from "./stores.js"
import {get} from 'svelte/store'
import {count, swap,} from './functions.js'
import { getPayments, buildPayment } from "./swap.js"

import {Script} from 'bcash'
import {Buffer} from 'buffer'
//import {ChronikClient} from 'chronik-client'


//const chronik = new ChronikClient("https://chronik.be.cash/xec");

export const main = async () => {
    //await get(promise)
    //historyArray.set(await get(transactionPromise))
    //loaded.set(true)
    let keyringArray = get(keyringArrayStore)
    let signals = get(SignalStore)
    let arr = []
    console.log('opening websocket')
    const ws = chronik.ws({
      onMessage: msg => {
        //console.log("Got update: ", msg)
        if(msg.txid && !arr.includes(msg.txid )&& !get(historyArray).map(a=>a.txid).includes(msg.txid)){
          console.log("Got update: ", msg)
          arr.push(msg.txid)
          incoming(msg.txid)
        }
      },
      onReconnect: e => {
        // Fired before a reconnect attempt is made:
        //console.log("Reconnecting websocket, disconnection cause: ", e)
      },
    })
    const swapWS = chronik.ws({
      onMessage: async(msg) => {
        console.log('got a swap websocket message!')
        if(msg.txid && !arr.includes(msg.txid) && !get(historyArray).map(a=>a.txid).includes(msg.txid)){
          await new Promise(resolve => setTimeout(resolve, 3000));
          getPayments(get(SignalStore), get(historyArray))
        }
      },
      onReconnect: e =>{
        console.log('Reconnecting Swap websocket')
      }
    })
    websocket.set(swapWS)

    await ws.waitForOpen()
    console.log('opened websocket')
    for(let i=0; i<keyringArray.length; i++){
        ws.subscribe("p2pkh", keyringArray[i].hash)
    }

    await swapWS.waitForOpen()
    console.log('opened swap websocket')
    for(let i=0; i<signals.length; i++){
      let script = buildPayment(signals[i].txid)
      script = script.toRaw().toString('hex')
      swapWS.subscribe('other', script)
    }

}

export const incoming = async (txid) => {
    console.log('incomingg transaction')
    let transaction = await chronik.tx(txid)
    transaction = await count(transaction)
    transaction = await swap(transaction)
    
    let history = get(historyArray)
    if(transaction.swap && transaction.swap.type == 'signal'){
      if(!get(SignalStore).map(s=>s.txid).includes(transaction.txid)){
        SignalStore.set([transaction, ...get(SignalStore)])
      }
      let ws = get(websocket)
      ws.waitForOpen()
      let script = buildPayment(transaction.txid)
      script = script.toRaw().toString('hex')
      ws.subscribe('other', script)
    } 
    else if (transaction.swap && transaction.swap.status == 'pending'){
      if(!get(paymentStore).map(p=>p.txid).includes(transaction.txid)){
        paymentStore.set([transaction, ...get(paymentStore)])
      }
    } 
    else if(transaction.inputs[0].value == '546' && get(paymentStore).map(p=>p.swap.inputs[0].transaction.txid).includes(transaction.inputs[0].prevOut.txid)){
      console.log('Incoming finalization of payment')
      paymentStore.set(get(paymentStore).filter(p=> p.swap.inputs[0].transaction.txid != transaction.inputs[0].prevOut.txid))
      for(let i=0; i<history.length; i++){
        console.log('searching')
        if(history[i].swap && history[i].swap.baton && history[i].swap.baton == transaction.inputs[0].prevOut.txid){
          console.log('found')
          history[i].swap.status = 'Completed!'
          historyArray.set(history)
          break
        }
      }
    }
    else if(history.filter(h=> h.swap && h.swap.type == 'signal').map(h=> h.inputs[0].prevOut.txid).includes(transaction.inputs[0].prevOut.txid)){
    //let history = get(historyArray)
      for(let i=0;i<history.length;i++){
        if(history[i].inputs[0].prevOut.txid == transaction.inputs[0].prevOut.txid && history[i].swap){
          if(transaction.isSwap){
            history[i].swap.status = 'Completed'
          }else{
            history[i].swap.status = 'Cancelled'
          }
          break
        }
      }
      historyArray.set(history)
    }

    historyArray.set([transaction, ...get(historyArray)]) 
    console.log('funds before ', get(fundsStore)/100,' funds to add ', transaction.value/100 )
    if(transaction.slpTxData){
      console.log('SLP tokens: ', parseInt(transaction.slpValue) )
    }
}