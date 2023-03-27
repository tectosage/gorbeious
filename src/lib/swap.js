import {keyringArray as keyringStore, coins as coinStore, tokenCoins as tokenCoinsStore, tokenRecords as tokenRecordsStore, reservedCoins as reservedCoinsStore, reservedTokenCoins as reservedTokenCoinsStore, signals as SignalStore, payments as paymentStore, websocket, isMobile, reloading, historyArray, price} from "./stores"
import {sendXEC, sendToken, coinFromTX, coinFromChronikTX, buildSendOpReturn, countSpent, swap, getTransaction, reload} from './functions'
import {MTX, Script, Input, Coin} from 'bcash'
import {get} from 'svelte/store'
import { makeTokenRecord } from "./functions"
import BigNumber from "bignumber.js"
import { Buffer } from 'buffer'
import SLP from 'bcash/lib/script/slp'


const buildPointerSignalOpReturn = (tokenId, type) => {
    const signalOpReturn = new Script()
            .pushSym('return')
            .pushData(Buffer.from('SWP\x00', 'ascii'))
            .pushPush(Buffer.alloc(1, 1))
            .pushPush(Buffer.alloc(1, 1))
            .pushData(Buffer.from(tokenId, 'hex'))
            .pushData(Buffer.from(type, 'ascii'))
    return signalOpReturn.compile();
}

const buildSignal = (tokenId, type, rate, offeringCoin, minimumSats, peg) => {
    const signalOpReturn = new Script()
            .pushSym('return')
            .pushData(Buffer.from('SWP\x00', 'ascii'))
            .pushPush(Buffer.alloc(1, 1))
            .pushPush(Buffer.alloc(1, 1))
            .pushData(Buffer.from(tokenId, 'hex'))
            .pushData(Buffer.from(type, 'ascii'))
            .pushData(Buffer.from(rate.toString()))
            .pushPush(Buffer.alloc(1, 0))
            .pushData(offeringCoin.hash)
            .pushPush(Buffer.alloc(1, offeringCoin.index))
            if(minimumSats == null){
                signalOpReturn.pushPush(Buffer.alloc(1, 0))
            }else{
                signalOpReturn.pushData(Buffer.from(minimumSats.toString()))
            }
            if(peg == null){
                signalOpReturn.pushPush(Buffer.alloc(1, 0))
            }else{
                signalOpReturn.pushData(Buffer.from(peg.toString()))
            }

    return signalOpReturn.compile();
}

export const buildPayment = (signalTXID) => {
    const opReturn = new Script()
            .pushSym('return')
            .pushData(Buffer.from('SWP\x00', 'ascii'))
            .pushPush(Buffer.alloc(1, 2))
            .pushPush(Buffer.alloc(1, 1))
            .pushData(Buffer.from(signalTXID, 'hex'))

    return opReturn.compile();
}

const buildData  = (count, data) => {
    const opReturn = new Script()
            .pushSym('return')
            .pushPush(Buffer.alloc(1, count))
            .pushData(data)
    return opReturn.compile();
}

const buildPayload = (data) => {
    const opReturn = new Script()
            .pushSym('return')
            .pushData(data)
    return opReturn.compile();
}

export const createOffer = async (tokenId, amount, rate, type, minimum, peg) => {

    let keyringArray = get(keyringStore)
    let coins = get(coinStore)
    let allTokenCoins = get(tokenCoinsStore)
    let tokenCoins = allTokenCoins[tokenId]
    let tokenRecords = get(tokenRecordsStore)
    if(!tokenRecords[tokenId]){
        tokenRecords[tokenId] = await makeTokenRecord(tokenId)
        tokenRecordsStore.set(tokenRecords)
    }
    let decimals = tokenRecords[tokenId].decimals
    let offeredUTXO
    let change
    let count
    let reservedCoins = get(reservedCoinsStore)
    let minimumSats
    rate = Math.round(new BigNumber(rate).times(100))/100
    amount = Math.round(new BigNumber(amount).times(10**decimals)) / (10**decimals)

    if(minimum != null){
        minimum = Math.round(new BigNumber(minimum).times(10**decimals)) / (10**decimals)
        console.log(minimum)
        if(minimum == 0){
            minimumSats = 0
        }else{
            minimumSats = Math.round(new BigNumber(minimum).times(rate).times(100))
        }
        //console.log(minimumSats)
    }

    if(type == 'SELL'){
        let allReservedTokenCoins = get(reservedTokenCoinsStore) 
        let reservedTokenCoins = []
        if(allReservedTokenCoins[tokenId]){
            reservedTokenCoins = allReservedTokenCoins[tokenId]
        }
        for(let i=0;i<tokenCoins.length;i++){
            if(tokenCoins[i].slp.value.eq(new BigNumber(amount).times(10 ** decimals))){
                console.log('Found token UTXO for swap offer')
                offeredUTXO = tokenCoins[i]
                tokenCoins.splice(i,1)
                allTokenCoins[tokenId] = tokenCoins
                tokenCoinsStore.set(allTokenCoins)
                break
            }
        }
        if(!offeredUTXO){
            console.log('No token UTXO found for swap offer, creating one')
            let result = await sendToken(tokenId, amount, keyringArray[11].getKeyAddress("string"))
            let resp = await result[0]
            let tx = result[1]
            console.log('offering resp', resp)
            count = countSpent(tx, coins)
            change = count[0]
            coins = count[1]
            offeredUTXO = coinFromTX(tx, 1, 
                {tokenId: tokenId, index: 1, value: new BigNumber(amount).times(10** decimals), type: 'SEND'})
            //coins = get(coinStore)
            for(let i=0;i<change.length;i++){
                if(change[i].value > 546){
                    coins.push(change[i])
                }
            }
            // ?reservedTokenCoins.push()
        }
        console.log('offered utxo', offeredUTXO)
        reservedTokenCoins.push(offeredUTXO)
        allReservedTokenCoins[tokenId] = reservedTokenCoins
        reservedTokenCoinsStore.set(allReservedTokenCoins)
        //console.log('coins reserved')

    }else {
        reservedCoins = get(reservedCoinsStore)
        let totalSats = Math.round(new BigNumber(amount).times(rate).times(100))
        for(let i=0;i<coins.length;i++){
            if(coins[i].value == totalSats){
                console.log('Found XEC UTXO for swap')
                offeredUTXO = coins.splice(i, 1)[0]
                break
            }
        }
        
        if(!offeredUTXO){
            console.log('No XEC UTXO found for swap, creating one')
            let result = await sendXEC(keyringArray[12].getKeyAddress("string"), totalSats/100)
            let resp = await result[0]
            let tx = result[1]
            count = countSpent(tx,coins)
            change = count[0]
            coins = count[1]
            console.log(resp, tx)
            offeredUTXO = coinFromTX(tx, 0)
            //coins = get(coinStore)
            for(let i=0;i<change.length;i++){
                if(change[i].value != totalSats){
                    coins.push(change[i])
                }
            }
        }
        console.log('offered UTXO ', offeredUTXO)
        reservedCoins.push(offeredUTXO)
        //reservedCoinsStore.set(reservedCoins)
    }
    
    /*if(coins.length < 3){
        await new Promise(resolve => setTimeout(resolve, 2000));
    }*/
    //coins = get(coinStore)
    console.log('Creating pointer to Signal transaction')
    let pointerTX = new MTX()
    pointerTX.addOutput(buildPointerSignalOpReturn(tokenId, type), 0)
    pointerTX.addOutput(keyringArray[12].getKeyAddress("string"), 546); //baton. For a SWAP to be valid, baton must be unspent, and pointer spent
    pointerTX.addOutput(keyringArray[12].getKeyAddress("string"), 546); //pointer
    await pointerTX.fund(coins, {
        changeAddress: keyringArray[12].getKeyAddress("string"),
        rate: 1000 // sats/thousand bytes
    })
    pointerTX.sign(keyringArray)

    count = countSpent(pointerTX, coins)
    change = count[0]
    coins = count[1]
    //coins = get(coinStore)
    for(let i=0;i<change.length;i++){
        if(change[i].value != 546){
            coins.push(change[i])
        }
    }
    //coinStore.set(validCoins)
    let batonCoin = coinFromTX(pointerTX, 1)
    reservedCoins.push(batonCoin)
    reservedCoinsStore.set(reservedCoins)
    let pointerCoin = coinFromTX(pointerTX, 2)
    let rawTx = Uint8Array.from(pointerTX.toRaw());
    let resp
    try{
        resp = await chronik.broadcastTx(rawTx);
    }catch{
        console.log("ERROR broadcasting offer pointer transaction", pointerTX.toRaw().toString('hex'))
    }
    console.log('pointer resp ', resp)
    
    console.log('Creating Signal')
    let signalTX = new MTX()
   if(peg){peg = Math.round(get(price)*100000000)}
    signalTX.addOutput(buildSignal(tokenId, type, rate*100, offeredUTXO, minimumSats, peg), 0)
    await signalTX.fund([pointerCoin, ...coins], {
        inputs: [pointerCoin].map(coin => Input.fromCoin(coin).prevout),
        changeAddress: keyringArray[12].getKeyAddress("string"),
        rate: 1000 // sats/thousand bytes
    })
    signalTX.sign(keyringArray)
    count = countSpent(signalTX, coins)
    change = count[0]
    coins = count[1]
    rawTx = Uint8Array.from(signalTX.toRaw());
    resp = await chronik.broadcastTx(rawTx)
    console.log('signal resp ', resp)
    
    let script = buildPayment(resp.txid)
    script = script.toRaw().toString('hex')
    let ws = get(websocket)
    await ws.waitForOpen()
    ws.subscribe('other', script)
    console.log('added new signal to websocket')
    return resp

}

