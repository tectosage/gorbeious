import{keyringArray as keyringStore, coins as coinStore, tokenCoins as tokenCoinsStore, tokenRecords as tokenRecordsStore,
     reservedCoins as reservedCoinsStore, reservedTokenCoins as reservedTokenCoinsStore, signals as SignalStore,
      payments as paymentStore, historyArray, copied, promise, transactionPromise, reloading} from './stores.js'
import {buildPayment, getPayments, cancelSignal, getTransactionFromPayment} from './swap'
import {get} from 'svelte/store'
import { hd, KeyRing, Coin, MTX, Script, Input } from 'bcash'
import {encode, decode} from 'ecashaddrjs'
import { U64 } from 'n64'
import SLP from 'bcash/lib/script/slp'
//import {ChronikClient} from 'chronik-client'
import {BigNumber} from 'bignumber.js'
import { Buffer } from 'buffer'
import {assert} from 'assert'
import {Hash160} from 'bcrypto'
import { toCompact } from 'bcash/lib/protocol/consensus'
import { Output } from 'bcash/lib/primitives/index.js'
import TX from 'bcash/lib/primitives/tx.js'

globalThis.assert = assert


export const keyring = (mnemonic) => {
    var master = hd.fromMnemonic(mnemonic);
    var hdkey = master.derivePath("m/44'/145'/0'/0");
    //var hdkey = master.derivePath("m/44'/1899'/0'");

    var child  = hdkey.derive(0);
    var keyringArray = [];

    for(let i =0; i < 20; i++){
        const grandchild = child.derive(i);
        const keyring = KeyRing.fromPrivate(grandchild.privateKey);
        keyring.hash = Hash160.digest(keyring.publicKey).toString('hex');
        keyringArray.push(keyring);
    }

    return keyringArray
}

export const getUtxos = async (keyringArray) => {
    console.log('Getting UTXOs')
    let results = [];
    for(let i=0; i<keyringArray.length;i++){
        results[i] = chronik.script("p2pkh", keyringArray[i].getHash("hex")).utxos();
    }
    results = await Promise.all(results);
    let utxos = [];
    let slpCoins = [];
    for(let i=0; i<results.length; i++){ 
        if(results[i][0]){
            utxos.push(results[i][0]);
        }
    }
    return utxos;
}

export const makeTokenRecord = async (tokenId) => {
    let tokenInfo = await chronik.token(tokenId)
    let slpData = tokenInfo.slpTxData.genesisInfo
    
    let tokenRecord = SLP.TokenRecord({tokenId: tokenId, ticker: slpData.tokenTicker,
    name:slpData.tokenName, uri: slpData.tokenDocumentUrl, hash: slpData.tokenDocumentHash,
    decimals: slpData.decimals})

    tokenRecord.totalMinted = tokenInfo.tokenStats.totalMinted
    tokenRecord.totalBurned = tokenInfo.tokenStats.totalBurned


    return tokenRecord
}