export const findSignals = async (tokenId, type) => {
    let tokenRecords = get(tokenRecordsStore)
    let keyringArray = get(keyringStore)
    if(!tokenRecords[tokenId]){
        tokenRecords[tokenId] = await makeTokenRecord(tokenId)
        tokenRecordsStore.set(tokenRecords)
    } 
    let decimals = tokenRecords[tokenId].decimals
    let pointers = []
    let signals = []
    let validSignals = []
    let unpayedSignals = []
    let script = buildPointerSignalOpReturn(tokenId, type).toJSON()
    let result = await chronik.script('other', script).history(0, 200)
    result = result.txs
    for(let i=0;i<result.length;i++){
        if(result[i].outputs.length > 2 && !result[i].outputs[1].spentBy && result[i].outputs[2].spentBy){
            let input = result[i].inputs[0]
            if(!keyringArray.map(v=>v.hash).includes(input.outputScript.slice(6, -4))){
                pointers.push(result[i])
            }
        }
    }
    signals = pointers.map(tx=>chronik.tx(tx.outputs[2].spentBy.txid))
    signals = await Promise.all(signals) 

    for(let i=0; i<signals.length;i++){
        let signal = signals[i]
        let script = new Script(Buffer.from(signal.outputs[0].outputScript, 'hex'))
        try{
            signal.swap = {description: 'Swap Offer', type: 'signal', tokenId: tokenId, offer: script.code[5].data.toString('ascii'), 
            rate: new BigNumber(script.code[6].data.toString()).div(100).toNumber(), offering:script.code[8].data.reverse().toString('hex'), index: script.code[9].data[0]}
            
            let min = script.code[10].data

            //console.log(min.toString())
            //   console.log(script.code[6].data)
            if(min[0] != 0){
                if(min.toString() != '0'){
                    signal.swap.minimum = Math.round(new BigNumber(min.toString()).div(100).div(signal.swap.rate).times(10 ** decimals).toNumber()) / (10 ** decimals)

                    //console.log('offer minimum', signal.swap.minimum)
                }else{
                    signal.swap.minimum = '0'
                }
            }
            signal.swap.offeringTx = chronik.tx(signal.swap.offering)
        }catch{
            signal.invalid = true
        }
    }
    for(let i=0; i<signals.length; i++){
        let signal = signals[i]
        if(!signal.invalid){
            try{
                signal.swap.offeringTx = await signal.swap.offeringTx
                if(signal.swap.offeringTx.outputs[signal.swap.index].spentBy){
                    signal.swap.invalid = true
                    continue
                }
                signal.swap.fee = true
                if(signal.swap.offer == 'SELL'){
                    signal.swap.amount = signal.swap.offeringTx.outputs[signal.swap.index].slpToken.amount
                    signal.swap.normalAmount = signal.swap.offeringTx.outputs[signal.swap.index].slpToken.amount / (10 ** decimals)
                }else{
                    //signal.swap.amount = (signal.swap.offeringTx.outputs[signal.swap.index].value / (signal.swap.rate*100)) * (10 ** tokenRecords[tokenId].decimals)
                    signal.swap.amount = Math.round(new BigNumber(signal.swap.offeringTx.outputs[signal.swap.index].value).div(signal.swap.rate).div(100).times(10 ** decimals).toNumber())
                    //signal.swap.normalAmount = signal.swap.offeringTx.outputs[signal.swap.index].value / (signal.swap.rate*100)
                    signal.swap.normalAmount = signal.swap.amount / (10 ** decimals)
                }
                //console.log(signal.swap.amount, signal.swap.normalAmount)
                
                if(new BigNumber(signal.swap.amount).div(10 ** decimals).times(signal.swap.rate).lt(546)){
                    //console.log('no fee')
                    signal.swap.fee = false
                    signal.swap.realRate = signal.swap.rate
                }else{
                    //console.log('fee')
                    if(signal.swap.offer == 'SELL'){
                        signal.swap.realRate = Math.round(new BigNumber(signal.swap.rate).times(101))/100
                    }else{
                        signal.swap.realRate = Math.round(new BigNumber(signal.swap.rate).times(99))/100
                    }

                    //console.log(signal.swap.realRate)
                }
                signal.swap.pointerTx = pointers[i]
                //console.log('valid signal')
                let script = buildPayment(signal.txid)
                script = script.toRaw().toString('hex')
                signal.payments = chronik.script('other', script).history(0, 5)
                validSignals.push(signal)
            }catch (error){
                console.log(error)
                signal.swap.invalid = true
                //console.log('invalid signal')
            }
        }
    }
    for(let i=0; i<validSignals.length; i++){
        validSignals[i].payments = await validSignals[i].payments
    }
    for(let i=0; i<validSignals.length; i++){
        validSignals[i].payments = validSignals[i].payments.txs
        let arr = []
        validSignals[i].payments.map(p=> arr.push(getTransactionFromPayment(p)))
        validSignals[i].payments = arr
    }
    for(let i=0; i<validSignals.length;i++){
        let signal = validSignals[i]
        let payed = false
        for(let i=0; i<signal.payments.length; i++){
            let payment = await signal.payments[i]
            let result = await chronik.validateUtxos([{txid: payment.inputs[2].prevout.hash.reverse().toString('hex'), outIdx: payment.inputs[2].prevout.index}])
            if(result[0].state == "UNSPENT"){
                console.log('already pending payment found')
                payed = true
                break
            }
            //console.log(result)
        }
        if(!payed){
            unpayedSignals.push(signal)
        }
    }
    let request = {pkhs: []}
    for(let i=0; i<unpayedSignals.length; i++){
        request.pkhs.push(unpayedSignals[i].inputs[0].outputScript.slice(6,-4))
    }

    let response = await fetch('https://gorbeious.cash/live/check', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request)})
    let data = await response.json()

    for(let i=0; i<unpayedSignals.length; i++){
        if(data[unpayedSignals[i].inputs[0].outputScript.slice(6,-4)]){
            unpayedSignals[i].swap.active = true
        }
    }

    return unpayedSignals

}