export const generateCoins = async (utxos) => {
    utxos = await utxos
    let outputs = utxos;
    //let coins = {};
    //coins.xec = [];
    let coins = []
    let tokenCoins = {}
    let tokenRecords = get(tokenRecordsStore)
    let tokenFunds = {}
    for(let i=0; i<outputs.length;i++){
        let output = outputs[i];
        let utxos = output.utxos; 
        for(let a=0; a<utxos.length; a++){
            let utxo = utxos[a];
            let index = utxo.outpoint.outIdx
            let hash = Buffer.from(utxo.outpoint.txid, "hex").reverse()
            let options = {
                ...utxo, 
                version: 1, 
                value: parseInt(utxo.value), //parseInt(utxo.value), 
                height: utxo.blockHeight,
                coinbase: utxo.isCoinbase,
                script: Buffer.from(output.outputScript, "hex"),
                index: index,
                hash: hash,
            };
            let coin = new Coin(options);
            
            if(utxo.slpToken){ //instead of utxo.slpMeta
                let tokenId = Buffer.from(utxo.slpMeta.tokenId)
                let buffer = Buffer.allocUnsafe(4);
                buffer.writeUInt32BE(index, 0);  
                if(!tokenRecords[tokenId]){
                    tokenRecords[tokenId] = await makeTokenRecord(tokenId)
                }
                
                let record = SLP.SlpCoinRecord({hash: hash, vout: index,
                    tokenId: tokenId, tokenIndex: buffer, value: new BigNumber(utxo.slpToken.amount),//parseInt(utxo.slpToken.amount)
                    type: utxo.slpMeta.txType})

                coin.slp = record
               
                if(!tokenCoins[tokenId]){
                    tokenCoins[tokenId] = []
                }
                tokenCoins[tokenId].push(coin)

                let ticker = tokenRecords[tokenId].ticker;
                let value = new BigNumber(utxo.slpToken.amount).dividedBy(10 ** tokenRecords[tokenId].decimals)
                if(tokenFunds[tokenId]){
                    tokenFunds[tokenId].amount = value.plus(tokenFunds[tokenId].amount)
                }
                else{
                    tokenFunds[tokenId] = {}
                    tokenFunds[tokenId].amount = value
                }

            }
            else{
                coins.push(coin);
            }
        }
    }

    coinStore.set(coins)
    tokenCoinsStore.set(tokenCoins)
    tokenRecordsStore.set(tokenRecords)
}

export const sendXEC = async (address, amount, passedCoins) => {
    //amount is in XEC
    console.log('sending')
    let keyringArray = get(keyringStore)
    let coins
    if(!passedCoins){
        coins = get(coinStore)
    }else{
        coins = passedCoins
    }
    let decodedTokenRecieverAddress = decode(address)

    try{
    address = encode('ecash', 
    decodedTokenRecieverAddress.type, decodedTokenRecieverAddress.hash)
    
    let tx = new MTX()
    console.log('sendxec', Math.round(new BigNumber(amount).times(100)) )
    tx.addOutput({
        address: address,
        //value: amount*100
        //value : parseInt(new BigNumber(amount).times(100).toNumber())
        value: Math.round(new BigNumber(amount).times(100))
    });
    await tx.fund(coins,{
        changeAddress: keyringArray[10].getKeyAddress("string"),
    
        rate: 1000 // sats/thousand bytes
    });
    tx.sign(keyringArray);
    console.log(tx)
    //coinStore.set(validCoins)
    console.log(tx.toRaw().toString('hex'))
    let rawTx = Uint8Array.from(tx.toRaw());
    let resp = chronik.broadcastTx(rawTx);
    return [resp, tx]
    }catch (error){
        console.log('send xec error', error)
        return [error]
    }
}

export const count = async (transaction) => {
    let keyringArray = get(keyringStore)
    let slp = transaction.slpTxData ? true : false
    let count = 0
    //let slpCount = new BigNumber(0)
    let slpCount
    if(slp){slpCount = new BigNumber(0)}
    let reservedCoins = get(reservedCoinsStore)
    let coins = get(coinStore)
    let validCoins = []
    
    let reservedTokenCoins
    let allTokenCoins
    let tokenCoins
    let validTokenCoins
    let tokenId
    if(slp){
        tokenId = transaction.slpTxData.slpMeta.tokenId
        allTokenCoins = get(tokenCoinsStore)
        if(allTokenCoins[tokenId]){
            tokenCoins = allTokenCoins[tokenId]
            
        }
        else{
            tokenCoins = []
        }

        reservedTokenCoins = get(reservedTokenCoinsStore)
        if(reservedTokenCoins[tokenId]){
            reservedTokenCoins = reservedTokenCoins[tokenId]
        }else{
                reservedTokenCoins = []
            }
        validTokenCoins = []

    }

    for(let i=0;i<transaction.inputs.length;i++){
        let input = transaction.inputs[i]
        if(keyringArray.map(v=>v.hash).includes(input.outputScript.slice(6, -4))){
            if(input.slpToken){
                count = count - parseInt(input.value)
                slpCount = slpCount.minus(new BigNumber(input.slpToken.amount))
            }else{
                count = count - parseInt(input.value)
            }
        }
    }
    
    for(let i=0;i<coins.length;i++){
        let coin = coins[i]
        let valid = true
        for(let i=0;i<transaction.inputs.length;i++){
            let input = transaction.inputs[i]
            if(input.prevOut.outIdx == coin.index && Buffer.from(input.prevOut.txid, 'hex').reverse().toString('hex') == coin.hash.toString('hex')){
                valid = false
                //count = count - coin.value
            }
        }
        if(valid){
            validCoins.push(coin)
        }
    }

    if(slp){
        for(let i=0;i<tokenCoins.length;i++){
            let coin = tokenCoins[i]
        

            //console.log('coin', coin.index, coin.hash.toString('hex'))
            let valid = true
            for(let i=0;i<transaction.inputs.length;i++){
                let input = transaction.inputs[i]
                if(input.prevOut.outIdx == coin.index && Buffer.from(input.prevOut.txid, 'hex').reverse().toString('hex') == coin.hash.toString('hex')){
                    console.log('FOUND SLP INPUT')
                    valid = false
                    //slpCount = slpCount.minus(new BigNumber(input.slpToken.amount))
                }
            }
            if(valid){
                validTokenCoins.push(coin)
            }
        }
    }

    for(let i=0;i<transaction.outputs.length;i++){
        let output = transaction.outputs[i]
        if(keyringArray.map(v=>v.hash).includes(output.outputScript.slice(6, -4))){
            let hash = Buffer.from(transaction.txid, 'hex').reverse()
            let options = {
                hash: hash,
                index : i,
                script: Buffer.from(output.outputScript, 'hex'),
                value: parseInt(output.value),
                coinbase: transaction.isCoinbase
            }
            let coin = new Coin(options);
            
            if(output.slpToken){
                let valid = true
                if(reservedTokenCoins){
                    for(let i=0;i<reservedTokenCoins.length;i++){
                        let reservedCoin = reservedTokenCoins[i]
                        if(coin.index == reservedCoin.index && coin.hash.toString('hex') == reservedCoin.hash.toString('hex')){
                            valid = false
                            console.log('found token utxo but it is already reserved')
                            break
                        }
                    }
                }
                if(valid == true){
                    let tokenRecords = get(tokenRecordsStore)
                    if(!tokenRecords[tokenId]){
                        tokenRecords[tokenId] = await makeTokenRecord(tokenId)
                        tokenRecordsStore.set(tokenRecords)
                    }
                    let buffer = Buffer.allocUnsafe(4);
                    buffer.writeUInt32BE(i, 0);  
                    let record = SLP.SlpCoinRecord({hash: hash, vout: i,
                        tokenId: Buffer.from(transaction.slpTxData.slpMeta.tokenId),
                        tokenIndex: buffer,
                        value: new BigNumber(output.slpToken.amount),
                        type: transaction.slpTxData.slpMeta.txType})
                    coin.slp = record
                    //slpCount = slpCount.plus(new BigNumber(output.slpToken.amount))
                    validTokenCoins.push(coin)
                }
                slpCount = slpCount.plus(new BigNumber(output.slpToken.amount))

                count = count + parseInt(output.value)
                
            }else{
                let valid = true
                for(let i=0;i<reservedCoins.length;i++){
                    let reservedCoin = reservedCoins[i]
                    if(coin.index == reservedCoin.index && coin.hash.toString('hex') == reservedCoin.hash.toString('hex')){
                        valid = false
                        break
                    }
                }
                if(valid == true){
                    //count = count + parseInt(output.value)
                    validCoins.push(coin)
                }

                count = count + parseInt(output.value)
            }
        }
    }

    //tokenCoinsStore.set(tokenCoins)
    if(slp){
        allTokenCoins[tokenId] = validTokenCoins
        tokenCoinsStore.set(allTokenCoins)
    }
    coinStore.set(validCoins)
    transaction.value = count
    transaction.slpValue = slpCount

    return transaction
}