export const payment = async (offer, portion) => {
    console.log(offer, offer.swap.pointerTx, offer.swap.offeringTx)
    //create the tx 
    //make the informations txs 
    //broadcast 
    let keyringArray = get(keyringStore)
    let tokenRecords = get(tokenRecordsStore)
    let decimals = tokenRecords[offer.swap.tokenId].decimals
    
    let tokenId = offer.swap.tokenId
    let type = offer.swap.offer
    let rate = offer.swap.rate
    let offeringTx = offer.swap.offeringTx
    let pointerTx = offer.swap.pointerTx
    let batonCoin = coinFromChronikTX(pointerTx, 1)
    let tokenAmount = new BigNumber(offer.swap.amount).div(10 ** decimals)
    let tokenSats = new BigNumber(offer.swap.amount)
    if(portion){
        portion = Math.round(new BigNumber(portion).times(10**decimals))/(10**decimals)
        //console.log(portion)
        if(portion == offer.swap.normalAmount){
            portion = null
        }else{
            tokenAmount = portion
            //tokenSats = portion * (10 ** decimals)
            tokenSats = Math.round(new BigNumber(portion).times(10**decimals))
            //console.log(tokenSats)
        }
    }


    let myAddress = keyringArray[12].getKeyAddress("string")
    let feeAddress = 'ecash:qqxhef0xt3ca04sr3cxvjp3hq4ph8h8gv5jm07pnaa'
    let coins = get(coinStore)
    let reservedCoins = get(reservedCoinsStore)
    let reservedTokenCoins = get(reservedTokenCoinsStore)
    
    let change
    let count
    //let coins
    let exchangeTX
    if(type == 'SELL'){
        console.log('amount of XEC = ', tokenAmount * rate * 1.01)
        
        //let owedAmount = (rate * tokenAmount * 100) 
        let owedAmount = Math.round(new BigNumber(rate).times(tokenAmount).times(100))
        //console.log(rate, tokenAmount, owedAmount)
        if(!portion){
            owedAmount += 546
        }
        let result
        let fee
        /*if(offer.swap.fee){
            fee = (rate * tokenAmount * .01 * 100)
            console.log('amount owed: ', owedAmount, ' fee: ', fee)
            result = await sendXEC(myAddress, (tokenAmount * rate * 1.01)+6.7)
        }else{
            result = await sendXEC(myAddress, (tokenAmount * rate)+6.7)
        }*/

        //if(offer.swap.fee && !((tokenAmount * rate) < 546)){
        if(offer.swap.fee && !(new BigNumber(tokenAmount).times(rate).lt(546))){
            //fee = rate * tokenAmount * .01 * 100
            fee = Math.round(new BigNumber(rate).times(tokenAmount))
            console.log('amount owed: ', owedAmount, ' fee: ', fee)
            //result = await sendXEC(myAddress, (tokenAmount * rate * 1.01)+8)

            result = await sendXEC(myAddress, Math.round(new BigNumber(tokenAmount).times(rate).times(1.01).plus(8).times(100))/100)

            //result = await sendXEC(myAddress, new BigNumber(tokenAmount).times(rate).times(1.01).plus(8).toNumber())
        }else{
            //result = await sendXEC(myAddress, (tokenAmount * rate)+6.7)

            result = await sendXEC(myAddress, Math.round(new BigNumber(tokenAmount).times(rate).plus(6.7).times(100))/100)

            //result = await sendXEC(myAddress, new BigNumber(tokenAmount).times(rate).plus(6.7).toNumber())
        }


        let resp = await result [0]
        let tx = result[1]
        coins = countSpent(tx, coins)[1]
        if(tx.outputs[1]){
            coins.push(coinFromTX(tx, 1))
        }
        console.log(resp)

        let myCoin = coinFromTX(tx, 0)
        let offeredCoin = coinFromChronikTX(offeringTx, offer.swap.index, {tokenId: offeringTx.slpTxData.slpMeta.tokenId,
        index: offer.swap.index, value: tokenSats, type: offeringTx.slpTxData.slpMeta.txType
        });
        let inputs = [batonCoin, offeredCoin, myCoin]
        exchangeTX = new MTX()
        //let sendOpReturn = buildSendOpReturn(tokenId, [tokenSats.toString()])
        let sendOpReturn
        if(!portion){
            sendOpReturn = buildSendOpReturn(tokenId, [tokenSats.toString()])
        }else{
            sendOpReturn = buildSendOpReturn(tokenId, [tokenSats.toString(),
                new BigNumber(offer.swap.amount).minus(tokenSats).toString()])
        }
        exchangeTX.addOutput(sendOpReturn, 0)
        exchangeTX.addOutput(myAddress, 546)
        if(portion){
            exchangeTX.addOutput(new Script(Buffer.from(pointerTx.outputs[1].outputScript,'hex')), 546)
        }
        //the below should prolly be changed
        //exchangeTX.addOutput(new Script(Buffer.from(offeringTx.outputs[1].outputScript,'hex')), owedAmount)
        exchangeTX.addOutput(new Script(Buffer.from(pointerTx.outputs[1].outputScript,'hex')), parseInt(owedAmount))
        if(fee){
            exchangeTX.addOutput(feeAddress, fee)
        }
        await exchangeTX.fund([...inputs], {
            inputs: inputs.map(coin=> Input.fromCoin(coin).prevout),
            changeAddress: myAddress,
            rate: 1000
        })
        exchangeTX.sign(keyringArray)
        //console.log(exchangeTX)
        //console.log(exchangeTX.hash())
        console.log('raw exchange tx ', exchangeTX.toRaw().toString('hex'))
        //console.log(exchangeTX.toRaw().length)
        coins = countSpent(exchangeTX, coins)[1]

        reservedCoins.push(myCoin)
        reservedCoinsStore.set(reservedCoins)
    }else{
        console.log('owed tokens', tokenAmount)
        let totalSellPrice
        let totalChange
        if(portion){
            //totalChange = parseInt(new BigNumber(offer.swap.amount).div(10 ** tokenRecords[tokenId].decimals).minus(tokenAmount).times(rate).times(100))
            totalChange = Math.round(new BigNumber(offer.swap.normalAmount).minus(tokenAmount).times(rate).times(100))
        }
        let fee 
        //if(offer.swap.fee && !(tokenAmount*rate < 546)){
        if(offer.swap.fee && !(new BigNumber(tokenAmount).times(rate).lt(546))){
            //totalSellPrice = tokenAmount * rate * 99
            totalSellPrice = Math.round(new BigNumber(tokenAmount).times(rate).times(99))
            //fee = tokenAmount * rate
            fee = Math.round(new BigNumber(tokenAmount).times(rate))
        }else{
            //totalSellPrice = tokenAmount * rate * 100
            totalSellPrice = Math.round(new BigNumber(tokenAmount).times(rate).times(100))
        }
        /*
        if(offer.swap.fee && !(tokenAmount*rate < 546)){
            totalSellPrice = new BigNumber(tokenAmount).times(rate).times(99).toNumber()
            fee = new BigNumber(tokenAmount).times(rate).toNumber()
        }else{
            totalSellPrice = new BigNumber(tokenAmount).times(rate).times(100).toNumber()
        }
        totalSellPrice = Math.round(totalSellPrice)

        console.log(tokenAmount)*/
        let result = await sendToken(tokenId, tokenAmount, myAddress, 770)
        console.log(totalSellPrice, fee)
        let resp = await result[0]
        console.log('token resp', resp)
        let tx = result[1]
        count = countSpent(tx, coins)
        change = count[0]
        coins = count[1]
        change.filter(c=> c.value != 770 && c.value != 546).map(c=> coins.push(c))
        console.log(change.filter(c=> c.value != 770 && c.value != 546))
        let myCoin = change[0]
        let buffer = Buffer.allocUnsafe(4)
        let record = SLP.SlpCoinRecord({hash: myCoin.hash, vout: myCoin.index,
            tokenId: tokenId, tokenIndex: buffer.writeUInt32BE(myCoin.index, 0),
             value: new BigNumber(tokenAmount).times(10 ** tokenRecords[tokenId].decimals),
            type: 'SEND'})
        myCoin.slp = record


        /*result = await sendXEC(myAddress, 8, coins)
        resp = await result[0]
        console.log('fee resp', resp)
        tx = result[1]
        count = countSpent(tx, coins)
        change = count[0]
        coins = count[1]
        change.filter(c=>c.value != 8).map(c=> coins.push(c))
        let feeCoin = coinFromTX(tx, 0)*/

        let offeredCoin = coinFromChronikTX(offeringTx, offer.swap.index)
        //let inputs = [batonCoin, offeredCoin, myCoin, feeCoin]
        let inputs = [batonCoin, offeredCoin, myCoin]
        exchangeTX = new MTX()
        let sendOpReturn = buildSendOpReturn(tokenId, [tokenSats.toString()])
        exchangeTX.addOutput(sendOpReturn, 0)
        exchangeTX.addOutput(new Script(Buffer.from(pointerTx.outputs[1].outputScript,'hex')), 546)
        exchangeTX.addOutput(myAddress, totalSellPrice)
        if(portion){
            exchangeTX.addOutput(new Script(Buffer.from(pointerTx.outputs[1].outputScript,'hex')), totalChange)
        }
        if(fee){
            exchangeTX.addOutput(feeAddress, fee)
        }
        await exchangeTX.fund([...inputs], { //removed ..coins
            inputs: inputs.map(coin=> Input.fromCoin(coin).prevout),
            changeAddress: myAddress,
            rate: 1000
        })
        exchangeTX.sign(keyringArray)
        console.log(exchangeTX)
        console.log(exchangeTX.hash())
        console.log('raw exchange tx ', exchangeTX.toRaw().toString('hex'))
        console.log(exchangeTX.toRaw().length)

        if(!reservedTokenCoins[tokenId]){
            reservedTokenCoins[tokenId] = [myCoin]
        }else{
            reservedTokenCoins[tokenId].push(myCoin)
        }
        reservedTokenCoinsStore.set(reservedTokenCoins)
    }
    //coins = get(coinStore)

    let paymentTX = new MTX()
    paymentTX.addOutput(buildPayment(offer.txid), 0)
    paymentTX.addOutput(myAddress, 546)
    await paymentTX.fund(coins,{
        changeAddress: myAddress,
    
        rate: 1000 // sats/thousand bytes
    });
    paymentTX.sign(keyringArray)
    //let change = countSpent(paymentTX)
    //coins = [...get(coinStore), ...change]
    let paymentBaton = coinFromTX(paymentTX, 1)
    count = countSpent(paymentTX, coins)
    change = count[0]
    coins = count [1]
    for(let i=0;i<change.length;i++){if(change[i].value != 546){coins.push(change[i])}}

    let exchangeRaw = exchangeTX.toRaw()
    let exchangeSize = exchangeRaw.length
    let dataTransactionCount = 0 
    while(exchangeSize > 0){
        if(dataTransactionCount == 0){
            dataTransactionCount++
            exchangeSize = exchangeSize - 217
        }else{
            dataTransactionCount++
            exchangeSize = exchangeSize - 219
        }   
    }
    let currentCount
    let dataTransactions = []
    for(let i=0; i<dataTransactionCount; i++){
        let tx = new MTX()
        if(i==0){
            tx.addOutput(buildData(dataTransactionCount, exchangeRaw.slice(0,217)), 0)
            currentCount = 217
        }else{
            tx.addOutput(buildPayload(exchangeRaw.slice(currentCount,currentCount+219)), 0)
            currentCount = currentCount + 219
        }
        if(i<dataTransactionCount-1){
            tx.addOutput(myAddress, 546)
        }
        await tx.fund([...[paymentBaton], ...coins], {
            inputs: [paymentBaton].map(coin=> Input.fromCoin(coin).prevout),
            changeAddress: myAddress,
            rate: 1000
        })
        tx.sign(keyringArray)
        if(i<dataTransactionCount){
            paymentBaton = coinFromTX(tx,1)
        }
        //change = countSpent(tx)
        //coins = [...get(coinStore), ...change]
        count = countSpent(tx, coins)
        coins = [...count[0], ...count[1]]
        dataTransactions.push(tx)
    }

    let rawTx = Uint8Array.from(paymentTX.toRaw());
    let resp = await chronik.broadcastTx(rawTx);
    console.log(resp)
    for(let i=0; i<dataTransactions.length; i++){
        let rawTx = Uint8Array.from(dataTransactions[i].toRaw());
        let resp = await chronik.broadcastTx(rawTx);
        console.log(resp)
    }
    return resp
    // make funding tx
    // remove inputs from coins, accept change if so
    //  create exchange tx, remove those inputs from the coin set

}