export const simpleCount = (keyringArray, transaction) => {
    let slp = transaction.slpTxData ? true : false
    let count = 0
    //let slpCount = new BigNumber(0)
    let slpCount
    if(slp){slpCount= new BigNumber(0)}

    for(let i=0;i<transaction.inputs.length;i++){
        let input = transaction.inputs[i]
        if(keyringArray.map(v=>v.hash).includes(input.outputScript.slice(6, -4))){
            if(input.slpToken){
                count = count - parseInt(input.value)
                slpCount = slpCount.minus(new BigNumber(input.slpToken.amount))
            }else{
                count = count - parseInt(input.value)
            }
        }
    }

    for(let i=0;i<transaction.outputs.length;i++){
        let output = transaction.outputs[i]
        if(keyringArray.map(v=>v.hash).includes(output.outputScript.slice(6, -4))){
            
            if(output.slpToken){
                count = count + parseInt(output.value)
                slpCount = slpCount.plus(new BigNumber(output.slpToken.amount))

            }else{
                count = count + parseInt(output.value)
            }
        }
    }

    transaction.value = count
    transaction.slpValue = slpCount

    return transaction
}

export const getHistory = async (keyringArray) => {
    console.log('getting history')
    let tokenRecords = get(tokenRecordsStore)
    let array = []
    for(let i =0; i<keyringArray.length; i++){
        array.push(chronik.script('p2pkh', keyringArray[i].hash).history(0,200))
        array.push(chronik.script('p2pkh', keyringArray[i].hash).history(1,200))
        array.push(chronik.script('p2pkh', keyringArray[i].hash).history(2,200))
        array.push(chronik.script('p2pkh', keyringArray[i].hash).history(3,200))
    }
    let results = await Promise.all(array)
    let transactions = []
    for(let i=0; i<results.length; i++){
        let set = results[i].txs
        for(let i=0; i<set.length; i++){
            let transaction = set[i]
            if(transaction.slpTxData){
                if(!tokenRecords[transaction.slpTxData.slpMeta.tokenId]){
                    tokenRecords[transaction.slpTxData.slpMeta.tokenId] = await makeTokenRecord(transaction.slpTxData.slpMeta.tokenId)
                }
            }
            //transaction = simpleCount(keyringArray, transaction)
            let push = true
            for(let i=0;i<transactions.length; i++){
                if(transactions[i].txid == transaction.txid){
                    push = false
                    break
                }
            }
            if(push){
                transaction = simpleCount(keyringArray, transaction)
                transactions.push(transaction)
            }
        }
    }
    tokenRecordsStore.set(tokenRecords)

    let reservedUTXO = []
    let signals = []
    let payments = []

    transactions = transactions.map(tx=> swap(tx, transactions))
    transactions = await Promise.all(transactions)

    
    for(let i=0;i<transactions.length;i++){
        let transaction = transactions[i]

        if(transaction.swap){
            if(transaction.swap.type == 'signal'){
                if(transaction.swap.status == 'Active' && transaction.swap.pointer && !transaction.swap.pointer.outputs[1].spentBy){
                    signals.push(transaction)
                    reservedUTXO.push(transaction.offeredUTXO)
                    reservedUTXO.push({index: 1, hash:Buffer.from(transaction.swap.pointer.txid, 'hex').reverse()})
                }else{
                    if(transaction.swap.status == 'Active'){
                        //console.log(transaction)
                    }
                }
            }else if(transaction.swap.status && transaction.swap.status == 'pending'){
                reservedUTXO = [...transaction.swap.inputs, ...reservedUTXO]
                console.log('payment', transaction)
                payments.push(transaction)
            }
        }
    }

    let coins = get(coinStore)
    let tokenCoins = get(tokenCoinsStore)
    let validCoins = []
    let validTokenCoins = {}
    let reservedCoins = []
    let reservedTokenCoins = {}

    for(let i=0;i<coins.length; i++){
        let valid = true
        for(let a=0;a<reservedUTXO.length;a++){
            if(coins[i].index == reservedUTXO[a].index && coins[i].hash.toString('hex') == reservedUTXO[a].hash.toString('hex')){
                valid = false
                break
            }
        }
        if(valid){
            validCoins.push(coins[i])
        }else{
            reservedCoins.push(coins[i])
        }
    }
    Object.keys(tokenCoins).forEach(function(tokenId, index){
        for(let i=0;i<tokenCoins[tokenId].length;i++){
            let valid = true
            for(let a=0;a<reservedUTXO.length;a++){
                if(tokenCoins[tokenId][i].index == reservedUTXO[a].index && tokenCoins[tokenId][i].hash.toString('hex') == reservedUTXO[a].hash.toString('hex')){
                    valid = false
                    break
                }
            }
            if(valid){
               if(validTokenCoins[tokenId]){
                validTokenCoins[tokenId].push(tokenCoins[tokenId][i])
               }else{
                validTokenCoins[tokenId] = [tokenCoins[tokenId][i]]
               } 
            }else{
                if(reservedTokenCoins[tokenId]){
                    reservedTokenCoins[tokenId].push(tokenCoins[tokenId][i])
                   }else{
                    reservedTokenCoins[tokenId] = [tokenCoins[tokenId][i]]
                   } 
            }
        }
    })

    coinStore.set(validCoins)
    tokenCoinsStore.set(validTokenCoins)
    reservedCoinsStore.set(reservedCoins)
    reservedTokenCoinsStore.set(reservedTokenCoins)
    signals.sort((a,b) => a.timeFirstSeen - b.timeFirstSeen)
    SignalStore.set(signals.reverse())
    payments.sort((a,b) => a.timeFirstSeen - b.timeFirstSeen)
    paymentStore.set(payments.reverse())
    getPayments(signals, transactions)
    //console.log(signals)
    transactions.sort((a,b) => a.timeFirstSeen - b.timeFirstSeen)
    return transactions.reverse()
}

export const buildSendOpReturn = (tokenId, sendQuantityArray) => {
    const sendOpReturn = new Script()
            .pushSym('return')
            .pushData(Buffer.concat([
                Buffer.from('SLP', 'ascii'),
                Buffer.alloc(1)
            ]))
            .pushPush(Buffer.alloc(1, 1))
            .pushData(Buffer.from('SEND', 'ascii'))
            .pushData(Buffer.from(tokenId, 'hex'))
            for (let i = 0; i < sendQuantityArray.length; i++) {
                const sendQuantity = sendQuantityArray[i]
                sendOpReturn.pushData(U64.fromString(sendQuantity).toBE(Buffer))
            }
    return sendOpReturn.compile();
}

export const sendToken = async (tokenId, amount, address, dust) => {
    let keyringArray = get(keyringStore)
    let coins = get(coinStore)
    let allTokenCoins = get(tokenCoinsStore)
    let tokenCoins = allTokenCoins[tokenId]
    let arr = []
    let validCoins = []
    let validTokenCoins = []
    let inputs = []
    
    try{
    const tx = new MTX();

    let finalTokenAmountSent = new BigNumber(0)
    let tokenAmountBeingSentToAddress = new BigNumber(amount).times(10 ** get(tokenRecordsStore)[tokenId].decimals)

    for(let i=0;i<tokenCoins.length;i++){
        if(finalTokenAmountSent.lt(tokenAmountBeingSentToAddress)){
            finalTokenAmountSent = finalTokenAmountSent.plus(new BigNumber(tokenCoins[i].slp.value))
            inputs.push(tokenCoins[i])
        }
    }

    let decodedTokenRecieverAddress = decode(address)

    let cleanTokenRecieverAddress = encode('ecash', 
    decodedTokenRecieverAddress.type, decodedTokenRecieverAddress.hash)

    const tokenAmountArray = [tokenAmountBeingSentToAddress.toString()]
    
    const tokenChangeAmount = finalTokenAmountSent.minus(tokenAmountBeingSentToAddress);
    if (tokenChangeAmount.gt(new BigNumber(0))){
        tokenAmountArray.push(tokenChangeAmount.toString());
    }
  
    
    const sendOpReturn = buildSendOpReturn(
        tokenId,
        tokenAmountArray
    );
    

    tx.addOutput(sendOpReturn, 0);
   
    if(!dust){
        tx.addOutput(cleanTokenRecieverAddress, 546) //currency.etokenSats
    }else{
        tx.addOutput(cleanTokenRecieverAddress, dust) //currency.etokenSats
    }
    
    if(tokenChangeAmount.gt(0)){
        tx.addOutput(keyringArray[10].getKeyAddress("string"), 546)
    }

    await tx.fund([
        ...inputs,
        ...coins
        ], {
            inputs: inputs.map(coin => Input.fromCoin(coin).prevout),
            changeAddress: keyringArray[10].getKeyAddress("string"),
            rate: 1000
    });
    tx.sign(keyringArray)

    let rawTx = Uint8Array.from(tx.toRaw());
    let resp = chronik.broadcastTx(rawTx);
    
    return [resp, tx]
    }catch (error){
        console.log(tx.toRaw().toString('hex'))
        return [error]
    }
}