export const getTransactionFromPayment = async (transaction, transactions) => {
    //from payment transaction, if exchange transaction, find chunks and return transaction 
    //let script = new Script(Buffer.from(transaction.outputs[0].outputScript, 'hex'))
    if(transaction.swap && !transactions){
        transaction = await chronik.tx(transaction.txid)
    }
    if(transaction.outputs.length > 1 && transaction.outputs[1].value == '546' && transaction.outputs[1].spentBy){
        try{
        let firstTX
        if(!transactions){
            firstTX = await chronik.tx(transaction.outputs[1].spentBy.txid)
        }else{
            firstTX=transactions.filter(tx=>tx.txid == transaction.outputs[1].spentBy.txid)[0]
        }
        let script = new Script(Buffer.from(firstTX.outputs[0].outputScript, 'hex'))
        if(script.code.length == 3){
            let numTransactions = script.code[1].data[0]
            let exchangeTX = script.code[2].data.toString('hex')
            let workingTX = firstTX
            for(let i=1;i<numTransactions;i++){
                if(workingTX.outputs.length > 1 && workingTX.outputs[1].spentBy){
                    if(!transactions){
                        workingTX = await chronik.tx(workingTX.outputs[1].spentBy.txid)
                    }else{
                        workingTX = transactions.filter(tx=>tx.txid == workingTX.outputs[1].spentBy.txid)[0]
                    }
                    let script = new Script(Buffer.from(workingTX.outputs[0].outputScript, 'hex'))
                    exchangeTX = exchangeTX + script.code[1].data.toString('hex')
                }
            }
            //console.log('exchange tx size ', Buffer.from(exchangeTX, 'hex').length)
            exchangeTX = MTX.fromRaw(Buffer.from(exchangeTX, 'hex'))
            return exchangeTX
        }}catch{
            //console.log('ERROR GETTING EXCHANGE TX FROM PAYMENT')
        }
    }
}

export const getPayments = async (signals, history) => {
    
    let feeScript = '76a9140d7ca5e65c71d7d6038e0cc90637054373dce86588ac'
    let keyringArray=get(keyringStore)
    let paymentSets = [] 
    for(let i=0;i<signals.length;i++){
        let signal = signals[i] 
        let script = buildPayment(signal.txid)
        script = script.toRaw().toString('hex')
        paymentSets.push(chronik.script('other', script).history(0, 100))
    }
    paymentSets = await Promise.all(paymentSets)
    for(let s=0; s<paymentSets.length;s++){
        let paymentSet = paymentSets[s].txs //slice to be removed
        let signal = signals[s]
        let tokenRecord
        try{
            tokenRecord = get(tokenRecordsStore)[signal.swap.tokenId]
        }catch(error){continue}
        let decimals = tokenRecord.decimals
        let rate = signal.swap.rate
        let offer = signal.swap.offer
        let transactions = []
        for(let a=0; a<paymentSet.length; a++){
            transactions.push(getTransactionFromPayment(paymentSet[a]))
        }
        transactions = await Promise.all(transactions)

        for(let i=0; i<transactions.length;i++){
        try{
            console.log('NEW ITERATION')
            console.log('signal ', signal)
            let transaction = transactions[i]
            let valid = false
            let inputs = []
            let outputs = transaction.outputs

            console.log('INPUTS:')
            console.log(transaction.inputs)
            for(let i=0; i<transaction.inputs.length; i++){
                let hashhex = transaction.inputs[i].prevout.hash.toString('hex')
                let txid = Buffer.from(hashhex, 'hex').reverse().toString('hex')
                inputs.push(chronik.tx(txid))
            }

            console.log('hash 1', transaction.hash())
            inputs = await Promise.all(inputs)
            for(let i=0;i<inputs.length;i++){
                let input = inputs[i]
                inputs[i] = {tx:input.txid, index:i, transaction:input, prevout: transaction.inputs[i].prevout.index}
            }

            console.log(inputs)
            console.log(transaction)
            console.log(transaction.toRaw().toString('hex'))
            console.log(signals[s])

            let portion
            let remainder

            
            console.log('hash 2', transaction.hash())
            if(signals[s].swap.offer == 'SELL'){
                valid = true

                if(outputs[0].script.code[6]){
                    portion = parseInt(outputs[0].script.code[5].data.toString('hex'), 16)
                    remainder =  parseInt(outputs[0].script.code[6].data.toString('hex'), 16)
                }
    
                if(portion && (!signals[s].swap.minimum || parseInt(signals[s].swap.minimum) > (portion / (10** decimals)))){
                    console.log('Payment marked invalid: Condition Below Minimum')
                    continue
                }

                let offeringTX = await getTransaction(Buffer.from(signals[s].offeredUTXO.hash.toString('hex'), 'hex').reverse().toString('hex'))
                let slpTokens = (offeringTX.outputs[signals[s].offeredUTXO.index].slpToken.amount / (10** decimals))
                console.log(slpTokens)
                if(portion){
                    slpTokens = portion / (10** tokenRecord.decimals)
                }
                //let amountOwedSats = (slpTokens * rate * 100) + 546
                //let amountOwedSats = new BigNumber(slpTokens).times(rate).times(100).plus(546)

                let amountOwedSats = Math.round(new BigNumber(slpTokens).times(rate).times(100))
                console.log(slpTokens, rate, amountOwedSats)
                
                /*if(portion){
                    amountOwedSats -= 546
                    //amountOwedSats = amountOwedSats.minus(546)
                }*/
                //amountOwedSats = parseInt(amountOwedSats)

                if(!portion){
                    amountOwedSats += 546
                }

                if(!(new BigNumber(slpTokens).times(rate).lt(546))){
                    signals[s].swap.fee = true
                }
                console.log(signals[s].swap.fee)

                //verifies inclusion of baton and offered utxo
                if(inputs.length != 3 || inputs[0].tx != signals[s].inputs[0].prevOut.txid || Buffer.from(inputs[1].tx, 'hex').reverse().toString('hex') != signals[s].offeredUTXO.hash.toString('hex') || inputs[1].prevout != signals[s].offeredUTXO.index)
                {
                    console.log('Payment marked invalid: Condition 1')
                    valid = false
                    continue
                }

                for(let i=2;i<inputs.length;i++){
                    let outputScript = inputs[i].transaction.outputs[inputs[i].prevout].outputScript
                    if(keyringArray.map(v=>v.hash).includes(outputScript.slice(6, -4))){
                        console.log('Payment marked invalid: Condition Stealing ')
                        valid = false
                        continue
                    }
                }

                if((signals[s].swap.fee && portion && transaction.outputs.length < 5 )|| ((signals[s].swap.fee || portion) && transaction.outputs.length < 4) || transaction.outputs.length < 3){
                    console.log('Payment marked invalid: Condition Outputs Missing')
                    valid = false
                    continue
                }

                if(portion && (outputs[0].script.toRaw().toString('hex') != buildSendOpReturn(signal.swap.tokenId, [portion.toString(), remainder.toString()]).toRaw().toString('hex'))){
                    //console.log(outputs[0].script.toRaw().toString('hex'))
                    //console.log(outputs[0].script.toRaw().toString('hex') == buildSendOpReturn(signal.swap.tokenId, [portion.toString(), remainder.toString()]).toRaw().toString('hex'))
                    console.log('Payment marked invalid: Bad OP_RETURN')
                    valid = false
                    continue
                }

                if(!portion){
                    if(transaction.outputs[2].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript || transaction.outputs[2].value != amountOwedSats){
                        console.log('Payment marked invalid: Bring Me My Money, 1')
                        console.log(amountOwedSats)
                        console.log(transaction.outputs[2].value)
                        valid = false
                        continue
                    }
                }else{
                    if(transaction.outputs[2].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript){
                        console.log('Payment marked invalid: Bad Token Change Script')
                        valid = false
                        continue
                    }
                    if(transaction.outputs[3].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript || transaction.outputs[3].value != amountOwedSats){
                        console.log(amountOwedSats)
                        console.log('Payment marked invalid: Bring Me My Money, 2')
                        valid = false
                        continue
                    }
                }

                if(!portion){
                    //if(signals[s].swap.fee && (transaction.outputs[3].script.toRaw().toString('hex') != feeScript || transaction.outputs[3].value != parseInt(((amountOwedSats-546)*.01).toFixed(0)))){
                    if(signals[s].swap.fee && (transaction.outputs[3].script.toRaw().toString('hex') != feeScript || transaction.outputs[3].value != Math.round(new BigNumber(slpTokens).times(rate)))){
                        console.log('Payment marked invalid: Only air is Fee 1 ')
                        valid = false
                        continue
                    }
                }else{
                    //if(signals[s].swap.fee && (transaction.outputs[4].script.toRaw().toString('hex') != feeScript || transaction.outputs[4].value != parseInt(((amountOwedSats)*.01).toFixed(0)))){
                    if(signals[s].swap.fee && (transaction.outputs[4].script.toRaw().toString('hex') != feeScript || transaction.outputs[4].value != Math.round(new BigNumber(slpTokens).times(rate)))){
                        console.log('Payment marked invalid: Only air is Fee 2')
                        valid = false
                        continue
                    }
                }


                for(let i=0;i<2;i++){
                    let input = transaction.inputs[i]
                    let hash = input.prevout.hash
                    let index = input.prevout.index
                    let script
                    let keyring
                    if(i==0){
                        script = signal.swap.pointer.outputs[1].outputScript
                    }else{
                        script = offeringTX.outputs[signals[s].offeredUTXO.index].outputScript
                    }
                    for(let i=0;i<keyringArray.length;i++){
                        if(script.includes(keyringArray[i].hash)){
                            keyring = keyringArray[i]
                        }
                    }
                    let coin = new Coin({
                        hash: hash,
                        index: index,
                        script: Buffer.from(script, 'hex'),
                        value: 546
                    })
                    //console.log(keyring)
                    //console.log(script)
                    transaction.scriptInput(i, coin, keyring)
                    transaction.signInput(i, coin, keyring)
                }

            }else{
                valid = true
                //verifies the inclusion of baton and offered utxo
                if(inputs.length < 3 || signals[s].inputs[0].prevOut.txid != inputs[0].tx || Buffer.from(inputs[1].tx, 'hex').reverse().toString('hex') != signals[s].offeredUTXO.hash.toString('hex') || transaction.inputs[1].prevout.index != signals[s].offeredUTXO.index){
                    console.log('Payment marked invalid: Condition One')
                    valid = false
                    continue
                }
                for(let i=2;i<inputs.length;i++){
                    let outputScript = inputs[i].transaction.outputs[inputs[i].prevout].outputScript
                    if(keyringArray.map(v=>v.hash).includes(outputScript.slice(6, -4))){
                        console.log('Payment marked invalid: Condition Theft ')
                        valid = false
                        continue
                    }
                }
                // console.log('minimum: ', signals[s].swap.minimum)
                // console.log(inputs[2].transaction.outputs[inputs[2].prevout].slpToken.amount/ (10** tokenRecord.decimals))

                if(!inputs[2].transaction.outputs[inputs[2].prevout].slpToken){
                    console.log('Payment marked invalid: Offered coin not SLP')
                    valid = false
                    continue
                }

                if(inputs[2].transaction.outputs[inputs[2].prevout].slpToken.amount / (10** tokenRecord.decimals) < signals[s].swap.minimum){
                    console.log('Payment marked invalid: Slp less than minimum ')
                    valid = false
                    continue
                }

                //let tokenAmount = inputs[1].transaction.outputs[signals[s].offeredUTXO.index].value / rate / 100
                let tokenAmount = Math.round(new BigNumber(inputs[1].transaction.outputs[signals[s].offeredUTXO.index].value).div(rate).div(100).times(10**decimals))/(10**decimals)
                if(inputs[2].transaction.outputs[inputs[2].prevout].slpToken.amount / (10** tokenRecord.decimals) < tokenAmount){
                    portion = inputs[2].transaction.outputs[inputs[2].prevout].slpToken.amount / (10** tokenRecord.decimals)
                    remainder = tokenAmount - portion
                    tokenAmount = portion
                }
                
                
                let tokenSats = tokenAmount * (10**tokenRecord.decimals)
                //tokenSats = Math.round(tokenSats)
                let sendOpReturn = buildSendOpReturn(signals[s].swap.tokenId, [tokenSats.toString()])

                if(!new BigNumber(tokenAmount).times(rate).times(100).div(100).lt(546)){
                    signals[s].swap.fee = true
                }
                //if(transaction.outputs.length < 3 || (signals[s].swap.fee && transaction.outputs.length < 4)){
                if(transaction.outputs.length < 3 || ((signals[s].swap.fee || portion) && transaction.outputs.length < 4) || (signals[s].swap.fee
                    && portion && transaction.outputs.length < 5)){
                    console.log('Payment marked invalid: Condition Lacking Outputs')
                    valid = false
                    continue
                }

                //verifies opreturn
                if(sendOpReturn.toString('hex') != transaction.outputs[0].script.toString('hex')){
                    console.log('Payment marked invalid: Condition False OP_RETURN')
                    valid = false
                    continue
                }

                //verifies amount of token and who they are sent to
                if(parseInt(inputs[2].transaction.outputs[inputs[2].prevout].slpToken.amount) != tokenSats || transaction.outputs[1].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript){
                    console.log('Payment marked invalid: Condition Bad SLP')
                    valid = false
                    continue
                }

                //if(portion && (transaction.outputs[3].value != remainder * rate * 100 || transaction.outputs[3].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript)){
                if(portion && (transaction.outputs[3].value != Math.round(new BigNumber(remainder).times(rate).times(100))|| transaction.outputs[3].script.toRaw().toString('hex') != inputs[0].transaction.outputs[1].outputScript)){
                    console.log('Payment marked invalid: Lacking XEC change ')
                    valid = false
                    continue
                }

                if(!portion){
                    if(signals[s].swap.fee && (transaction.outputs[3].script.toRaw().toString('hex') != feeScript || transaction.outputs[3].value != parseInt((tokenAmount * rate * .01 * 100).toFixed(0)))){
                        console.log("Payment marked invalid: Condition Bad Fee")
                        console.log(transaction.outputs[3].value, parseInt((tokenAmount * rate * .01 * 100).toFixed(0)))
                        valid = false
                        continue
                    }
                }else{
                    if(signals[s].swap.fee && (transaction.outputs[4].script.toRaw().toString('hex') != feeScript || transaction.outputs[4].value != parseInt((tokenAmount * rate * .01 * 100).toFixed(0)))){
                        console.log("Payment marked invalid: Condition Bad Fee")
                        console.log(transaction.outputs[3].value, parseInt((tokenAmount * rate * .01 * 100).toFixed(0)))
                        valid = false
                        continue
                    }
                }
                
                console.log(transaction.hash())
                if(valid){
                    for(let i=0;i<2;i++){
                        let input = transaction.inputs[i]
                        let hash = input.prevout.hash
                        let index = input.prevout.index
                        let script
                        let keyring
                        let value
                        if(i==0){
                            script = inputs[0].transaction.outputs[1].outputScript
                            value = 546
    
                        }else{
                            script = inputs[1].transaction.outputs[inputs[1].prevout].outputScript
                            value = parseInt(inputs[1].transaction.outputs[signals[s].offeredUTXO.index].value)
                        }
                        for(let i=0;i<keyringArray.length;i++){
                            if(script.includes(keyringArray[i].hash)){
                                keyring = keyringArray[i]
                            }
                        }
                        let coin = new Coin({
                            hash: hash,
                            index: index,
                            script: Buffer.from(script, 'hex'),
                            value: value
                        })
                        //console.log(keyring)
                        //console.log(script)
                        transaction.scriptInput(i, coin, keyring)
                        transaction.signInput(i, coin, keyring)
                    }
                }
                remainder = remainder * (10**tokenRecord.decimals)
            }
            
            if(valid){
                console.log('VALID TX!!!')
                console.log(transaction)
                //console.log(transaction.toRaw().toString('hex'))
                console.log('hash', transaction.hash())
                //transaction.sign(keyringArray)
                let rawTx = Uint8Array.from(transaction.toRaw());
                try{
                    let txid = Buffer.from(transaction.hash().toString('hex'), 'hex').reverse().toString('hex')
                    await chronik.tx(txid)
                    console.log('swap already broadcasted somewhere else')
                    break
                }catch{}
                try{
    
                let resp = await chronik.broadcastTx(rawTx);
                console.log(resp)
                SignalStore.set(get(SignalStore).filter(s=>s.txid != signal.txid))
                
                let script = buildPayment(signal.txid)
                script = script.toRaw().toString('hex')
                let ws = get(websocket)
                await ws.waitForOpen()
                ws.unsubscribe('other', script)

                if(remainder){
                    if(!get(reloading)){
                        //if(get(isMobile)){
                       await reload()
                    }
                    
                    console.log('remainder', remainder)
                    remainder = remainder / (10** tokenRecord.decimals)

                    let peg
                    if(signal.swap.peg){
                        peg = signal.swap.peg
                    }
                    try{
                    if(remainder > signal.swap.minimum){
                        await createOffer(signal.swap.tokenId, remainder, signal.swap.rate, signal.swap.offer, signal.swap.minimum, peg)
                    }else{
                        await createOffer(signal.swap.tokenId, remainder, signal.swap.rate, signal.swap.offer, null, peg)
                    }}catch (error){
                        //alert('Failed to relist offer', error)
                    }

                    if(get(isMobile)){
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        reload()
                    }

                }

                break
                }catch{
                    console.log('couldnt broadcast')
                }
            }else{
                console.log('Found an exchange transaction but it was invalid')
            }
        }catch(e){
            console.log('error', e)
        }
        }
    }
}