export const coinFromTX = (tx, index, slp) => {
    let coin = new Coin({
        hash: tx.hash(),
        index : index,
        script: tx.outputs[index].script.raw,
        value: parseInt(tx.outputs[index].value)
    })

    if(slp){
        let buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32BE(slp.index, 0);  
        let record = SLP.SlpCoinRecord({hash: tx.hash(), vout: slp.index,
            tokenId: Buffer.from(slp.tokenId),
            tokenIndex: buffer,
            value: slp.value,
            type: slp.type})

        coin.slp = record
    }
    return coin
}

export const coinFromChronikTX = (tx, index, slp) => {
    let hash = Buffer.from(tx.txid, 'hex').reverse()
    let coin = new Coin({
        hash: hash,
        index: index,
        script: Buffer.from(tx.outputs[index].outputScript, 'hex'),
        value: parseInt(tx.outputs[index].value)
    })
    if(slp){
        let buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32BE(slp.index, 0);
        let record = SLP.SlpCoinRecord({
            hash: hash,
            vout: slp.index,
            tokenId: Buffer.from(slp.tokenId),
            tokenIndex: buffer,
            value: slp.value,
            type: slp.type
        })
        coin.slp = record
    }
    return coin
}

export const countSpent = (tx, passedCoins) => {
    let keyringArray = get(keyringStore)
    let arr = []
    let change = []
    let validCoins = []
    let coins = []
    if(!passedCoins){
        coins = get(coinStore)
    }else{
        coins = passedCoins
    }

    for(let i=0;i<tx.inputs.length;i++){
        let a = {index: tx.inputs[i].prevout.index, hash: tx.inputs[i].prevout.hash}
        arr.push(a)
    }
    for(let i=0;i<coins.length; i++){
        let valid = true
        for(let a=0;a<arr.length;a++){
            if(coins[i].index == arr[a].index && coins[i].hash.toString('hex') == arr[a].hash.toString('hex')){
                valid = false
            }
        }
        if(valid){
            validCoins.push(coins[i])
        }
    }
    for(let i=0;i<tx.outputs.length;i++){
        let output = tx.outputs[i]
        if(output.value){
            if(keyringArray.map(v=>v.hash).includes(output.script.toRaw().toString('hex').slice(6, -4))){
                change.push(coinFromTX(tx, i))
            }
        }
    }
    if(!passedCoins){
        coinStore.set(validCoins)
        return change
    }else{
        return([change, validCoins])
    }
}

export const swap = async (transaction, passedHistory) => {
    let keyringArray = get(keyringStore)
    let tokenRecords = get(tokenRecordsStore)
    let history
    if(!passedHistory){
        history = get(historyArray)
    }else{
        history = passedHistory
    }

    //potential to be swap offer or payment
    let script = new Script(Buffer.from(transaction.outputs[0].outputScript, 'hex'))
    if(transaction.outputs[0].value == 0 && script.code[1] && script.code[1].data.toString('ascii') == "SWP\x00"){
        //signal1/2
        if(script.code[2].data && script.code[3].data && keyringArray.map(v=>v.hash).includes(transaction.inputs[0].outputScript.slice(6, -4))){
            if(script.code[2].data[0] == 1 && script.code[3].data[0] == 1){
                if(script.code.length == 6 && transaction.outputs.length > 2 && transaction.outputs[1].value == '546' && transaction.outputs[2].value == '546'){
                    transaction.swap = {description: 'Swap Signal 1/2', type: 'pointer'}
                    if(transaction.outputs[1].spentBy){
                        let spentBy = history.filter(h=>h.txid == transaction.outputs[1].spentBy.txid)[0]
                        if(spentBy && spentBy.value < 0 && !spentBy.slpValue){
                            transaction.swap.status = 'Cancelled'
                        }else{
                            transaction.swap.status = 'Completed'
                        }
                    }else{
                        transaction.swap.status = 'Active'
                    }
    
                }
                if((script.code.length == 11 || script.code.length == 12) && transaction.inputs[0].value == '546'){
                    let tokenId = script.code[4].data.toString('hex')
                    transaction.swap = {description: 'Swap Signal 2/2', type: 'signal',
                        tokenId: tokenId, offer: script.code[5].data.toString('ascii'),
                        rate: script.code[6].data.toString()/100}
                    if(!tokenRecords[tokenId]){
                        tokenRecords[tokenId] = await makeTokenRecord(tokenId)
                        tokenRecordsStore.set(tokenRecords)
                    }
                    let decimals = tokenRecords[tokenId].decimals
                    
                    let min = script.code[10].data
                    if(min[0] != 0){
                        if(min.toString() != '0'){
                            //transaction.swap.minimum = min.toString() / 100 / transaction.swap.rate
                            transaction.swap.minimum = Math.round(new BigNumber(min.toString()).div(100).div(transaction.swap.rate).times(10**decimals)) / (10 ** decimals)
                            //transaction.swap.minimum = Number(new BigNumber(min.toString()).div(100).div(transaction.swap.rate))
                        }else{
                            transaction.swap.minimum = '0'
                        }
                    }
                    
                    if(script.code.length == 12){
                        let peg = script.code[11].data
                        if(peg[0] != 0){
                            transaction.swap.peg = peg.toString()
                        }
                    }

                    transaction.offeredUTXO = {index: script.code[9].data[0], hash: script.code[8].data}
                    if(!passedHistory){
                        await new Promise(resolve => setTimeout(resolve, 500));
                        history = get(historyArray)
                    }
                    transaction.swap.pointer = history.filter(h=>h.txid == transaction.inputs[0].prevOut.txid)[0]
                    if(transaction.swap.pointer&& transaction.swap.pointer.outputs[1].spentBy){
                        let spentBy = history.filter(h=>h.txid == transaction.swap.pointer.outputs[1].spentBy.txid)[0]
                        if(spentBy && spentBy.value < 0 && !spentBy.slpValue){
                            transaction.swap.status = 'Cancelled'
                        }else{
                            transaction.swap.status = 'Completed!'
                        }
                    }else{
                        let index = script.code[9].data[0]
                        let txid = Buffer.from(script.code[8].data.toString('hex'), 'hex').reverse().toString('hex')
                        let tx = await chronik.tx(txid)
                        if(tx.outputs[index].spentBy){
                            transaction.swap.status = 'Cancelled'
                        }else{
                            transaction.swap.status = 'Active'
                        }
                    }
                }
            
            }

        }
        if(script.code[2].data[0] == 2 && script.code[3].data[0] == 1){
            transaction.swap = {description: 'Payment TX', type: 'pointer payment'}
            transaction.swap.inputs = []
            let exchangeTX
            if(passedHistory){
                exchangeTX = await getTransactionFromPayment(transaction, history)
            }else{
                await new Promise(resolve => setTimeout(resolve, 500));
                history = get(historyArray)
                exchangeTX = await getTransactionFromPayment(transaction)
            }
            //if(exchangeTX && history.map(x=>x.txid).includes(exchangeTX.hash().reverse().toString('hex'))){
            if(exchangeTX && history.map(x=> x.inputs[0].prevOut.txid).includes(Buffer.from(exchangeTX.inputs[0].prevout.hash.toString('hex'), 'hex').reverse().toString('hex'))){
                transaction.swap.status = 'Completed!'
                //console.log('Found completed swap')
            }else if(exchangeTX){
                transaction.swap.baton = Buffer.from(exchangeTX.inputs[0].prevout.hash.toString('hex'), 'hex').reverse().toString('hex')
                transaction.swap.status = 'pending'
                transaction.swap.signalTXID = script.code[4].data.toString('hex')
                for(let i=0; i<exchangeTX.inputs.length; i++){
                    let input = exchangeTX.inputs[i]
                    let txid = Buffer.from(input.prevout.hash.toString('hex'), 'hex').reverse().toString('hex')
                   let tx = await chronik.tx(txid)
                    transaction.swap.inputs.push({hash:input.prevout.hash, index: input.prevout.index, transaction: tx})

                    if(tx.outputs[input.prevout.index].spentBy){
                        //transaction.swap.status = 'Cancelled/Completed'
                        transaction.swap.status = 'Cancelled'
                        break
                    }
                }
                if(transaction.swap.status == 'pending'){
                    if(transaction.swap.inputs[1].transaction.outputs[transaction.swap.inputs[1].index].slpToken){
                        transaction.swap.tokenId = transaction.swap.inputs[1].transaction.slpTxData.slpMeta.tokenId
                        transaction.swap.offer = 'SELL'
                    }else{
                        transaction.swap.tokenId = transaction.swap.inputs[2].transaction.slpTxData.slpMeta.tokenId
                        transaction.swap.offer ='BUY'
                    }
                    if(!tokenRecords[transaction.swap.tokenId]){
                        tokenRecords[transaction.swap.tokenId] = await makeTokenRecord(transaction.swap.tokenId)
                        tokenRecordsStore.set(tokenRecords)
                    }

                    if(transaction.swap.offer == 'SELL'){
                        transaction.swap.amount = parseInt(exchangeTX.outputs[0].script.code[5].data.toString('hex'), 16) / (10 ** tokenRecords[transaction.swap.tokenId].decimals)
                        transaction.swap.rate = Math.round(new BigNumber(transaction.swap.inputs[2].transaction.outputs[transaction.swap.inputs[2].index].value).minus(670).div(transaction.swap.amount)) /100    
                    }else{
                        transaction.swap.amount = transaction.swap.inputs[2].transaction.outputs[transaction.swap.inputs[2].index].slpToken.amount / (10 ** tokenRecords[transaction.swap.tokenId].decimals)
                        transaction.swap.rate = Math.round(new BigNumber(transaction.swap.inputs[1].transaction.outputs[transaction.swap.inputs[1].index].value).div(transaction.swap.amount)) /(100)
                    }
                }
            }
        }
    }else if (transaction.outputs[0].value == 0 && script.code.length < 4 && keyringArray.map(v=>v.hash).includes(transaction.inputs[0].outputScript.slice(6, -4))){
        if(script.length == 3){
            transaction.swap = {description: 'payment data', type: 'payment'}
        }else{
            transaction.swap = {description: 'payment payload', type: 'payload'}
        }
    }else if((transaction.value > 0 && transaction.slpValue < 0) || (transaction.value < 0 && transaction.slpValue > 0)){
        await new Promise(resolve => setTimeout(resolve, 500));
        transaction.isSwap = true
    }



    return transaction
}