export const cancelSignal = async (signal) => {
    //probably needs some work
    console.log('cancelling ', signal)
    console.log(get(reservedCoinsStore), get(reservedTokenCoinsStore))
    let keyringArray = get(keyringStore)
    let coins = get(coinStore)
    let reservedCoins = get(reservedCoinsStore)
    let signals = get(SignalStore)
    console.log('old signals', signals)
    let pointerTXID = signal.swap.pointer.txid

    console.log('signal txid', signal.txid, 'pointertxid', pointerTXID)
    let batonCoin
    for(let i=0; i<reservedCoins.length;i++){
        let coin = reservedCoins[i]
        if(coin.index == 1 && coin.hash.toString('hex') == Buffer.from(pointerTXID, 'hex').reverse().toString('hex')){
            batonCoin = coin
            if(signal.swap.offer != 'BUY'){
                break
            }
        }
        if(signal.swap.offer == 'BUY'){
            if(coin.index == signal.offeredUTXO.index && coin.hash.toString('hex') == signal.offeredUTXO.hash.toString('hex')){
                console.log('found offered XEC')
                coinStore.set([coin, ...coins])
            }
        }
    }
    if(signal.swap.offer == 'SELL'){
        let tokenId = signal.swap.tokenId
        let allTokenCoins = get(tokenCoinsStore)
        let tokenCoins
        if(allTokenCoins[tokenId]){
            tokenCoins = allTokenCoins[tokenId]
        }else{
            tokenCoins = []
        }
        let allReservedTokenCoins = get(reservedTokenCoinsStore)
        let reservedTokenCoins = allReservedTokenCoins[tokenId]
        if(!reservedTokenCoins){reservedTokenCoins=[]}
        for(let i=0;i<reservedTokenCoins.length;i++){
            if(reservedTokenCoins[i].hash.toString('hex') == signal.offeredUTXO.hash.toString('hex') && reservedTokenCoins[i].index == signal.offeredUTXO.index){
                console.log('found offered etoken')
                console.log(reservedTokenCoins[i])
                tokenCoins.push(reservedTokenCoins[i])
                break
            }
        }
        allTokenCoins[tokenId] = tokenCoins
        tokenCoinsStore.set(allTokenCoins)
    }
    if(!batonCoin){console.log(err)}

    let tx = new MTX()
    
    await tx.fund([
        ...[batonCoin],
        ...coins
        ], {
            inputs: [batonCoin].map(coin => Input.fromCoin(coin).prevout),
            changeAddress: keyringArray[10].getKeyAddress("string"),
            rate: 1000
    });
    tx.sign(keyringArray)
    let rawTx = Uint8Array.from(tx.toRaw());
    let resp = await chronik.broadcastTx(rawTx);
    console.log(resp)
    for(let i=0;i<signals.length;i++){
        if(signals[i].txid == signal.txid){
            //signals.splice(i,i+1)
            signals.splice(i,1)
            SignalStore.set(signals)
            console.log('new signals', get(SignalStore))
            break
        }
    }
} 

export const cancelPayment = async (payment) => {
    let keyringArray = get(keyringStore)
    let coins = get(coinStore)

    let tx = new MTX()

    if(payment.swap.offer == 'SELL'){
        let reservedCoins = get(reservedCoinsStore)
        console.log(reservedCoins)
        let coin = reservedCoins.filter(c=> c.index == payment.swap.inputs[2].index && c.hash.toString('hex') == Buffer.from(payment.swap.inputs[2].transaction.txid, 'hex').reverse().toString('hex'))[0]
        console.log('payment coin', coin)
        await tx.fund([
            ...[coin],
            ...coins
            ], {
                inputs: [coin].map(coin => Input.fromCoin(coin).prevout),
                changeAddress: keyringArray[10].getKeyAddress("string"),
                rate: 1000
        });

    }else{
        let tokenId = payment.swap.tokenId
        let allReservedTokenCoins = get(reservedTokenCoinsStore)
        let reservedTokenCoins = allReservedTokenCoins[tokenId]
        let coin = reservedTokenCoins.filter(c=> c.index == payment.swap.inputs[2].index && c.hash.toString('hex') == Buffer.from(payment.swap.inputs[2].transaction.txid, 'hex').reverse().toString('hex'))[0]
        console.log('payment token coin', coin)
        let tokenValue = coin.slp.value
        const sendOpReturn = buildSendOpReturn(
            tokenId,
            [tokenValue.toString()]
        );
        tx.addOutput(sendOpReturn, 0);
        tx.addOutput(keyringArray[10].getKeyAddress("string"), 546)
        await tx.fund([
            ...[coin],
            ...coins
            ], {
                inputs: [coin].map(coin => Input.fromCoin(coin).prevout),
                changeAddress: keyringArray[10].getKeyAddress("string"),
                rate: 1000
        });
    }
    tx.sign(keyringArray)
    let rawTx = Uint8Array.from(tx.toRaw())
    let resp = await chronik.broadcastTx(rawTx)
    console.log('payment cancel resp', resp)
    paymentStore.set(get(paymentStore).filter(p=> p.txid != payment.txid))
    let history = get(historyArray)
    for(let i=0;i<history.length;i++){
        if(history[i].txid == payment.txid){
            history[i].swap.status = 'Cancelled'
            break
        }
    }
    historyArray.set(history)
}