export const getTransaction = async (txid, passedHistory) => {
    let history
    if(passedHistory){
        history = passedHistory
    }else{
        history = get(historyArray)
    }
    for(let i=0; i<history.length; i++){
        if(history[i].txid == txid){
            return(history[i])
        }
    }
    let tx = await chronik.tx(txid)
    return tx
}

export const getMax = async () =>{
    //returns max funds that can be sent, in XEC
    let coins = get(coinStore)
    let keyringArray = get(keyringStore)
    let tx = new MTX()
    tx.addOutput(keyringArray[10].getKeyAddress("string"), 0)
    await tx.fund([
        ...coins
        ], {
            inputs: coins.map(coin => Input.fromCoin(coin).prevout),
            changeAddress: keyringArray[10].getKeyAddress("string"),
            rate: 1000
    });

    return tx.outputs[1].value / 100

}

export const copyContent = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      copied.set(text)
      console.log('Content copied to clipboard');
      await new Promise(resolve => setTimeout(resolve, 2000));
      copied.set('')
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
}

export const reload = async () =>{
    console.log('reloading')
    reloading.set(true)
    promise.set(generateCoins(getUtxos(get(keyringStore))))
    await get(promise)
    transactionPromise.set(getHistory(get(keyringStore)))
    historyArray.set(await get(transactionPromise))
    reloading.set(false)
}