export const checkPegs = async (price) => {
    price = price * 100000000
    let keyringArray = get(keyringStore)
    let signals = get(SignalStore)
    //console.log(signals)
    let reservedCoins = get(reservedCoinsStore)
    let coins = get(coinStore)
    for(let i=0;i<signals.length;i++){
        try{
        let signal = signals[i]
        let transactions = []
        if(!signal.swap.peg){
            continue
        }
        if(Math.abs(1 - (signal.swap.peg / price)) < .02){
            console.log('found pegged trade but not enough price difference to trigger a relist')
            continue
        }
        console.log('large price gap found, relisting')
        //here offers will be deleted and remade at a new rate
        let batonCoin = coinFromChronikTX(signal.swap.pointer, 1)
        let pointerTX = new MTX()
        pointerTX.addOutput(buildPointerSignalOpReturn(signal.swap.tokenId, signal.swap.offer), 0)
        pointerTX.addOutput(keyringArray[12].getKeyAddress("string"), 546); //baton. For a SWAP to be valid, baton must be unspent, and pointer spent
        pointerTX.addOutput(keyringArray[12].getKeyAddress("string"), 546); //pointer
        await pointerTX.fund([
            ...[batonCoin],
            ...coins
            ], {
                inputs: [batonCoin].map(coin => Input.fromCoin(coin).prevout),
                changeAddress: keyringArray[10].getKeyAddress("string"),
                rate: 1000
        });
        pointerTX.sign(keyringArray)
        reservedCoins.push(coinFromTX(pointerTX, 1))
        let newPointerCoin = coinFromTX(pointerTX, 2)
        let count = countSpent(pointerTX, coins)
        coins = count[1]
        coins = [...coins, ...count[0].filter(c=> c.value !=546)]
        transactions.push(pointerTX)

        let oldRateSats = signal.swap.rate * 100
        let ratio = new BigNumber(signal.swap.peg).div(price)
        let newRateSats = Math.round(ratio.times(oldRateSats))
        let minimumSats
        if(signal.swap.minimum){
            minimumSats = Math.round(new BigNumber(signal.swap.minimum).times(newRateSats))
        }else{
            minimumSats = null
        }
        let offeredUTXO = signal.offeredUTXO
        if(signal.swap.offer == "BUY"){
            let tx = new MTX()
            console.log(offeredUTXO, Buffer.from(offeredUTXO.hash.toString('hex'), 'hex').reverse().toString('hex') ,reservedCoins)
            let oldCoin = reservedCoins.filter(c => c.hash.toString('hex') == offeredUTXO.hash.toString('hex') && c.index == offeredUTXO.index)[0]
            coins.push(oldCoin)
            //console.log(coins)
            let sats = Math.round(ratio.times(oldCoin.value))
            tx.addOutput(keyringArray[10].getKeyAddress("string"), sats)
            await tx.fund(coins, {
                rate:1000, 
                changeAddress: keyringArray[10].getKeyAddress("string")
            })
            tx.sign(keyringArray)
            offeredUTXO = coinFromTX(tx, 0)
            reservedCoins.push(offeredUTXO)
            let count = countSpent(tx, coins)
            coins = [...count[1], ...count[0].filter(c=>c.value!=sats)]
            transactions.push(tx)
        }
        let signalTX = new MTX()
        signalTX.addOutput(buildSignal(signal.swap.tokenId, signal.swap.offer, newRateSats, offeredUTXO, minimumSats, price), 0)
        await signalTX.fund([newPointerCoin, ...coins], {
            inputs: [newPointerCoin].map(coin => Input.fromCoin(coin).prevout),
            changeAddress: keyringArray[12].getKeyAddress("string"),
            rate: 1000 // sats/thousand bytes
        })
        signalTX.sign(keyringArray)
        count = countSpent(signalTX, coins)
        coins = count[1]
        transactions.push(signalTX)
        for(let a=0; a<transactions.length;a++){
            let tx = transactions[a]
            console.log(tx.toRaw().toString('hex'))
            let rawTx = Uint8Array.from(tx.toRaw())
            let resp = await chronik.broadcastTx(rawTx)
            console.log(resp)
        }
        SignalStore.set(get(SignalStore).filter(s=>s.txid !=signal.txid))
        let script = buildPayment(Buffer.from(signalTX.hash.toString('hex'),'hex').reverse().toString('hex'))
        script = script.toRaw().toString('hex')
        let ws = get(websocket)
        ws.subscribe('other', script)
        console.log('added new signal to websocket')
        script = buildPayment(signal.txid).toRaw().toString('hex')
        ws.unsubscribe('other', script)
        
        }catch(error){
            console.log(error)
            alert('Error remaking offer', error)
        }
    }
    reservedCoinsStore.set([...reservedCoins, ...get(reservedCoinsStore)])
}