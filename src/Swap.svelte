<script>
    import {view, tokenRecords, tokenFunds, signals, payments, transactionPromise, reservedTokenCoins, reservedCoins, price, reloading, historyArray, loaded} from './lib/stores'
    import {cancelSignal, cancelPayment, createOffer, findSignals, payment } from './lib/swap'
    import {fly} from 'svelte/transition'
    import {makeTokenRecord} from './lib/functions'
    import BigNumber from 'bignumber.js'

    let learn
    let transitionStatus

    let type
    let selectedToken
    let tokenIdInput
    let actualToken
    let amount
    let rate 
    let fiatRate 
    let partial
    let minimum
    let peg

    let offerType
    let offerToken
    let offerTokenIdInput
    let actualOfferTokenId

    let response

    let offers
    let offerId
    let portion

    let recommend
    let recommendedTokens = [
        'fb4233e8a568993976ed38a81c2671587c5ad09552dedefa78760deed6ff87aa',
     '7e7dacd72dcdb14e00a03dd3aff47f019ed51a6f1f4e4f532ae50692f62bc4e5',
      'b46c6e0a485f0fade147696e54d3b523071860fd745fbfa97a515846bd3019a6',
      '54dc2ecd5251f8dfda4c4f15ce05272116b01326076240e2b9cc0104d33b1484',
      'f36e1b3d9a2aaf74f132fef3834e9743b945a667a4204e761b85f2e7b65fd41a',
      '6d4e8cb81f7415c25ae2a425e9c6e2fd2648755fe9169ca208c1e349eadd9db5'
    ] 
    let done = false


    $: if(selectedToken == 'other'){
        actualToken = tokenIdInput
    }else{
        actualToken = selectedToken
    }


    $: if(offerToken == 'other'){
        actualOfferTokenId = offerTokenIdInput
    }else{
        actualOfferTokenId = offerToken
    }

    $: if(type == 'SELL'){
       selectedToken=''
    }


    $:{
        if($view == 'swap'){
            offers = null
            offerId = null
            response = null
        }else if($view == 'offers' & !offerId){
            response = null
        }
    }

    $: {
        if(offerId){portionSet(offerId)}
    }

    $: if(offerType == 'BUY'){
       offerToken = ''
    }

    $: if(!partial){
        minimum = null
    }

    $: {
        let signalsCopy = $signals
        for(let i=0; i<$signals.length;i++){
            let signal = $signals[i]
            let index = signal.offeredUTXO.index
            let hash = signal.offeredUTXO.hash


            if(signal.swap.offer == 'BUY'){
                for(let a=0; a<$reservedCoins.length;a++){
                    let coin = $reservedCoins[a]
                    if(coin.index == index && coin.hash.toString('hex') == hash.toString('hex')){
                        signalsCopy[i].amount = coin.value / signal.swap.rate / 100
                    }
                }
            }else{
                if(!$reservedTokenCoins[signal.swap.tokenId]){continue}
                for(let a=0; a<$reservedTokenCoins[signal.swap.tokenId].length; a++){
                    let coin = $reservedTokenCoins[signal.swap.tokenId][a]
                    if(coin.index == index && coin.hash.toString('hex') == hash.toString('hex')){
                        signalsCopy[i].amount = new BigNumber(coin.slp.value).div(10 ** $tokenRecords[signal.swap.tokenId].decimals)
                    }
                }
            }
        }
        signals.set(signalsCopy)
        
    }

    $: {
        if(offers && offers.length && !offerId){
            let offersCopy = []
            for(let i=0;i<offers.length;i++){
                if($payments.map(p=> p.swap.signalTXID).includes(offers[i].txid)){

                    continue
                    //break
                }
                if($historyArray.filter(h=>h.swap).filter(h=>h.swap.status).filter(h=>h.swap.status == 'pending').filter(h=>h.swap.signalTXID).map(h=>h.swap.signalTXID).includes(offers[i].txid)){
                    continue
                    //break
                }
                offersCopy.push(offers[i])
            }
            offers = offersCopy
        }
    }

    function setRate(given){
        rate = given 
        if(typeof $price == 'number' && given){
            fiatRate = Math.round(given * $price * 100) /100
        }else{
            fiatRate = null
        }
    }

    function setFiat(given){
        fiatRate = given
        if(typeof $price == 'number' && given){
            rate = Math.round(given / $price * 100)/100
        }else{
            rate = null
        }
    }

    async function newOffer(){
        if(minimum == amount){
            minimum = null
        }
        let resp = await createOffer(actualToken, amount, rate, type, minimum, peg)
        if(resp.txid){
            //response = 'Success! txid: ' + resp.txid
            response = 'Success!'
            amount = null
            rate = null
            fiatRate = null
            type = null
            selectedToken = null
            partial = null
            peg = null
        }else{
            response = 'Error'
        }
    }

    async function findOffers(){
        var start = new Date().getTime();
        offers = findSignals(actualOfferTokenId, offerType)
        offers = await offers
        offers = offers.sort((a,b) => a.swap.realRate - b.swap.realRate)
        if(offerType == 'BUY'){
            offers = offers.reverse()
        }
        console.log('offers->', offers)
        var end = new Date().getTime();
        var time = end - start;
        console.log('Execution time ', time, ' for this many signals: ', offers.length)
    }

    async function takeOffer(offer){
        response = null
        let resp = await payment(offer, portion)
        if(resp.txid){
            //response = 'Success! txid: ' + resp.txid
            response = 'Success!'
        }else{
            response = "Error"
        }
    }

    async function tokenRecord(){
        done = false
        for(let i=0;i<recommendedTokens.length;i++){
            if(!$tokenRecords[recommendedTokens[i]]){
                let tokenRecordz = $tokenRecords
                tokenRecordz[recommendedTokens[i]] = await makeTokenRecord(recommendedTokens[i])
                tokenRecords.set(tokenRecordz)
            }
        }
        done = true
    }
    tokenRecord()

    function clearOffers(){
        offers = null
        offerId = null
    }
    
    function portionSet(offerId){
        console.log('setting portion')
        let offer = offers.filter(o=>o.txid == offerId)[0]
        if(offer.swap.minimum){
            portion = offer.swap.normalAmount
        }else{
            portion = null
        }
    }

</script>
{#if $loaded}
<div id='main'>

{#if learn}
    <div transition:fly="{{ y: 300, duration: 1000 }}" on:outrostart="{() => transitionStatus = true}" on:outroend="{() => transitionStatus = false}">
        <h3>What is Swap?</h3>
        <div id="info">
            Swap is a protocol for trustless, on-chain exchanges.<br><br>
            Gorbeious uses Swap to allow indiviudals to exchange between eCash and eTokens.<br><br>
            It does so without the need for you to entrust anyone with your funds.<br><br>
            There are two sides to an exchange, a Maker, and a Taker.<br><br>
            To Swap you can either create a new offer, or search for existing offers.<br><br>
            When you create a new offer there is a 1% trade fee added onto your price.<br><br>
            When you take an existing Offer the fee is included in the price you see.<br><br>
            After an Offer is taken, it finalizes when the Offering party comes online.<br><br>
        </div>
    <button class="default" id="back" on:click={()=> learn = false}>back</button>
    </div>
{:else if !transitionStatus}
    {#if $view == 'swap'}
    <div id="buttons"><button on:click={()=> view.set('swapping')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_32_1678)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.81413 4C8.81413 3.44772 9.26185 3 9.81413 3C10.2497 3 10.9667 3.10961 11.5194 3.5894C11.819 3.84949 12.0595 4.21244 12.152 4.67677C12.2419 5.12804 12.177 5.59792 12.0072 6.06458C11.786 6.67262 11.2468 7.40593 10.7149 8.0761C10.337 8.55228 9.89814 9.07357 9.46491 9.58821C9.25956 9.83214 9.05548 10.0746 8.85974 10.31C8.4783 10.7687 8.12618 11.2036 7.82942 11.5992C8.70159 11.1092 9.75712 10.4448 10.8477 9.75771L10.8743 9.74094C12.1077 8.9639 13.3854 8.15895 14.3972 7.62119C14.8984 7.35484 15.3951 7.12061 15.8177 6.99846C16.0218 6.93947 16.2926 6.88087 16.5751 6.90461C16.8815 6.93037 17.3306 7.07421 17.5852 7.54072C17.7754 7.88936 17.7603 8.24154 17.7163 8.4769C17.6716 8.71615 17.5787 8.93836 17.4842 9.12465C17.2945 9.49885 17.0058 9.90601 16.6904 10.3069C16.0588 11.1097 15.1758 12.0659 14.3301 12.9818L14.3087 13.0049C13.7153 13.6475 13.1407 14.2703 12.6522 14.834C13.3251 14.4434 14.0776 13.9738 14.8415 13.491C15.0068 13.3866 15.1728 13.2814 15.3384 13.1764C16.2935 12.5712 17.2363 11.9738 17.9711 11.5619C18.3891 11.3276 18.8127 11.1109 19.1609 11.0007C19.3038 10.9555 19.6082 10.8677 19.9384 10.9338C20.1345 10.9731 20.3943 11.0786 20.595 11.3284C20.7934 11.5753 20.8407 11.8471 20.8407 12.0394C20.8407 12.3578 20.7198 12.621 20.6356 12.7765C20.5411 12.9509 20.4204 13.1182 20.2986 13.27C20.0541 13.5744 19.7267 13.912 19.371 14.2563C18.9011 14.7112 18.3221 15.234 17.7298 15.7689C17.4307 16.0389 17.1282 16.312 16.8346 16.581C15.9336 17.4067 15.0986 18.2091 14.5302 18.8953C14.4872 18.9472 14.4465 18.9975 14.4081 19.0462C14.9518 18.7743 15.6088 18.3818 16.3427 17.9334C16.4365 17.8761 16.5313 17.818 16.627 17.7594C17.4711 17.2426 18.3808 16.6855 19.1978 16.2772C19.6541 16.0492 20.1199 15.8475 20.56 15.7242C20.9763 15.6077 21.5041 15.5216 22.0128 15.677C22.2753 15.7572 22.6035 15.9272 22.8157 16.2794C23.0307 16.6362 23.0223 17.0063 22.9655 17.2688C22.8658 17.7301 22.5553 18.1548 22.3006 18.4639C21.7442 19.1392 20.8474 19.9571 19.9883 20.7271C19.8647 20.8379 19.7415 20.948 19.6191 21.0573C19.2074 21.4253 18.8065 21.7837 18.44 22.123C18.929 21.8873 19.4754 21.644 19.9938 21.5044C20.5914 21.3436 21.5253 21.219 22.2427 21.8764C22.6499 22.2495 22.6775 22.8821 22.3043 23.2893C21.9407 23.6861 21.3305 23.7224 20.9228 23.3784C20.8839 23.3725 20.7675 23.3674 20.5135 23.4357C20.0906 23.5496 19.577 23.7903 18.9823 24.0843C18.9258 24.1122 18.8681 24.1409 18.8095 24.1701C18.307 24.4197 17.734 24.7045 17.2429 24.8594C16.97 24.9454 16.6109 25.03 16.2407 24.9895C15.8106 24.9423 15.3646 24.72 15.1033 24.2411C14.9041 23.876 14.9303 23.5085 14.9924 23.2583C15.0534 23.0123 15.1681 22.7937 15.277 22.6195C15.4961 22.269 15.8191 21.9006 16.1594 21.549C16.7518 20.9369 17.54 20.2328 18.2943 19.5589C18.4152 19.4509 18.5353 19.3437 18.6535 19.2377C19.0394 18.8918 19.4035 18.5617 19.7281 18.255C19.0873 18.5986 18.3857 19.028 17.6643 19.4695C17.5716 19.5262 17.4786 19.5832 17.3853 19.6401C16.4644 20.2028 15.4904 20.7889 14.6954 21.1126C14.3117 21.2689 13.8447 21.4185 13.389 21.4011C13.1447 21.3918 12.8542 21.3328 12.582 21.1552C12.2986 20.9702 12.1116 20.7064 12.0076 20.4207C11.7917 19.827 11.9751 19.2492 12.1594 18.8589C12.3569 18.4407 12.6593 18.0187 12.99 17.6195C13.3892 17.1375 13.8828 16.6263 14.4083 16.1162C13.7767 16.4998 13.1663 16.8537 12.6299 17.1285C12.1603 17.3691 11.6842 17.5827 11.2711 17.6877C11.0702 17.7388 10.8014 17.7868 10.52 17.75C10.2097 17.7094 9.79987 17.5466 9.56292 17.1124C9.37267 16.7638 9.38772 16.4116 9.43173 16.1762C9.47646 15.9369 9.56938 15.7147 9.66382 15.5284C9.85353 15.1542 10.1423 14.7471 10.4577 14.3461C11.0893 13.5433 11.9723 12.5871 12.818 11.6712L12.8393 11.6481C13.4044 11.0361 13.9526 10.4421 14.4255 9.89999C13.6647 10.3472 12.8008 10.8911 11.9138 11.4499L11.8872 11.4667C10.6538 12.2437 9.37608 13.0486 8.36428 13.5864C7.86314 13.8528 7.36645 14.087 6.94376 14.2091C6.73967 14.2681 6.4689 14.3267 6.18643 14.303C5.87996 14.2772 5.43087 14.1334 5.17632 13.6669C4.89583 13.1528 5.00912 12.6155 5.11372 12.2965C5.22966 11.9429 5.42655 11.5818 5.63989 11.2446C6.07035 10.5642 6.69672 9.78321 7.32188 9.03132C7.53619 8.77356 7.75025 8.51933 7.96035 8.26979C8.3822 7.76875 8.78814 7.28662 9.14835 6.83277C9.71313 6.12116 10.0356 5.63421 10.1277 5.38088C10.187 5.21802 10.1932 5.12615 10.1923 5.08825C10.1713 5.07506 10.1316 5.05468 10.0669 5.03596C9.97978 5.01076 9.88615 5 9.81413 5C9.26185 5 8.81413 4.55228 8.81413 4Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81413 2C6.81413 1.44772 7.26185 1 7.81413 1C8.24965 1 8.96668 1.10961 9.51935 1.5894C9.81895 1.84949 10.0595 2.21244 10.152 2.67677C10.2419 3.12804 10.177 3.59792 10.0072 4.06458C9.78603 4.67262 9.2468 5.40593 8.71492 6.0761C8.33699 6.55228 7.89814 7.07357 7.46491 7.58821C7.25956 7.83214 7.05548 8.07457 6.85974 8.30999C6.4783 8.76875 6.12618 9.20356 5.82942 9.59924C6.70159 9.10922 7.75712 8.44478 8.84772 7.75771L8.87433 7.74094C10.1077 6.9639 11.3854 6.15895 12.3972 5.62119C12.8984 5.35484 13.3951 5.12061 13.8177 4.99846C14.0218 4.93947 14.2926 4.88087 14.5751 4.90461C14.8815 4.93037 15.3306 5.07421 15.5852 5.54072C15.7754 5.88936 15.7603 6.24154 15.7163 6.4769C15.6716 6.71615 15.5787 6.93836 15.4842 7.12465C15.2945 7.49885 15.0058 7.90601 14.6904 8.30692C14.0588 9.10972 13.1758 10.0659 12.3301 10.9818L12.3087 11.0049C11.7153 11.6475 11.1407 12.2703 10.6522 12.834C11.3251 12.4434 12.0776 11.9738 12.8415 11.491C13.0068 11.3866 13.1728 11.2814 13.3384 11.1764C14.2935 10.5712 15.2363 9.9738 15.9711 9.56192C16.3891 9.32757 16.8127 9.11086 17.1609 9.00073C17.3038 8.95554 17.6082 8.8677 17.9384 8.93382C18.1345 8.97311 18.3943 9.07864 18.595 9.32837C18.7934 9.57529 18.8407 9.8471 18.8407 10.0394C18.8407 10.3578 18.7198 10.621 18.6356 10.7765C18.5411 10.9509 18.4204 11.1182 18.2986 11.27C18.0541 11.5744 17.7267 11.912 17.371 12.2563C16.9011 12.7112 16.3221 13.234 15.7298 13.7689C15.4307 14.0389 15.1282 14.312 14.8346 14.581C13.9336 15.4067 13.0986 16.2091 12.5302 16.8953C12.4872 16.9472 12.4465 16.9975 12.4081 17.0462C12.9518 16.7743 13.6088 16.3818 14.3427 15.9334C14.4365 15.8761 14.5313 15.818 14.627 15.7594C15.4711 15.2426 16.3808 14.6855 17.1978 14.2772C17.6541 14.0492 18.1199 13.8475 18.56 13.7242C18.9763 13.6077 19.5041 13.5216 20.0128 13.677C20.2753 13.7572 20.6035 13.9272 20.8157 14.2794C21.0307 14.6362 21.0223 15.0063 20.9655 15.2688C20.8658 15.7301 20.5553 16.1548 20.3006 16.4639C19.7442 17.1392 18.8474 17.9571 17.9883 18.7271C17.8647 18.8379 17.7415 18.948 17.6191 19.0573C17.2074 19.4253 16.8065 19.7837 16.44 20.123C16.929 19.8873 17.4754 19.644 17.9938 19.5044C18.5914 19.3436 19.5253 19.219 20.2427 19.8764C20.6499 20.2495 20.6775 20.8821 20.3043 21.2893C19.9407 21.6861 19.3305 21.7224 18.9228 21.3784C18.8839 21.3725 18.7675 21.3674 18.5135 21.4357C18.0906 21.5496 17.577 21.7903 16.9823 22.0843C16.9258 22.1122 16.8681 22.1409 16.8095 22.1701C16.307 22.4197 15.734 22.7045 15.2429 22.8594C14.97 22.9454 14.6109 23.03 14.2407 22.9895C13.8106 22.9423 13.3646 22.72 13.1033 22.2411C12.9041 21.876 12.9303 21.5085 12.9924 21.2583C13.0534 21.0123 13.1681 20.7937 13.277 20.6195C13.4961 20.269 13.8191 19.9006 14.1594 19.549C14.7518 18.9369 15.54 18.2328 16.2943 17.5589C16.4152 17.4509 16.5353 17.3437 16.6535 17.2377C17.0394 16.8918 17.4035 16.5617 17.7281 16.255C17.0873 16.5986 16.3857 17.028 15.6643 17.4695C15.5716 17.5262 15.4786 17.5832 15.3853 17.6401C14.4644 18.2028 13.4904 18.7889 12.6954 19.1126C12.3117 19.2689 11.8447 19.4185 11.389 19.4011C11.1447 19.3918 10.8542 19.3328 10.582 19.1552C10.2986 18.9702 10.1116 18.7064 10.0076 18.4207C9.79168 17.827 9.97506 17.2492 10.1594 16.8589C10.3569 16.4407 10.6593 16.0187 10.99 15.6195C11.3892 15.1375 11.8828 14.6263 12.4083 14.1162C11.7767 14.4998 11.1663 14.8537 10.6299 15.1285C10.1603 15.3691 9.68424 15.5827 9.27105 15.6877C9.07021 15.7388 8.80135 15.7868 8.51997 15.75C8.20967 15.7094 7.79987 15.5466 7.56292 15.1124C7.37267 14.7638 7.38772 14.4116 7.43173 14.1762C7.47646 13.9369 7.56938 13.7147 7.66382 13.5284C7.85353 13.1542 8.14226 12.7471 8.45767 12.3461C9.08929 11.5433 9.97228 10.5871 10.818 9.67118L10.8393 9.64812C11.4044 9.03614 11.9526 8.44211 12.4255 7.89999C11.6647 8.34721 10.8008 8.89106 9.91379 9.44989L9.88717 9.46667C8.65377 10.2437 7.37608 11.0486 6.36428 11.5864C5.86314 11.8528 5.36645 12.087 4.94376 12.2091C4.73967 12.2681 4.4689 12.3267 4.18643 12.303C3.87996 12.2772 3.43087 12.1334 3.17632 11.6669C2.89583 11.1528 3.00912 10.6155 3.11372 10.2965C3.22966 9.94289 3.42655 9.5818 3.63989 9.24458C4.07035 8.56415 4.69672 7.78321 5.32188 7.03132C5.53619 6.77356 5.75025 6.51933 5.96035 6.26979C6.3822 5.76875 6.78814 5.28662 7.14835 4.83277C7.71313 4.12116 8.03555 3.63421 8.1277 3.38088C8.18695 3.21802 8.19321 3.12615 8.19225 3.08825C8.17134 3.07506 8.13156 3.05468 8.06687 3.03596C7.97978 3.01076 7.88615 3 7.81413 3C7.26185 3 6.81413 2.55228 6.81413 2Z" fill="#F0C8FA"/>
            </g>
            <defs>
            <clipPath id="clip0_32_1678">
            <rect width="24" height="24" fill="white"/>
            </clipPath>
            </defs>
        </svg>
        Create Offer</button>
        <button on:click={()=> view.set('offers')}><svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_32_1666)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.6479 17.7018C15.2574 17.3113 15.2574 16.6781 15.6479 16.2876L16.355 15.5805C16.7456 15.19 17.3787 15.19 17.7692 15.5805L23.7725 21.5838C24.163 21.9743 24.163 22.6075 23.7725 22.998L23.0654 23.7051C22.6749 24.0956 22.0417 24.0956 21.6512 23.7051L15.6479 17.7018Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6479 15.7018C13.2574 15.3113 13.2574 14.6781 13.6479 14.2876L14.355 13.5805C14.7456 13.19 15.3787 13.19 15.7692 13.5805L21.7725 19.5838C22.163 19.9743 22.163 20.6075 21.7725 20.998L21.0654 21.7051C20.6749 22.0956 20.0417 22.0956 19.6512 21.7051L13.6479 15.7018Z" fill="#F0C8FA"/>
            <path d="M12.0625 20C16.4808 20 20.0625 16.4183 20.0625 12C20.0625 7.58172 16.4808 4 12.0625 4C7.64422 4 4.0625 7.58172 4.0625 12C4.0625 16.4183 7.64422 20 12.0625 20Z" fill="#315BE1"/>
            <path d="M10.0625 18C14.4808 18 18.0625 14.4183 18.0625 10C18.0625 5.58172 14.4808 2 10.0625 2C5.64422 2 2.0625 5.58172 2.0625 10C2.0625 14.4183 5.64422 18 10.0625 18Z" fill="#F0C8FA"/>
            </g>
            <defs>
            <clipPath id="clip0_32_1666">
            <rect width="24" height="24" fill="white" transform="translate(0.0625)"/>
            </clipPath>
            </defs>
            </svg>
            Find Offers</button>
    </div>

    <div id="swapitems">
    {#each $signals as signal}
    {#if signal.amount}
        <div class="swapitem">
                <div class="top">   
                    <span class="logoSpan">  <img alt="token icon" src={"https://etoken-icons.s3.us-west-2.amazonaws.com/128/"+signal.swap.tokenId+'.png'}  onerror="this.onerror=null; this.remove();">      
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-1vm9ta5"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path>
                        </svg>
                    </span>              
                    <span>
                    {signal.swap.offer == 'SELL' ? 'Selling' : 'Buying'} <span class="tokenAmount">{signal.amount ? signal.amount.toLocaleString() : 'no amount found'} 
                    {$tokenRecords[signal.swap.tokenId].ticker}</span> at <span class="amount">{signal.swap.rate.toLocaleString()} XEC</span> <span class="fiatAmount">
                        {#if !(signal.swap.rate*$price < .01)}
                       (${(signal.swap.rate*$price).toFixed(2)})
                       {/if}
                    </span> per token </span>
                </div>
                <div class="bottom">
                    <div class="left"><span class="swapType">
                        {#if signal.swap.peg}
                        Active Pegged Offer
                        {:else}
                        Active Offer
                        {/if}
                    </span>
                    </div>
                    <div class="right">
                        {#if signal.swap.minimum}
                        {#if !signal.swap.peg}
                        <span class="minimum">Minimum: {signal.swap.minimum}</span>
                        {:else}
                        <span class="minimum">Min: {signal.swap.minimum}</span>
                        {/if}
                        {/if}
                        <button class="delete" on:click={()=> cancelSignal(signal)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 8L19.12 14.13C18.76 14.04 18.38 14 18 14C15.24 14 13 16.24 13 19C13 21.67 15.09 23.85 17.72 23.98C17.67 24 17.62 24 17.56 24H8.44C7.91 24 7.47 23.59 7.44 23.06L6.5 8H19.5Z" fill="#315BE1"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 6L17.12 12.13C16.76 12.04 16.38 12 16 12C13.24 12 11 14.24 11 17C11 19.67 13.09 21.85 15.72 21.98C15.67 22 15.62 22 15.56 22H6.44C5.91 22 5.47 21.59 5.44 21.06L4.5 6H17.5Z" fill="#F0C8FA"/>
                            <path d="M4.5 6H17.5" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 5C9.5 4.44772 9.94772 4 10.5 4H15.5C16.0523 4 16.5 4.44772 16.5 5V6C16.5 6.55228 16.0523 7 15.5 7H10.5C9.94772 7 9.5 6.55228 9.5 6V5Z" fill="#315BE1"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 3C7.5 2.44772 7.94772 2 8.5 2H13.5C14.0523 2 14.5 2.44772 14.5 3V4C14.5 4.55228 14.0523 5 13.5 5H8.5C7.94772 5 7.5 4.55228 7.5 4V3Z" fill="#F0C8FA"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.5 8H5.5C5.22 8 5 7.78 5 7.5V5.5C5 5.22 5.22 5 5.5 5H20.5C20.78 5 21 5.22 21 5.5V7.5C21 7.78 20.78 8 20.5 8Z" fill="#315BE1"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 6H3.5C3.22 6 3 5.78 3 5.5V3.5C3 3.22 3.22 3 3.5 3H18.5C18.78 3 19 3.22 19 3.5V5.5C19 5.78 18.78 6 18.5 6Z" fill="#F0C8FA"/>
                            <path d="M18 24C20.7614 24 23 21.7614 23 19C23 16.2386 20.7614 14 18 14C15.2386 14 13 16.2386 13 19C13 21.7614 15.2386 24 18 24Z" fill="#315BE1"/>
                            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" fill="#F0C8FA"/>
                            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M13.8799 14.8799L18.1199 19.1199" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linejoin="round"/>
                            <path d="M18.1199 14.8799L13.8799 19.1199" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linejoin="round"/>
                        </svg>
                        </button>
                    </div>
                </div>
        </div>
    {/if}
    {/each}
    {#each $payments as payment}
        <div class="swapitem">
            <div class="top">
                <span class="logoSpan">  <img alt="token icon" src={"https://etoken-icons.s3.us-west-2.amazonaws.com/128/"+payment.swap.tokenId+'.png'}  onerror="this.onerror=null; this.remove();">      
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-1vm9ta5"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path>
                    </svg>
                </span>  
                <span>
                {payment.swap.offer != 'SELL' ? 'Selling' : 'Buying'} <span class="tokenAmount">{payment.swap.amount.toLocaleString()}
                {$tokenRecords[payment.swap.tokenId].ticker}</span>  at <span class="amount">{payment.swap.rate.toLocaleString()} XEC</span><span class="fiatAmount">
                    {#if !(payment.swap.rate*$price < .01)}
                (${(payment.swap.rate*$price).toFixed(2)})
                {/if}
                </span> per token </span>
            </div>
            <div class="bottom">
                <div class="left"><span class="swapType">Pending Payment</span></div>
                <div class="right">
                    {#if payment.swap.minimum}
                    <span class="minimum">Minimum: {payment.swap.minimum}</span>
                    {/if}
                    <button class="delete" on:click={()=> cancelPayment(payment)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 8L19.12 14.13C18.76 14.04 18.38 14 18 14C15.24 14 13 16.24 13 19C13 21.67 15.09 23.85 17.72 23.98C17.67 24 17.62 24 17.56 24H8.44C7.91 24 7.47 23.59 7.44 23.06L6.5 8H19.5Z" fill="#315BE1"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 6L17.12 12.13C16.76 12.04 16.38 12 16 12C13.24 12 11 14.24 11 17C11 19.67 13.09 21.85 15.72 21.98C15.67 22 15.62 22 15.56 22H6.44C5.91 22 5.47 21.59 5.44 21.06L4.5 6H17.5Z" fill="#F0C8FA"/>
                        <path d="M4.5 6H17.5" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 5C9.5 4.44772 9.94772 4 10.5 4H15.5C16.0523 4 16.5 4.44772 16.5 5V6C16.5 6.55228 16.0523 7 15.5 7H10.5C9.94772 7 9.5 6.55228 9.5 6V5Z" fill="#315BE1"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 3C7.5 2.44772 7.94772 2 8.5 2H13.5C14.0523 2 14.5 2.44772 14.5 3V4C14.5 4.55228 14.0523 5 13.5 5H8.5C7.94772 5 7.5 4.55228 7.5 4V3Z" fill="#F0C8FA"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.5 8H5.5C5.22 8 5 7.78 5 7.5V5.5C5 5.22 5.22 5 5.5 5H20.5C20.78 5 21 5.22 21 5.5V7.5C21 7.78 20.78 8 20.5 8Z" fill="#315BE1"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 6H3.5C3.22 6 3 5.78 3 5.5V3.5C3 3.22 3.22 3 3.5 3H18.5C18.78 3 19 3.22 19 3.5V5.5C19 5.78 18.78 6 18.5 6Z" fill="#F0C8FA"/>
                        <path d="M18 24C20.7614 24 23 21.7614 23 19C23 16.2386 20.7614 14 18 14C15.2386 14 13 16.2386 13 19C13 21.7614 15.2386 24 18 24Z" fill="#315BE1"/>
                        <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" fill="#F0C8FA"/>
                        <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M13.8799 14.8799L18.1199 19.1199" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linejoin="round"/>
                        <path d="M18.1199 14.8799L13.8799 19.1199" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linejoin="round"/>
                        </svg>
                        </button>
                </div>
            </div>
        </div>
    {/each}
    {#if $signals.length == 0 && $payments.length == 0}
        <p>Your offers and payments will appear here</p>
    {/if}

    <div id="learn"><button on:click={()=> learn = true}>How does Swap work?</button></div>
    </div>
    {:else if $view == 'swapping'}
        <span id="create">Create New Offer</span>
        <div id="type">I want to:
            <label>
                <input type=radio bind:group={type} value={'BUY'}>
                <span>Buy</span>
            </label>
        
            <label>
                <input type=radio bind:group={type} value={'SELL'}>
                <span>Sell</span>
            </label>
        </div>
        <div id="selectToken">
            {#if type != 'SELL'}
            {#each recommendedTokens as token}
            {#if !$tokenFunds[token] && $tokenRecords[token]}  
            <label class="token">
                <input type=radio bind:group={selectedToken} value={token}>
                <span>{$tokenRecords[token].ticker}</span>
            </label>
            {/if} 
            {/each}
            {/if}
            {#each Object.keys($tokenFunds) as tokenId}
            {#if $tokenRecords[tokenId]}
            <label class="token">
                <input type=radio bind:group={selectedToken} value={tokenId}>
                <span>
                {$tokenRecords[tokenId].ticker}
                {#if type == 'SELL'}
                | {($tokenFunds[tokenId] / (10 ** $tokenRecords[tokenId].decimals)).toLocaleString()}
                {/if}
                </span>
            </label>
            {/if}
            {/each}
            {#if type == 'BUY'}
            <label class="token">
                <input type=radio bind:group={selectedToken} value={'other'}>
                Other
            </label>
            {/if}
            {#if selectedToken == 'other'}
            <span id="tokenid"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_32_1864)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5854 17.702C15.1949 17.3115 15.1949 16.6783 15.5854 16.2878L16.2925 15.5807C16.6831 15.1902 17.3162 15.1902 17.7067 15.5807L23.71 21.584C24.1005 21.9745 24.1005 22.6077 23.71 22.9982L23.0029 23.7053C22.6124 24.0958 21.9792 24.0958 21.5887 23.7053L15.5854 17.702Z" fill="#315BE1"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5854 15.702C13.1949 15.3115 13.1949 14.6783 13.5854 14.2878L14.2925 13.5807C14.6831 13.1902 15.3162 13.1902 15.7067 13.5807L21.71 19.584C22.1005 19.9745 22.1005 20.6077 21.71 20.9982L21.0029 21.7053C20.6124 22.0958 19.9792 22.0958 19.5887 21.7053L13.5854 15.702Z" fill="#F0C8FA"/>
                    <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" fill="#315BE1"/>
                    <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#F0C8FA"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_32_1864">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                    </defs>
                </svg>
                <input id="tokenid" placeholder="etoken id" bind:value={tokenIdInput}></span>
            {/if}

        </div>
        <div id="amount"><span id='marginalized'><span id="svg">
            
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC"/>
            </svg>
            </span> <input type=number placeholder="Amount:" bind:value={amount}>
            {#if type=="SELL"}
            <button on:click={()=> $tokenFunds[actualToken] ? amount = ($tokenFunds[actualToken] / ( 10 ** $tokenRecords[actualToken].decimals)) : amount=amount} id="max">max</button>
            {/if}
            {#if $tokenRecords[selectedToken]}
            {$tokenRecords[selectedToken].ticker}
            {:else}
            tokens
            {/if}
            </div>
        
        
        
            <div id="rate"><input type=number placeholder="Rate:" value={rate} on:input="{r => setRate(r.target.value)}">

                <span id="xecToken">    
                    {#if $tokenRecords[selectedToken]}
                    XEC/{$tokenRecords[selectedToken].ticker}
                    {:else}
                    XEC/token
                    {/if}
                </span>
            </div>
            <div id="rate"><input type=number placeholder="Dollar Rate:" value={fiatRate} on:input="{r => setFiat(r.target.value)}">

                <span id="xecToken">    
                    {#if $tokenRecords[selectedToken]}
                    USD/{$tokenRecords[selectedToken].ticker}
                    {:else}
                    USD/token
                    {/if}
                </span>
            </div>
        <div id="partialDiv"><span id="partialSpan">Allow partial trade?<input id="partial" type=checkbox bind:checked={partial}></span>
        {#if partial}
        <span id="minimum">Minimum: <input id="minimumInput" type=number bind:value={minimum} min=0>
            {#if $tokenRecords[selectedToken]}
            {$tokenRecords[selectedToken].ticker}
            {:else}
            tokens
            {/if}
        </span>
        {/if}
        <span id="partialSpan">Peg Rate To USD?<input id="partial" type=checkbox bind:checked={peg}></span>
        </div>
        {#if response}
        <br><span>{response}</span>
        {/if}
        <div id='createButtons'><button on:click={()=> view.set('swap')} id="back">back</button>
            {#if actualToken && type && rate &&!(rate<.01) && amount && (amount*rate > 5.5) && (!minimum || (!(minimum > amount) && (minimum * rate > 5.5)))}
            <button on:click={newOffer} id="createButton">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_32_1932)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.81413 4C8.81413 3.44772 9.26185 3 9.81413 3C10.2497 3 10.9667 3.10961 11.5194 3.5894C11.819 3.84949 12.0595 4.21244 12.152 4.67677C12.2419 5.12804 12.177 5.59792 12.0072 6.06458C11.786 6.67262 11.2468 7.40593 10.7149 8.0761C10.337 8.55228 9.89814 9.07357 9.46491 9.58821C9.25956 9.83214 9.05548 10.0746 8.85974 10.31C8.4783 10.7687 8.12618 11.2036 7.82942 11.5992C8.70159 11.1092 9.75712 10.4448 10.8477 9.75771L10.8743 9.74094C12.1077 8.9639 13.3854 8.15895 14.3972 7.62119C14.8984 7.35484 15.3951 7.12061 15.8177 6.99846C16.0218 6.93947 16.2926 6.88087 16.5751 6.90461C16.8815 6.93037 17.3306 7.07421 17.5852 7.54072C17.7754 7.88936 17.7603 8.24154 17.7163 8.4769C17.6716 8.71615 17.5787 8.93836 17.4842 9.12465C17.2945 9.49885 17.0058 9.90601 16.6904 10.3069C16.0588 11.1097 15.1758 12.0659 14.3301 12.9818L14.3087 13.0049C13.7153 13.6475 13.1407 14.2703 12.6522 14.834C13.3251 14.4434 14.0776 13.9738 14.8415 13.491C15.0068 13.3866 15.1728 13.2814 15.3384 13.1764C16.2935 12.5712 17.2363 11.9738 17.9711 11.5619C18.3891 11.3276 18.8127 11.1109 19.1609 11.0007C19.3038 10.9555 19.6082 10.8677 19.9384 10.9338C20.1345 10.9731 20.3943 11.0786 20.595 11.3284C20.7934 11.5753 20.8407 11.8471 20.8407 12.0394C20.8407 12.3578 20.7198 12.621 20.6356 12.7765C20.5411 12.9509 20.4204 13.1182 20.2986 13.27C20.0541 13.5744 19.7267 13.912 19.371 14.2563C18.9011 14.7112 18.3221 15.234 17.7298 15.7689C17.4307 16.0389 17.1282 16.312 16.8346 16.581C15.9336 17.4067 15.0986 18.2091 14.5302 18.8953C14.4872 18.9472 14.4465 18.9975 14.4081 19.0462C14.9518 18.7743 15.6088 18.3818 16.3427 17.9334C16.4365 17.8761 16.5313 17.818 16.627 17.7594C17.4711 17.2426 18.3808 16.6855 19.1978 16.2772C19.6541 16.0492 20.1199 15.8475 20.56 15.7242C20.9763 15.6077 21.5041 15.5216 22.0128 15.677C22.2753 15.7572 22.6035 15.9272 22.8157 16.2794C23.0307 16.6362 23.0223 17.0063 22.9655 17.2688C22.8658 17.7301 22.5553 18.1548 22.3006 18.4639C21.7442 19.1392 20.8474 19.9571 19.9883 20.7271C19.8647 20.8379 19.7415 20.948 19.6191 21.0573C19.2074 21.4253 18.8065 21.7837 18.44 22.123C18.929 21.8873 19.4754 21.644 19.9938 21.5044C20.5914 21.3436 21.5253 21.219 22.2427 21.8764C22.6499 22.2495 22.6775 22.8821 22.3043 23.2893C21.9407 23.6861 21.3305 23.7224 20.9228 23.3784C20.8839 23.3725 20.7675 23.3674 20.5135 23.4357C20.0906 23.5496 19.577 23.7903 18.9823 24.0843C18.9258 24.1122 18.8681 24.1409 18.8095 24.1701C18.307 24.4197 17.734 24.7045 17.2429 24.8594C16.97 24.9454 16.6109 25.03 16.2407 24.9895C15.8106 24.9423 15.3646 24.72 15.1033 24.2411C14.9041 23.876 14.9303 23.5085 14.9924 23.2583C15.0534 23.0123 15.1681 22.7937 15.277 22.6195C15.4961 22.269 15.8191 21.9006 16.1594 21.549C16.7518 20.9369 17.54 20.2328 18.2943 19.5589C18.4152 19.4509 18.5353 19.3437 18.6535 19.2377C19.0394 18.8918 19.4035 18.5617 19.7281 18.255C19.0873 18.5986 18.3857 19.028 17.6643 19.4695C17.5716 19.5262 17.4786 19.5832 17.3853 19.6401C16.4644 20.2028 15.4904 20.7889 14.6954 21.1126C14.3117 21.2689 13.8447 21.4185 13.389 21.4011C13.1447 21.3918 12.8542 21.3328 12.582 21.1552C12.2986 20.9702 12.1116 20.7064 12.0076 20.4207C11.7917 19.827 11.9751 19.2492 12.1594 18.8589C12.3569 18.4407 12.6593 18.0187 12.99 17.6195C13.3892 17.1375 13.8828 16.6263 14.4083 16.1162C13.7767 16.4998 13.1663 16.8537 12.6299 17.1285C12.1603 17.3691 11.6842 17.5827 11.2711 17.6877C11.0702 17.7388 10.8014 17.7868 10.52 17.75C10.2097 17.7094 9.79987 17.5466 9.56292 17.1124C9.37267 16.7638 9.38772 16.4116 9.43173 16.1762C9.47646 15.9369 9.56938 15.7147 9.66382 15.5284C9.85353 15.1542 10.1423 14.7471 10.4577 14.3461C11.0893 13.5433 11.9723 12.5871 12.818 11.6712L12.8393 11.6481C13.4044 11.0361 13.9526 10.4421 14.4255 9.89999C13.6647 10.3472 12.8008 10.8911 11.9138 11.4499L11.8872 11.4667C10.6538 12.2437 9.37608 13.0486 8.36428 13.5864C7.86314 13.8528 7.36645 14.087 6.94376 14.2091C6.73967 14.2681 6.4689 14.3267 6.18643 14.303C5.87996 14.2772 5.43087 14.1334 5.17632 13.6669C4.89583 13.1528 5.00912 12.6155 5.11372 12.2965C5.22966 11.9429 5.42655 11.5818 5.63989 11.2446C6.07035 10.5642 6.69672 9.78321 7.32188 9.03132C7.53619 8.77356 7.75025 8.51933 7.96035 8.26979C8.3822 7.76875 8.78814 7.28662 9.14835 6.83277C9.71313 6.12116 10.0356 5.63421 10.1277 5.38088C10.187 5.21802 10.1932 5.12615 10.1923 5.08825C10.1713 5.07506 10.1316 5.05468 10.0669 5.03596C9.97978 5.01076 9.88615 5 9.81413 5C9.26185 5 8.81413 4.55228 8.81413 4Z" fill="#315BE1"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81413 2C6.81413 1.44772 7.26185 1 7.81413 1C8.24965 1 8.96668 1.10961 9.51935 1.5894C9.81895 1.84949 10.0595 2.21244 10.152 2.67677C10.2419 3.12804 10.177 3.59792 10.0072 4.06458C9.78603 4.67262 9.2468 5.40593 8.71492 6.0761C8.33699 6.55228 7.89814 7.07357 7.46491 7.58821C7.25956 7.83214 7.05548 8.07457 6.85974 8.30999C6.4783 8.76875 6.12618 9.20356 5.82942 9.59924C6.70159 9.10922 7.75712 8.44478 8.84772 7.75771L8.87433 7.74094C10.1077 6.9639 11.3854 6.15895 12.3972 5.62119C12.8984 5.35484 13.3951 5.12061 13.8177 4.99846C14.0218 4.93947 14.2926 4.88087 14.5751 4.90461C14.8815 4.93037 15.3306 5.07421 15.5852 5.54072C15.7754 5.88936 15.7603 6.24154 15.7163 6.4769C15.6716 6.71615 15.5787 6.93836 15.4842 7.12465C15.2945 7.49885 15.0058 7.90601 14.6904 8.30692C14.0588 9.10972 13.1758 10.0659 12.3301 10.9818L12.3087 11.0049C11.7153 11.6475 11.1407 12.2703 10.6522 12.834C11.3251 12.4434 12.0776 11.9738 12.8415 11.491C13.0068 11.3866 13.1728 11.2814 13.3384 11.1764C14.2935 10.5712 15.2363 9.9738 15.9711 9.56192C16.3891 9.32757 16.8127 9.11086 17.1609 9.00073C17.3038 8.95554 17.6082 8.8677 17.9384 8.93382C18.1345 8.97311 18.3943 9.07864 18.595 9.32837C18.7934 9.57529 18.8407 9.8471 18.8407 10.0394C18.8407 10.3578 18.7198 10.621 18.6356 10.7765C18.5411 10.9509 18.4204 11.1182 18.2986 11.27C18.0541 11.5744 17.7267 11.912 17.371 12.2563C16.9011 12.7112 16.3221 13.234 15.7298 13.7689C15.4307 14.0389 15.1282 14.312 14.8346 14.581C13.9336 15.4067 13.0986 16.2091 12.5302 16.8953C12.4872 16.9472 12.4465 16.9975 12.4081 17.0462C12.9518 16.7743 13.6088 16.3818 14.3427 15.9334C14.4365 15.8761 14.5313 15.818 14.627 15.7594C15.4711 15.2426 16.3808 14.6855 17.1978 14.2772C17.6541 14.0492 18.1199 13.8475 18.56 13.7242C18.9763 13.6077 19.5041 13.5216 20.0128 13.677C20.2753 13.7572 20.6035 13.9272 20.8157 14.2794C21.0307 14.6362 21.0223 15.0063 20.9655 15.2688C20.8658 15.7301 20.5553 16.1548 20.3006 16.4639C19.7442 17.1392 18.8474 17.9571 17.9883 18.7271C17.8647 18.8379 17.7415 18.948 17.6191 19.0573C17.2074 19.4253 16.8065 19.7837 16.44 20.123C16.929 19.8873 17.4754 19.644 17.9938 19.5044C18.5914 19.3436 19.5253 19.219 20.2427 19.8764C20.6499 20.2495 20.6775 20.8821 20.3043 21.2893C19.9407 21.6861 19.3305 21.7224 18.9228 21.3784C18.8839 21.3725 18.7675 21.3674 18.5135 21.4357C18.0906 21.5496 17.577 21.7903 16.9823 22.0843C16.9258 22.1122 16.8681 22.1409 16.8095 22.1701C16.307 22.4197 15.734 22.7045 15.2429 22.8594C14.97 22.9454 14.6109 23.03 14.2407 22.9895C13.8106 22.9423 13.3646 22.72 13.1033 22.2411C12.9041 21.876 12.9303 21.5085 12.9924 21.2583C13.0534 21.0123 13.1681 20.7937 13.277 20.6195C13.4961 20.269 13.8191 19.9006 14.1594 19.549C14.7518 18.9369 15.54 18.2328 16.2943 17.5589C16.4152 17.4509 16.5353 17.3437 16.6535 17.2377C17.0394 16.8918 17.4035 16.5617 17.7281 16.255C17.0873 16.5986 16.3857 17.028 15.6643 17.4695C15.5716 17.5262 15.4786 17.5832 15.3853 17.6401C14.4644 18.2028 13.4904 18.7889 12.6954 19.1126C12.3117 19.2689 11.8447 19.4185 11.389 19.4011C11.1447 19.3918 10.8542 19.3328 10.582 19.1552C10.2986 18.9702 10.1116 18.7064 10.0076 18.4207C9.79168 17.827 9.97506 17.2492 10.1594 16.8589C10.3569 16.4407 10.6593 16.0187 10.99 15.6195C11.3892 15.1375 11.8828 14.6263 12.4083 14.1162C11.7767 14.4998 11.1663 14.8537 10.6299 15.1285C10.1603 15.3691 9.68424 15.5827 9.27105 15.6877C9.07021 15.7388 8.80135 15.7868 8.51997 15.75C8.20967 15.7094 7.79987 15.5466 7.56292 15.1124C7.37267 14.7638 7.38772 14.4116 7.43173 14.1762C7.47646 13.9369 7.56938 13.7147 7.66382 13.5284C7.85353 13.1542 8.14226 12.7471 8.45767 12.3461C9.08929 11.5433 9.97228 10.5871 10.818 9.67118L10.8393 9.64812C11.4044 9.03614 11.9526 8.44211 12.4255 7.89999C11.6647 8.34721 10.8008 8.89106 9.91379 9.44989L9.88717 9.46667C8.65377 10.2437 7.37608 11.0486 6.36428 11.5864C5.86314 11.8528 5.36645 12.087 4.94376 12.2091C4.73967 12.2681 4.4689 12.3267 4.18643 12.303C3.87996 12.2772 3.43087 12.1334 3.17632 11.6669C2.89583 11.1528 3.00912 10.6155 3.11372 10.2965C3.22966 9.94289 3.42655 9.5818 3.63989 9.24458C4.07035 8.56415 4.69672 7.78321 5.32188 7.03132C5.53619 6.77356 5.75025 6.51933 5.96035 6.26979C6.3822 5.76875 6.78814 5.28662 7.14835 4.83277C7.71313 4.12116 8.03555 3.63421 8.1277 3.38088C8.18695 3.21802 8.19321 3.12615 8.19225 3.08825C8.17134 3.07506 8.13156 3.05468 8.06687 3.03596C7.97978 3.01076 7.88615 3 7.81413 3C7.26185 3 6.81413 2.55228 6.81413 2Z" fill="#F0C8FA"/>
                </g>
                <defs>
                <clipPath id="clip0_32_1932">
                <rect width="24" height="24" fill="white"/>
                </clipPath>
                </defs>
            </svg>
                &nbsp;Create Offer
            </button>
            {:else}
            <button disabled on:click={newOffer} id="createButtonDisabled">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_32_1932)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.81413 4C8.81413 3.44772 9.26185 3 9.81413 3C10.2497 3 10.9667 3.10961 11.5194 3.5894C11.819 3.84949 12.0595 4.21244 12.152 4.67677C12.2419 5.12804 12.177 5.59792 12.0072 6.06458C11.786 6.67262 11.2468 7.40593 10.7149 8.0761C10.337 8.55228 9.89814 9.07357 9.46491 9.58821C9.25956 9.83214 9.05548 10.0746 8.85974 10.31C8.4783 10.7687 8.12618 11.2036 7.82942 11.5992C8.70159 11.1092 9.75712 10.4448 10.8477 9.75771L10.8743 9.74094C12.1077 8.9639 13.3854 8.15895 14.3972 7.62119C14.8984 7.35484 15.3951 7.12061 15.8177 6.99846C16.0218 6.93947 16.2926 6.88087 16.5751 6.90461C16.8815 6.93037 17.3306 7.07421 17.5852 7.54072C17.7754 7.88936 17.7603 8.24154 17.7163 8.4769C17.6716 8.71615 17.5787 8.93836 17.4842 9.12465C17.2945 9.49885 17.0058 9.90601 16.6904 10.3069C16.0588 11.1097 15.1758 12.0659 14.3301 12.9818L14.3087 13.0049C13.7153 13.6475 13.1407 14.2703 12.6522 14.834C13.3251 14.4434 14.0776 13.9738 14.8415 13.491C15.0068 13.3866 15.1728 13.2814 15.3384 13.1764C16.2935 12.5712 17.2363 11.9738 17.9711 11.5619C18.3891 11.3276 18.8127 11.1109 19.1609 11.0007C19.3038 10.9555 19.6082 10.8677 19.9384 10.9338C20.1345 10.9731 20.3943 11.0786 20.595 11.3284C20.7934 11.5753 20.8407 11.8471 20.8407 12.0394C20.8407 12.3578 20.7198 12.621 20.6356 12.7765C20.5411 12.9509 20.4204 13.1182 20.2986 13.27C20.0541 13.5744 19.7267 13.912 19.371 14.2563C18.9011 14.7112 18.3221 15.234 17.7298 15.7689C17.4307 16.0389 17.1282 16.312 16.8346 16.581C15.9336 17.4067 15.0986 18.2091 14.5302 18.8953C14.4872 18.9472 14.4465 18.9975 14.4081 19.0462C14.9518 18.7743 15.6088 18.3818 16.3427 17.9334C16.4365 17.8761 16.5313 17.818 16.627 17.7594C17.4711 17.2426 18.3808 16.6855 19.1978 16.2772C19.6541 16.0492 20.1199 15.8475 20.56 15.7242C20.9763 15.6077 21.5041 15.5216 22.0128 15.677C22.2753 15.7572 22.6035 15.9272 22.8157 16.2794C23.0307 16.6362 23.0223 17.0063 22.9655 17.2688C22.8658 17.7301 22.5553 18.1548 22.3006 18.4639C21.7442 19.1392 20.8474 19.9571 19.9883 20.7271C19.8647 20.8379 19.7415 20.948 19.6191 21.0573C19.2074 21.4253 18.8065 21.7837 18.44 22.123C18.929 21.8873 19.4754 21.644 19.9938 21.5044C20.5914 21.3436 21.5253 21.219 22.2427 21.8764C22.6499 22.2495 22.6775 22.8821 22.3043 23.2893C21.9407 23.6861 21.3305 23.7224 20.9228 23.3784C20.8839 23.3725 20.7675 23.3674 20.5135 23.4357C20.0906 23.5496 19.577 23.7903 18.9823 24.0843C18.9258 24.1122 18.8681 24.1409 18.8095 24.1701C18.307 24.4197 17.734 24.7045 17.2429 24.8594C16.97 24.9454 16.6109 25.03 16.2407 24.9895C15.8106 24.9423 15.3646 24.72 15.1033 24.2411C14.9041 23.876 14.9303 23.5085 14.9924 23.2583C15.0534 23.0123 15.1681 22.7937 15.277 22.6195C15.4961 22.269 15.8191 21.9006 16.1594 21.549C16.7518 20.9369 17.54 20.2328 18.2943 19.5589C18.4152 19.4509 18.5353 19.3437 18.6535 19.2377C19.0394 18.8918 19.4035 18.5617 19.7281 18.255C19.0873 18.5986 18.3857 19.028 17.6643 19.4695C17.5716 19.5262 17.4786 19.5832 17.3853 19.6401C16.4644 20.2028 15.4904 20.7889 14.6954 21.1126C14.3117 21.2689 13.8447 21.4185 13.389 21.4011C13.1447 21.3918 12.8542 21.3328 12.582 21.1552C12.2986 20.9702 12.1116 20.7064 12.0076 20.4207C11.7917 19.827 11.9751 19.2492 12.1594 18.8589C12.3569 18.4407 12.6593 18.0187 12.99 17.6195C13.3892 17.1375 13.8828 16.6263 14.4083 16.1162C13.7767 16.4998 13.1663 16.8537 12.6299 17.1285C12.1603 17.3691 11.6842 17.5827 11.2711 17.6877C11.0702 17.7388 10.8014 17.7868 10.52 17.75C10.2097 17.7094 9.79987 17.5466 9.56292 17.1124C9.37267 16.7638 9.38772 16.4116 9.43173 16.1762C9.47646 15.9369 9.56938 15.7147 9.66382 15.5284C9.85353 15.1542 10.1423 14.7471 10.4577 14.3461C11.0893 13.5433 11.9723 12.5871 12.818 11.6712L12.8393 11.6481C13.4044 11.0361 13.9526 10.4421 14.4255 9.89999C13.6647 10.3472 12.8008 10.8911 11.9138 11.4499L11.8872 11.4667C10.6538 12.2437 9.37608 13.0486 8.36428 13.5864C7.86314 13.8528 7.36645 14.087 6.94376 14.2091C6.73967 14.2681 6.4689 14.3267 6.18643 14.303C5.87996 14.2772 5.43087 14.1334 5.17632 13.6669C4.89583 13.1528 5.00912 12.6155 5.11372 12.2965C5.22966 11.9429 5.42655 11.5818 5.63989 11.2446C6.07035 10.5642 6.69672 9.78321 7.32188 9.03132C7.53619 8.77356 7.75025 8.51933 7.96035 8.26979C8.3822 7.76875 8.78814 7.28662 9.14835 6.83277C9.71313 6.12116 10.0356 5.63421 10.1277 5.38088C10.187 5.21802 10.1932 5.12615 10.1923 5.08825C10.1713 5.07506 10.1316 5.05468 10.0669 5.03596C9.97978 5.01076 9.88615 5 9.81413 5C9.26185 5 8.81413 4.55228 8.81413 4Z" fill="#315BE1"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81413 2C6.81413 1.44772 7.26185 1 7.81413 1C8.24965 1 8.96668 1.10961 9.51935 1.5894C9.81895 1.84949 10.0595 2.21244 10.152 2.67677C10.2419 3.12804 10.177 3.59792 10.0072 4.06458C9.78603 4.67262 9.2468 5.40593 8.71492 6.0761C8.33699 6.55228 7.89814 7.07357 7.46491 7.58821C7.25956 7.83214 7.05548 8.07457 6.85974 8.30999C6.4783 8.76875 6.12618 9.20356 5.82942 9.59924C6.70159 9.10922 7.75712 8.44478 8.84772 7.75771L8.87433 7.74094C10.1077 6.9639 11.3854 6.15895 12.3972 5.62119C12.8984 5.35484 13.3951 5.12061 13.8177 4.99846C14.0218 4.93947 14.2926 4.88087 14.5751 4.90461C14.8815 4.93037 15.3306 5.07421 15.5852 5.54072C15.7754 5.88936 15.7603 6.24154 15.7163 6.4769C15.6716 6.71615 15.5787 6.93836 15.4842 7.12465C15.2945 7.49885 15.0058 7.90601 14.6904 8.30692C14.0588 9.10972 13.1758 10.0659 12.3301 10.9818L12.3087 11.0049C11.7153 11.6475 11.1407 12.2703 10.6522 12.834C11.3251 12.4434 12.0776 11.9738 12.8415 11.491C13.0068 11.3866 13.1728 11.2814 13.3384 11.1764C14.2935 10.5712 15.2363 9.9738 15.9711 9.56192C16.3891 9.32757 16.8127 9.11086 17.1609 9.00073C17.3038 8.95554 17.6082 8.8677 17.9384 8.93382C18.1345 8.97311 18.3943 9.07864 18.595 9.32837C18.7934 9.57529 18.8407 9.8471 18.8407 10.0394C18.8407 10.3578 18.7198 10.621 18.6356 10.7765C18.5411 10.9509 18.4204 11.1182 18.2986 11.27C18.0541 11.5744 17.7267 11.912 17.371 12.2563C16.9011 12.7112 16.3221 13.234 15.7298 13.7689C15.4307 14.0389 15.1282 14.312 14.8346 14.581C13.9336 15.4067 13.0986 16.2091 12.5302 16.8953C12.4872 16.9472 12.4465 16.9975 12.4081 17.0462C12.9518 16.7743 13.6088 16.3818 14.3427 15.9334C14.4365 15.8761 14.5313 15.818 14.627 15.7594C15.4711 15.2426 16.3808 14.6855 17.1978 14.2772C17.6541 14.0492 18.1199 13.8475 18.56 13.7242C18.9763 13.6077 19.5041 13.5216 20.0128 13.677C20.2753 13.7572 20.6035 13.9272 20.8157 14.2794C21.0307 14.6362 21.0223 15.0063 20.9655 15.2688C20.8658 15.7301 20.5553 16.1548 20.3006 16.4639C19.7442 17.1392 18.8474 17.9571 17.9883 18.7271C17.8647 18.8379 17.7415 18.948 17.6191 19.0573C17.2074 19.4253 16.8065 19.7837 16.44 20.123C16.929 19.8873 17.4754 19.644 17.9938 19.5044C18.5914 19.3436 19.5253 19.219 20.2427 19.8764C20.6499 20.2495 20.6775 20.8821 20.3043 21.2893C19.9407 21.6861 19.3305 21.7224 18.9228 21.3784C18.8839 21.3725 18.7675 21.3674 18.5135 21.4357C18.0906 21.5496 17.577 21.7903 16.9823 22.0843C16.9258 22.1122 16.8681 22.1409 16.8095 22.1701C16.307 22.4197 15.734 22.7045 15.2429 22.8594C14.97 22.9454 14.6109 23.03 14.2407 22.9895C13.8106 22.9423 13.3646 22.72 13.1033 22.2411C12.9041 21.876 12.9303 21.5085 12.9924 21.2583C13.0534 21.0123 13.1681 20.7937 13.277 20.6195C13.4961 20.269 13.8191 19.9006 14.1594 19.549C14.7518 18.9369 15.54 18.2328 16.2943 17.5589C16.4152 17.4509 16.5353 17.3437 16.6535 17.2377C17.0394 16.8918 17.4035 16.5617 17.7281 16.255C17.0873 16.5986 16.3857 17.028 15.6643 17.4695C15.5716 17.5262 15.4786 17.5832 15.3853 17.6401C14.4644 18.2028 13.4904 18.7889 12.6954 19.1126C12.3117 19.2689 11.8447 19.4185 11.389 19.4011C11.1447 19.3918 10.8542 19.3328 10.582 19.1552C10.2986 18.9702 10.1116 18.7064 10.0076 18.4207C9.79168 17.827 9.97506 17.2492 10.1594 16.8589C10.3569 16.4407 10.6593 16.0187 10.99 15.6195C11.3892 15.1375 11.8828 14.6263 12.4083 14.1162C11.7767 14.4998 11.1663 14.8537 10.6299 15.1285C10.1603 15.3691 9.68424 15.5827 9.27105 15.6877C9.07021 15.7388 8.80135 15.7868 8.51997 15.75C8.20967 15.7094 7.79987 15.5466 7.56292 15.1124C7.37267 14.7638 7.38772 14.4116 7.43173 14.1762C7.47646 13.9369 7.56938 13.7147 7.66382 13.5284C7.85353 13.1542 8.14226 12.7471 8.45767 12.3461C9.08929 11.5433 9.97228 10.5871 10.818 9.67118L10.8393 9.64812C11.4044 9.03614 11.9526 8.44211 12.4255 7.89999C11.6647 8.34721 10.8008 8.89106 9.91379 9.44989L9.88717 9.46667C8.65377 10.2437 7.37608 11.0486 6.36428 11.5864C5.86314 11.8528 5.36645 12.087 4.94376 12.2091C4.73967 12.2681 4.4689 12.3267 4.18643 12.303C3.87996 12.2772 3.43087 12.1334 3.17632 11.6669C2.89583 11.1528 3.00912 10.6155 3.11372 10.2965C3.22966 9.94289 3.42655 9.5818 3.63989 9.24458C4.07035 8.56415 4.69672 7.78321 5.32188 7.03132C5.53619 6.77356 5.75025 6.51933 5.96035 6.26979C6.3822 5.76875 6.78814 5.28662 7.14835 4.83277C7.71313 4.12116 8.03555 3.63421 8.1277 3.38088C8.18695 3.21802 8.19321 3.12615 8.19225 3.08825C8.17134 3.07506 8.13156 3.05468 8.06687 3.03596C7.97978 3.01076 7.88615 3 7.81413 3C7.26185 3 6.81413 2.55228 6.81413 2Z" fill="#F0C8FA"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_32_1932">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                    </defs>
                </svg>
                    &nbsp;Create Offer
                </button>
            {/if}
        
        </div>
    {:else if $view == 'offers'}
        {#if !offers}
            <span id="find">Find Offers</span>
            <div id="type">
                I want to:
                <label>
                    <input type=radio bind:group={offerType} value={'SELL'}>
                    <span>Buy</span>
                </label>
            
                <label>
                    <input type=radio bind:group={offerType} value={'BUY'}>
                    <span>Sell</span>
                </label>
            </div>
            <div id="selectToken">
                {#each recommendedTokens as token}
                {#if !$tokenFunds[token] && $tokenRecords[token]}  
                <label class="token">
                    <input type=radio bind:group={offerToken} value={token}>
                    <span>{$tokenRecords[token].ticker}</span>
                </label>
                {/if} 
                {/each}
                {#each Object.keys($tokenFunds) as tokenId}

                {#if $tokenRecords[tokenId]}
                <label class="token">
                    <input type=radio bind:group={offerToken} value={tokenId}>
                    <span>
                    {$tokenRecords[tokenId].ticker}
                    {#if type == 'SELL'}
                    | {($tokenFunds[tokenId] / (10 ** $tokenRecords[tokenId].decimals)).toLocaleString()}
                    {/if}
                    </span>
                </label>
                {/if}
                {/each}
                <label class="token">
                    <input type=radio bind:group={offerToken} value={'other'}>
                    Other
                </label>
                {#if offerToken == 'other'}
                <span id="tokenid">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_32_1864)">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5854 17.702C15.1949 17.3115 15.1949 16.6783 15.5854 16.2878L16.2925 15.5807C16.6831 15.1902 17.3162 15.1902 17.7067 15.5807L23.71 21.584C24.1005 21.9745 24.1005 22.6077 23.71 22.9982L23.0029 23.7053C22.6124 24.0958 21.9792 24.0958 21.5887 23.7053L15.5854 17.702Z" fill="#315BE1"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5854 15.702C13.1949 15.3115 13.1949 14.6783 13.5854 14.2878L14.2925 13.5807C14.6831 13.1902 15.3162 13.1902 15.7067 13.5807L21.71 19.584C22.1005 19.9745 22.1005 20.6077 21.71 20.9982L21.0029 21.7053C20.6124 22.0958 19.9792 22.0958 19.5887 21.7053L13.5854 15.702Z" fill="#F0C8FA"/>
                        <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" fill="#315BE1"/>
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" fill="#F0C8FA"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_32_1864">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
                    </svg>
                    <input id="tokenid" placeholder="etoken id" bind:value={offerTokenIdInput}></span>
                {/if}
                
            </div>
            <div id='findButtons'><button on:click={()=> view.set('swap')} id="back">back</button>
                {#if offerType && actualOfferTokenId}
                <button on:click={findOffers} id="findButton">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_32_1932)">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.81413 4C8.81413 3.44772 9.26185 3 9.81413 3C10.2497 3 10.9667 3.10961 11.5194 3.5894C11.819 3.84949 12.0595 4.21244 12.152 4.67677C12.2419 5.12804 12.177 5.59792 12.0072 6.06458C11.786 6.67262 11.2468 7.40593 10.7149 8.0761C10.337 8.55228 9.89814 9.07357 9.46491 9.58821C9.25956 9.83214 9.05548 10.0746 8.85974 10.31C8.4783 10.7687 8.12618 11.2036 7.82942 11.5992C8.70159 11.1092 9.75712 10.4448 10.8477 9.75771L10.8743 9.74094C12.1077 8.9639 13.3854 8.15895 14.3972 7.62119C14.8984 7.35484 15.3951 7.12061 15.8177 6.99846C16.0218 6.93947 16.2926 6.88087 16.5751 6.90461C16.8815 6.93037 17.3306 7.07421 17.5852 7.54072C17.7754 7.88936 17.7603 8.24154 17.7163 8.4769C17.6716 8.71615 17.5787 8.93836 17.4842 9.12465C17.2945 9.49885 17.0058 9.90601 16.6904 10.3069C16.0588 11.1097 15.1758 12.0659 14.3301 12.9818L14.3087 13.0049C13.7153 13.6475 13.1407 14.2703 12.6522 14.834C13.3251 14.4434 14.0776 13.9738 14.8415 13.491C15.0068 13.3866 15.1728 13.2814 15.3384 13.1764C16.2935 12.5712 17.2363 11.9738 17.9711 11.5619C18.3891 11.3276 18.8127 11.1109 19.1609 11.0007C19.3038 10.9555 19.6082 10.8677 19.9384 10.9338C20.1345 10.9731 20.3943 11.0786 20.595 11.3284C20.7934 11.5753 20.8407 11.8471 20.8407 12.0394C20.8407 12.3578 20.7198 12.621 20.6356 12.7765C20.5411 12.9509 20.4204 13.1182 20.2986 13.27C20.0541 13.5744 19.7267 13.912 19.371 14.2563C18.9011 14.7112 18.3221 15.234 17.7298 15.7689C17.4307 16.0389 17.1282 16.312 16.8346 16.581C15.9336 17.4067 15.0986 18.2091 14.5302 18.8953C14.4872 18.9472 14.4465 18.9975 14.4081 19.0462C14.9518 18.7743 15.6088 18.3818 16.3427 17.9334C16.4365 17.8761 16.5313 17.818 16.627 17.7594C17.4711 17.2426 18.3808 16.6855 19.1978 16.2772C19.6541 16.0492 20.1199 15.8475 20.56 15.7242C20.9763 15.6077 21.5041 15.5216 22.0128 15.677C22.2753 15.7572 22.6035 15.9272 22.8157 16.2794C23.0307 16.6362 23.0223 17.0063 22.9655 17.2688C22.8658 17.7301 22.5553 18.1548 22.3006 18.4639C21.7442 19.1392 20.8474 19.9571 19.9883 20.7271C19.8647 20.8379 19.7415 20.948 19.6191 21.0573C19.2074 21.4253 18.8065 21.7837 18.44 22.123C18.929 21.8873 19.4754 21.644 19.9938 21.5044C20.5914 21.3436 21.5253 21.219 22.2427 21.8764C22.6499 22.2495 22.6775 22.8821 22.3043 23.2893C21.9407 23.6861 21.3305 23.7224 20.9228 23.3784C20.8839 23.3725 20.7675 23.3674 20.5135 23.4357C20.0906 23.5496 19.577 23.7903 18.9823 24.0843C18.9258 24.1122 18.8681 24.1409 18.8095 24.1701C18.307 24.4197 17.734 24.7045 17.2429 24.8594C16.97 24.9454 16.6109 25.03 16.2407 24.9895C15.8106 24.9423 15.3646 24.72 15.1033 24.2411C14.9041 23.876 14.9303 23.5085 14.9924 23.2583C15.0534 23.0123 15.1681 22.7937 15.277 22.6195C15.4961 22.269 15.8191 21.9006 16.1594 21.549C16.7518 20.9369 17.54 20.2328 18.2943 19.5589C18.4152 19.4509 18.5353 19.3437 18.6535 19.2377C19.0394 18.8918 19.4035 18.5617 19.7281 18.255C19.0873 18.5986 18.3857 19.028 17.6643 19.4695C17.5716 19.5262 17.4786 19.5832 17.3853 19.6401C16.4644 20.2028 15.4904 20.7889 14.6954 21.1126C14.3117 21.2689 13.8447 21.4185 13.389 21.4011C13.1447 21.3918 12.8542 21.3328 12.582 21.1552C12.2986 20.9702 12.1116 20.7064 12.0076 20.4207C11.7917 19.827 11.9751 19.2492 12.1594 18.8589C12.3569 18.4407 12.6593 18.0187 12.99 17.6195C13.3892 17.1375 13.8828 16.6263 14.4083 16.1162C13.7767 16.4998 13.1663 16.8537 12.6299 17.1285C12.1603 17.3691 11.6842 17.5827 11.2711 17.6877C11.0702 17.7388 10.8014 17.7868 10.52 17.75C10.2097 17.7094 9.79987 17.5466 9.56292 17.1124C9.37267 16.7638 9.38772 16.4116 9.43173 16.1762C9.47646 15.9369 9.56938 15.7147 9.66382 15.5284C9.85353 15.1542 10.1423 14.7471 10.4577 14.3461C11.0893 13.5433 11.9723 12.5871 12.818 11.6712L12.8393 11.6481C13.4044 11.0361 13.9526 10.4421 14.4255 9.89999C13.6647 10.3472 12.8008 10.8911 11.9138 11.4499L11.8872 11.4667C10.6538 12.2437 9.37608 13.0486 8.36428 13.5864C7.86314 13.8528 7.36645 14.087 6.94376 14.2091C6.73967 14.2681 6.4689 14.3267 6.18643 14.303C5.87996 14.2772 5.43087 14.1334 5.17632 13.6669C4.89583 13.1528 5.00912 12.6155 5.11372 12.2965C5.22966 11.9429 5.42655 11.5818 5.63989 11.2446C6.07035 10.5642 6.69672 9.78321 7.32188 9.03132C7.53619 8.77356 7.75025 8.51933 7.96035 8.26979C8.3822 7.76875 8.78814 7.28662 9.14835 6.83277C9.71313 6.12116 10.0356 5.63421 10.1277 5.38088C10.187 5.21802 10.1932 5.12615 10.1923 5.08825C10.1713 5.07506 10.1316 5.05468 10.0669 5.03596C9.97978 5.01076 9.88615 5 9.81413 5C9.26185 5 8.81413 4.55228 8.81413 4Z" fill="#315BE1"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81413 2C6.81413 1.44772 7.26185 1 7.81413 1C8.24965 1 8.96668 1.10961 9.51935 1.5894C9.81895 1.84949 10.0595 2.21244 10.152 2.67677C10.2419 3.12804 10.177 3.59792 10.0072 4.06458C9.78603 4.67262 9.2468 5.40593 8.71492 6.0761C8.33699 6.55228 7.89814 7.07357 7.46491 7.58821C7.25956 7.83214 7.05548 8.07457 6.85974 8.30999C6.4783 8.76875 6.12618 9.20356 5.82942 9.59924C6.70159 9.10922 7.75712 8.44478 8.84772 7.75771L8.87433 7.74094C10.1077 6.9639 11.3854 6.15895 12.3972 5.62119C12.8984 5.35484 13.3951 5.12061 13.8177 4.99846C14.0218 4.93947 14.2926 4.88087 14.5751 4.90461C14.8815 4.93037 15.3306 5.07421 15.5852 5.54072C15.7754 5.88936 15.7603 6.24154 15.7163 6.4769C15.6716 6.71615 15.5787 6.93836 15.4842 7.12465C15.2945 7.49885 15.0058 7.90601 14.6904 8.30692C14.0588 9.10972 13.1758 10.0659 12.3301 10.9818L12.3087 11.0049C11.7153 11.6475 11.1407 12.2703 10.6522 12.834C11.3251 12.4434 12.0776 11.9738 12.8415 11.491C13.0068 11.3866 13.1728 11.2814 13.3384 11.1764C14.2935 10.5712 15.2363 9.9738 15.9711 9.56192C16.3891 9.32757 16.8127 9.11086 17.1609 9.00073C17.3038 8.95554 17.6082 8.8677 17.9384 8.93382C18.1345 8.97311 18.3943 9.07864 18.595 9.32837C18.7934 9.57529 18.8407 9.8471 18.8407 10.0394C18.8407 10.3578 18.7198 10.621 18.6356 10.7765C18.5411 10.9509 18.4204 11.1182 18.2986 11.27C18.0541 11.5744 17.7267 11.912 17.371 12.2563C16.9011 12.7112 16.3221 13.234 15.7298 13.7689C15.4307 14.0389 15.1282 14.312 14.8346 14.581C13.9336 15.4067 13.0986 16.2091 12.5302 16.8953C12.4872 16.9472 12.4465 16.9975 12.4081 17.0462C12.9518 16.7743 13.6088 16.3818 14.3427 15.9334C14.4365 15.8761 14.5313 15.818 14.627 15.7594C15.4711 15.2426 16.3808 14.6855 17.1978 14.2772C17.6541 14.0492 18.1199 13.8475 18.56 13.7242C18.9763 13.6077 19.5041 13.5216 20.0128 13.677C20.2753 13.7572 20.6035 13.9272 20.8157 14.2794C21.0307 14.6362 21.0223 15.0063 20.9655 15.2688C20.8658 15.7301 20.5553 16.1548 20.3006 16.4639C19.7442 17.1392 18.8474 17.9571 17.9883 18.7271C17.8647 18.8379 17.7415 18.948 17.6191 19.0573C17.2074 19.4253 16.8065 19.7837 16.44 20.123C16.929 19.8873 17.4754 19.644 17.9938 19.5044C18.5914 19.3436 19.5253 19.219 20.2427 19.8764C20.6499 20.2495 20.6775 20.8821 20.3043 21.2893C19.9407 21.6861 19.3305 21.7224 18.9228 21.3784C18.8839 21.3725 18.7675 21.3674 18.5135 21.4357C18.0906 21.5496 17.577 21.7903 16.9823 22.0843C16.9258 22.1122 16.8681 22.1409 16.8095 22.1701C16.307 22.4197 15.734 22.7045 15.2429 22.8594C14.97 22.9454 14.6109 23.03 14.2407 22.9895C13.8106 22.9423 13.3646 22.72 13.1033 22.2411C12.9041 21.876 12.9303 21.5085 12.9924 21.2583C13.0534 21.0123 13.1681 20.7937 13.277 20.6195C13.4961 20.269 13.8191 19.9006 14.1594 19.549C14.7518 18.9369 15.54 18.2328 16.2943 17.5589C16.4152 17.4509 16.5353 17.3437 16.6535 17.2377C17.0394 16.8918 17.4035 16.5617 17.7281 16.255C17.0873 16.5986 16.3857 17.028 15.6643 17.4695C15.5716 17.5262 15.4786 17.5832 15.3853 17.6401C14.4644 18.2028 13.4904 18.7889 12.6954 19.1126C12.3117 19.2689 11.8447 19.4185 11.389 19.4011C11.1447 19.3918 10.8542 19.3328 10.582 19.1552C10.2986 18.9702 10.1116 18.7064 10.0076 18.4207C9.79168 17.827 9.97506 17.2492 10.1594 16.8589C10.3569 16.4407 10.6593 16.0187 10.99 15.6195C11.3892 15.1375 11.8828 14.6263 12.4083 14.1162C11.7767 14.4998 11.1663 14.8537 10.6299 15.1285C10.1603 15.3691 9.68424 15.5827 9.27105 15.6877C9.07021 15.7388 8.80135 15.7868 8.51997 15.75C8.20967 15.7094 7.79987 15.5466 7.56292 15.1124C7.37267 14.7638 7.38772 14.4116 7.43173 14.1762C7.47646 13.9369 7.56938 13.7147 7.66382 13.5284C7.85353 13.1542 8.14226 12.7471 8.45767 12.3461C9.08929 11.5433 9.97228 10.5871 10.818 9.67118L10.8393 9.64812C11.4044 9.03614 11.9526 8.44211 12.4255 7.89999C11.6647 8.34721 10.8008 8.89106 9.91379 9.44989L9.88717 9.46667C8.65377 10.2437 7.37608 11.0486 6.36428 11.5864C5.86314 11.8528 5.36645 12.087 4.94376 12.2091C4.73967 12.2681 4.4689 12.3267 4.18643 12.303C3.87996 12.2772 3.43087 12.1334 3.17632 11.6669C2.89583 11.1528 3.00912 10.6155 3.11372 10.2965C3.22966 9.94289 3.42655 9.5818 3.63989 9.24458C4.07035 8.56415 4.69672 7.78321 5.32188 7.03132C5.53619 6.77356 5.75025 6.51933 5.96035 6.26979C6.3822 5.76875 6.78814 5.28662 7.14835 4.83277C7.71313 4.12116 8.03555 3.63421 8.1277 3.38088C8.18695 3.21802 8.19321 3.12615 8.19225 3.08825C8.17134 3.07506 8.13156 3.05468 8.06687 3.03596C7.97978 3.01076 7.88615 3 7.81413 3C7.26185 3 6.81413 2.55228 6.81413 2Z" fill="#F0C8FA"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_32_1932">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
                </svg>
                    &nbsp;Find Offers
                </button>
                {:else}
                <button disabled on:click={findOffers} id="findButtonDisabled">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_32_1932)">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.81413 4C8.81413 3.44772 9.26185 3 9.81413 3C10.2497 3 10.9667 3.10961 11.5194 3.5894C11.819 3.84949 12.0595 4.21244 12.152 4.67677C12.2419 5.12804 12.177 5.59792 12.0072 6.06458C11.786 6.67262 11.2468 7.40593 10.7149 8.0761C10.337 8.55228 9.89814 9.07357 9.46491 9.58821C9.25956 9.83214 9.05548 10.0746 8.85974 10.31C8.4783 10.7687 8.12618 11.2036 7.82942 11.5992C8.70159 11.1092 9.75712 10.4448 10.8477 9.75771L10.8743 9.74094C12.1077 8.9639 13.3854 8.15895 14.3972 7.62119C14.8984 7.35484 15.3951 7.12061 15.8177 6.99846C16.0218 6.93947 16.2926 6.88087 16.5751 6.90461C16.8815 6.93037 17.3306 7.07421 17.5852 7.54072C17.7754 7.88936 17.7603 8.24154 17.7163 8.4769C17.6716 8.71615 17.5787 8.93836 17.4842 9.12465C17.2945 9.49885 17.0058 9.90601 16.6904 10.3069C16.0588 11.1097 15.1758 12.0659 14.3301 12.9818L14.3087 13.0049C13.7153 13.6475 13.1407 14.2703 12.6522 14.834C13.3251 14.4434 14.0776 13.9738 14.8415 13.491C15.0068 13.3866 15.1728 13.2814 15.3384 13.1764C16.2935 12.5712 17.2363 11.9738 17.9711 11.5619C18.3891 11.3276 18.8127 11.1109 19.1609 11.0007C19.3038 10.9555 19.6082 10.8677 19.9384 10.9338C20.1345 10.9731 20.3943 11.0786 20.595 11.3284C20.7934 11.5753 20.8407 11.8471 20.8407 12.0394C20.8407 12.3578 20.7198 12.621 20.6356 12.7765C20.5411 12.9509 20.4204 13.1182 20.2986 13.27C20.0541 13.5744 19.7267 13.912 19.371 14.2563C18.9011 14.7112 18.3221 15.234 17.7298 15.7689C17.4307 16.0389 17.1282 16.312 16.8346 16.581C15.9336 17.4067 15.0986 18.2091 14.5302 18.8953C14.4872 18.9472 14.4465 18.9975 14.4081 19.0462C14.9518 18.7743 15.6088 18.3818 16.3427 17.9334C16.4365 17.8761 16.5313 17.818 16.627 17.7594C17.4711 17.2426 18.3808 16.6855 19.1978 16.2772C19.6541 16.0492 20.1199 15.8475 20.56 15.7242C20.9763 15.6077 21.5041 15.5216 22.0128 15.677C22.2753 15.7572 22.6035 15.9272 22.8157 16.2794C23.0307 16.6362 23.0223 17.0063 22.9655 17.2688C22.8658 17.7301 22.5553 18.1548 22.3006 18.4639C21.7442 19.1392 20.8474 19.9571 19.9883 20.7271C19.8647 20.8379 19.7415 20.948 19.6191 21.0573C19.2074 21.4253 18.8065 21.7837 18.44 22.123C18.929 21.8873 19.4754 21.644 19.9938 21.5044C20.5914 21.3436 21.5253 21.219 22.2427 21.8764C22.6499 22.2495 22.6775 22.8821 22.3043 23.2893C21.9407 23.6861 21.3305 23.7224 20.9228 23.3784C20.8839 23.3725 20.7675 23.3674 20.5135 23.4357C20.0906 23.5496 19.577 23.7903 18.9823 24.0843C18.9258 24.1122 18.8681 24.1409 18.8095 24.1701C18.307 24.4197 17.734 24.7045 17.2429 24.8594C16.97 24.9454 16.6109 25.03 16.2407 24.9895C15.8106 24.9423 15.3646 24.72 15.1033 24.2411C14.9041 23.876 14.9303 23.5085 14.9924 23.2583C15.0534 23.0123 15.1681 22.7937 15.277 22.6195C15.4961 22.269 15.8191 21.9006 16.1594 21.549C16.7518 20.9369 17.54 20.2328 18.2943 19.5589C18.4152 19.4509 18.5353 19.3437 18.6535 19.2377C19.0394 18.8918 19.4035 18.5617 19.7281 18.255C19.0873 18.5986 18.3857 19.028 17.6643 19.4695C17.5716 19.5262 17.4786 19.5832 17.3853 19.6401C16.4644 20.2028 15.4904 20.7889 14.6954 21.1126C14.3117 21.2689 13.8447 21.4185 13.389 21.4011C13.1447 21.3918 12.8542 21.3328 12.582 21.1552C12.2986 20.9702 12.1116 20.7064 12.0076 20.4207C11.7917 19.827 11.9751 19.2492 12.1594 18.8589C12.3569 18.4407 12.6593 18.0187 12.99 17.6195C13.3892 17.1375 13.8828 16.6263 14.4083 16.1162C13.7767 16.4998 13.1663 16.8537 12.6299 17.1285C12.1603 17.3691 11.6842 17.5827 11.2711 17.6877C11.0702 17.7388 10.8014 17.7868 10.52 17.75C10.2097 17.7094 9.79987 17.5466 9.56292 17.1124C9.37267 16.7638 9.38772 16.4116 9.43173 16.1762C9.47646 15.9369 9.56938 15.7147 9.66382 15.5284C9.85353 15.1542 10.1423 14.7471 10.4577 14.3461C11.0893 13.5433 11.9723 12.5871 12.818 11.6712L12.8393 11.6481C13.4044 11.0361 13.9526 10.4421 14.4255 9.89999C13.6647 10.3472 12.8008 10.8911 11.9138 11.4499L11.8872 11.4667C10.6538 12.2437 9.37608 13.0486 8.36428 13.5864C7.86314 13.8528 7.36645 14.087 6.94376 14.2091C6.73967 14.2681 6.4689 14.3267 6.18643 14.303C5.87996 14.2772 5.43087 14.1334 5.17632 13.6669C4.89583 13.1528 5.00912 12.6155 5.11372 12.2965C5.22966 11.9429 5.42655 11.5818 5.63989 11.2446C6.07035 10.5642 6.69672 9.78321 7.32188 9.03132C7.53619 8.77356 7.75025 8.51933 7.96035 8.26979C8.3822 7.76875 8.78814 7.28662 9.14835 6.83277C9.71313 6.12116 10.0356 5.63421 10.1277 5.38088C10.187 5.21802 10.1932 5.12615 10.1923 5.08825C10.1713 5.07506 10.1316 5.05468 10.0669 5.03596C9.97978 5.01076 9.88615 5 9.81413 5C9.26185 5 8.81413 4.55228 8.81413 4Z" fill="#315BE1"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.81413 2C6.81413 1.44772 7.26185 1 7.81413 1C8.24965 1 8.96668 1.10961 9.51935 1.5894C9.81895 1.84949 10.0595 2.21244 10.152 2.67677C10.2419 3.12804 10.177 3.59792 10.0072 4.06458C9.78603 4.67262 9.2468 5.40593 8.71492 6.0761C8.33699 6.55228 7.89814 7.07357 7.46491 7.58821C7.25956 7.83214 7.05548 8.07457 6.85974 8.30999C6.4783 8.76875 6.12618 9.20356 5.82942 9.59924C6.70159 9.10922 7.75712 8.44478 8.84772 7.75771L8.87433 7.74094C10.1077 6.9639 11.3854 6.15895 12.3972 5.62119C12.8984 5.35484 13.3951 5.12061 13.8177 4.99846C14.0218 4.93947 14.2926 4.88087 14.5751 4.90461C14.8815 4.93037 15.3306 5.07421 15.5852 5.54072C15.7754 5.88936 15.7603 6.24154 15.7163 6.4769C15.6716 6.71615 15.5787 6.93836 15.4842 7.12465C15.2945 7.49885 15.0058 7.90601 14.6904 8.30692C14.0588 9.10972 13.1758 10.0659 12.3301 10.9818L12.3087 11.0049C11.7153 11.6475 11.1407 12.2703 10.6522 12.834C11.3251 12.4434 12.0776 11.9738 12.8415 11.491C13.0068 11.3866 13.1728 11.2814 13.3384 11.1764C14.2935 10.5712 15.2363 9.9738 15.9711 9.56192C16.3891 9.32757 16.8127 9.11086 17.1609 9.00073C17.3038 8.95554 17.6082 8.8677 17.9384 8.93382C18.1345 8.97311 18.3943 9.07864 18.595 9.32837C18.7934 9.57529 18.8407 9.8471 18.8407 10.0394C18.8407 10.3578 18.7198 10.621 18.6356 10.7765C18.5411 10.9509 18.4204 11.1182 18.2986 11.27C18.0541 11.5744 17.7267 11.912 17.371 12.2563C16.9011 12.7112 16.3221 13.234 15.7298 13.7689C15.4307 14.0389 15.1282 14.312 14.8346 14.581C13.9336 15.4067 13.0986 16.2091 12.5302 16.8953C12.4872 16.9472 12.4465 16.9975 12.4081 17.0462C12.9518 16.7743 13.6088 16.3818 14.3427 15.9334C14.4365 15.8761 14.5313 15.818 14.627 15.7594C15.4711 15.2426 16.3808 14.6855 17.1978 14.2772C17.6541 14.0492 18.1199 13.8475 18.56 13.7242C18.9763 13.6077 19.5041 13.5216 20.0128 13.677C20.2753 13.7572 20.6035 13.9272 20.8157 14.2794C21.0307 14.6362 21.0223 15.0063 20.9655 15.2688C20.8658 15.7301 20.5553 16.1548 20.3006 16.4639C19.7442 17.1392 18.8474 17.9571 17.9883 18.7271C17.8647 18.8379 17.7415 18.948 17.6191 19.0573C17.2074 19.4253 16.8065 19.7837 16.44 20.123C16.929 19.8873 17.4754 19.644 17.9938 19.5044C18.5914 19.3436 19.5253 19.219 20.2427 19.8764C20.6499 20.2495 20.6775 20.8821 20.3043 21.2893C19.9407 21.6861 19.3305 21.7224 18.9228 21.3784C18.8839 21.3725 18.7675 21.3674 18.5135 21.4357C18.0906 21.5496 17.577 21.7903 16.9823 22.0843C16.9258 22.1122 16.8681 22.1409 16.8095 22.1701C16.307 22.4197 15.734 22.7045 15.2429 22.8594C14.97 22.9454 14.6109 23.03 14.2407 22.9895C13.8106 22.9423 13.3646 22.72 13.1033 22.2411C12.9041 21.876 12.9303 21.5085 12.9924 21.2583C13.0534 21.0123 13.1681 20.7937 13.277 20.6195C13.4961 20.269 13.8191 19.9006 14.1594 19.549C14.7518 18.9369 15.54 18.2328 16.2943 17.5589C16.4152 17.4509 16.5353 17.3437 16.6535 17.2377C17.0394 16.8918 17.4035 16.5617 17.7281 16.255C17.0873 16.5986 16.3857 17.028 15.6643 17.4695C15.5716 17.5262 15.4786 17.5832 15.3853 17.6401C14.4644 18.2028 13.4904 18.7889 12.6954 19.1126C12.3117 19.2689 11.8447 19.4185 11.389 19.4011C11.1447 19.3918 10.8542 19.3328 10.582 19.1552C10.2986 18.9702 10.1116 18.7064 10.0076 18.4207C9.79168 17.827 9.97506 17.2492 10.1594 16.8589C10.3569 16.4407 10.6593 16.0187 10.99 15.6195C11.3892 15.1375 11.8828 14.6263 12.4083 14.1162C11.7767 14.4998 11.1663 14.8537 10.6299 15.1285C10.1603 15.3691 9.68424 15.5827 9.27105 15.6877C9.07021 15.7388 8.80135 15.7868 8.51997 15.75C8.20967 15.7094 7.79987 15.5466 7.56292 15.1124C7.37267 14.7638 7.38772 14.4116 7.43173 14.1762C7.47646 13.9369 7.56938 13.7147 7.66382 13.5284C7.85353 13.1542 8.14226 12.7471 8.45767 12.3461C9.08929 11.5433 9.97228 10.5871 10.818 9.67118L10.8393 9.64812C11.4044 9.03614 11.9526 8.44211 12.4255 7.89999C11.6647 8.34721 10.8008 8.89106 9.91379 9.44989L9.88717 9.46667C8.65377 10.2437 7.37608 11.0486 6.36428 11.5864C5.86314 11.8528 5.36645 12.087 4.94376 12.2091C4.73967 12.2681 4.4689 12.3267 4.18643 12.303C3.87996 12.2772 3.43087 12.1334 3.17632 11.6669C2.89583 11.1528 3.00912 10.6155 3.11372 10.2965C3.22966 9.94289 3.42655 9.5818 3.63989 9.24458C4.07035 8.56415 4.69672 7.78321 5.32188 7.03132C5.53619 6.77356 5.75025 6.51933 5.96035 6.26979C6.3822 5.76875 6.78814 5.28662 7.14835 4.83277C7.71313 4.12116 8.03555 3.63421 8.1277 3.38088C8.18695 3.21802 8.19321 3.12615 8.19225 3.08825C8.17134 3.07506 8.13156 3.05468 8.06687 3.03596C7.97978 3.01076 7.88615 3 7.81413 3C7.26185 3 6.81413 2.55228 6.81413 2Z" fill="#F0C8FA"/>
                            </g>
                            <defs>
                            <clipPath id="clip0_32_1932">
                            <rect width="24" height="24" fill="white"/>
                            </clipPath>
                            </defs>
                    </svg>
                        &nbsp;Find Offers
                    </button>
                {/if}
                
            </div>
        {:else}
            {#await offers}
            <div id="loadingContainer">
                <div class="svg-loader">
                  <svg class="svg-container" height="50" width="50" viewBox="0 0 100 100">
                    <circle class="loader-svg bg" cx="50" cy="50" r="45"></circle>
                    <circle class="loader-svg animate" cx="50" cy="50" r="45"></circle>
                  </svg>
                </div>
                </div>
            {:then}
            {#if !offerId}
                {#if !offers.length}
                No offers found
                {:else}
                    <p id="explanation"> I Want To {offerType == "SELL" ? 'Buy' : 'Sell'} {$tokenRecords[actualOfferTokenId].ticker}:</p>
                    {#each offers as offer}
                    {#if !$payments.map(p=>p.swap.signalTXID).includes(offer.txid) && !$historyArray.map(tx=>tx.inputs[0].prevOut.txid).includes(offer.inputs[0].prevOut.txid)}
                    <button on:click={()=> offerId = offer.txid} class="offerItemButton">
                    <div class="offerItem">
                        <div id="logoContainer">
                            <span>  <img alt="token icon" src={"https://etoken-icons.s3.us-west-2.amazonaws.com/128/"+actualOfferTokenId+'.png'}  onerror="this.onerror=null; this.remove();">      
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"
                                    class="svelte-1vm9ta5"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path>
                                    </svg>
                            </span>
                        </div>
                        <div>
                        <div class="offerTop">
                            <span><span id="tradefromtrader"><span>
                                {offer.swap.offer == 'BUY' ? 'Sell' : 'Buy'} <span class="tokenAmount">{$tokenRecords[offer.swap.tokenId].ticker}</span>{offer.swap.offer == 'BUY' ? ' to Buyer' : ' from Seller'}</span>
                                {#if offer.swap.active}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.67215 16.7894C9.22159 16.47 9.11525 15.8458 9.43464 15.3953C10.1009 14.4554 10.5 13.2812 10.5 12C10.5 10.7189 10.1009 9.54465 9.43464 8.60474C9.11525 8.15417 9.22159 7.53 9.67215 7.21061C10.1227 6.89122 10.7469 6.99756 11.0663 7.44812C11.9692 8.72192 12.5 10.2994 12.5 12C12.5 13.7006 11.9692 15.2781 11.0663 16.5519C10.7469 17.0025 10.1227 17.1088 9.67215 16.7894Z" fill="#1A78F6"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.11 19.7773C11.6856 19.4238 11.6282 18.7933 11.9816 18.3689C13.3895 16.6787 14.25 14.4509 14.25 12C14.25 9.54909 13.3895 7.32131 11.9816 5.63109C11.6282 5.20673 11.6856 4.57618 12.11 4.22271C12.5343 3.86924 13.1649 3.92671 13.5184 4.35106C15.2223 6.39671 16.25 9.07626 16.25 12C16.25 14.9237 15.2223 17.6033 13.5184 19.6489C13.1649 20.0733 12.5343 20.1307 12.11 19.7773Z" fill="#1A78F6"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5848 22.7466C14.1724 22.3792 14.136 21.7471 14.5034 21.3348C16.6666 18.9068 18 15.6239 18 12C18 8.37604 16.6666 5.09322 14.5034 2.66521C14.136 2.25285 14.1724 1.62074 14.5848 1.25335C14.9971 0.885953 15.6293 0.922405 15.9966 1.33476C18.483 4.12545 20 7.88057 20 12C20 16.1194 18.483 19.8745 15.9966 22.6652C15.6292 23.0776 14.9971 23.114 14.5848 22.7466Z" fill="#1A78F6"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12Z" fill="#1A78F6"/>
                                </svg>

                                {/if}</span>
                                {offer.swap.offer == 'BUY' ? 'Sell' : 'Buy'} <span class="tokenAmount">{offer.swap.normalAmount.toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[actualOfferTokenId].decimals})} {$tokenRecords[offer.swap.tokenId].ticker}</span> at <span class="amount">{offer.swap.realRate.toLocaleString()} XEC</span>
                                {#if (offer.swap.realRate * $price) > .01}
                                <span class="fiatAmount">(${(offer.swap.realRate * $price).toFixed(2)})</span>
                                {/if}
                                per {$tokenRecords[actualOfferTokenId].ticker}
                            </span>
                        </div>
                        {#if offer.swap.minimum}
                        <div class='offerBottom'>
                            <span class="minimum">Minimum: {offer.swap.minimum.toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[offer.swap.tokenId].decimals})} {$tokenRecords[offer.swap.tokenId].ticker}</span>
                        </div>
                        {/if}
                        <div></div>    
                    </div>
                    </button>
                    {/if}
                    {/each}
                {/if}
                <div class="backDiv"><button id="back" class="back" on:click={clearOffers}>back</button></div>
            {:else}
            {#each offers as offer}
            {#if offer.txid == offerId}
            <div id="offer">
                <div id="logoContainer">
                    <span>  <img alt="token icon" src={"https://etoken-icons.s3.us-west-2.amazonaws.com/512/"+actualOfferTokenId+'.png'}  onerror="this.onerror=null; this.remove();">      
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-1vm9ta5"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC" class="svelte-1vm9ta5"></path>
                        </svg>
                    </span>
                </div>
                <div id="offerBox">
                <div id="offerDetails">
                    <span id="offerDetailFrom"><span>{offer.swap.offer == 'BUY' ? 'Sell' : 'Buy'} <span class="tokenAmount">{$tokenRecords[offer.swap.tokenId].ticker}</span>{offer.swap.offer == 'BUY' ? ' to Buyer' : ' from Seller'}  </span>                               
                    {#if offer.swap.active}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.67215 16.7894C9.22159 16.47 9.11525 15.8458 9.43464 15.3953C10.1009 14.4554 10.5 13.2812 10.5 12C10.5 10.7189 10.1009 9.54465 9.43464 8.60474C9.11525 8.15417 9.22159 7.53 9.67215 7.21061C10.1227 6.89122 10.7469 6.99756 11.0663 7.44812C11.9692 8.72192 12.5 10.2994 12.5 12C12.5 13.7006 11.9692 15.2781 11.0663 16.5519C10.7469 17.0025 10.1227 17.1088 9.67215 16.7894Z" fill="#1A78F6"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.11 19.7773C11.6856 19.4238 11.6282 18.7933 11.9816 18.3689C13.3895 16.6787 14.25 14.4509 14.25 12C14.25 9.54909 13.3895 7.32131 11.9816 5.63109C11.6282 5.20673 11.6856 4.57618 12.11 4.22271C12.5343 3.86924 13.1649 3.92671 13.5184 4.35106C15.2223 6.39671 16.25 9.07626 16.25 12C16.25 14.9237 15.2223 17.6033 13.5184 19.6489C13.1649 20.0733 12.5343 20.1307 12.11 19.7773Z" fill="#1A78F6"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5848 22.7466C14.1724 22.3792 14.136 21.7471 14.5034 21.3348C16.6666 18.9068 18 15.6239 18 12C18 8.37604 16.6666 5.09322 14.5034 2.66521C14.136 2.25285 14.1724 1.62074 14.5848 1.25335C14.9971 0.885953 15.6293 0.922405 15.9966 1.33476C18.483 4.12545 20 7.88057 20 12C20 16.1194 18.483 19.8745 15.9966 22.6652C15.6292 23.0776 14.9971 23.114 14.5848 22.7466Z" fill="#1A78F6"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12Z" fill="#1A78F6"/>
    </svg>

                                {/if}</span>
                    <span>
                        {offer.swap.offer == 'BUY' ? 'Sell' : 'Buy'} <span class="tokenAmount">{offer.swap.normalAmount.toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[offer.swap.tokenId].decimals})} {$tokenRecords[offer.swap.tokenId].ticker} </span>at <span class="amount">{offer.swap.realRate.toLocaleString()}  XEC </span>
                        {#if (offer.swap.realRate * $price) > .01}
                        <span class="fiatAmount">(${(offer.swap.realRate * $price).toFixed(2)})</span>
                        {/if}
                         per <span class="tokenAmount">{$tokenRecords[actualOfferTokenId].ticker}</span>.

                         {#if offer.swap.minimum}
                         &nbsp;Minimum: <span class="tokenAmount">{offer.swap.minimum.toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[offer.swap.tokenId].decimals})} {$tokenRecords[actualOfferTokenId].ticker}</span> 
                         {/if}
                    </span>
                    {#if offer.swap.minimum}
                    <span>Amount to take: <input id="portion" type="number" bind:value={portion}> {$tokenRecords[offer.swap.tokenId].ticker}</span>
                    <span>Total: <span class="amount">{Number((offer.swap.realRate*portion).toFixed(2)).toLocaleString()} XEC</span><span class="fiatAmount">  (${(offer.swap.realRate * portion * $price).toFixed(2)})</span></span>
                    {:else}
                    <span>Total: <span class="amount">{(offer.swap.realRate*offer.swap.normalAmount).toLocaleString()} XEC</span><span class="fiatAmount">  (${(offer.swap.realRate * offer.swap.normalAmount * $price).toFixed(2)})</span> </span>
                    {/if}
                </div>
                {#if response}
                <div id="paymentResponse"><span>{response}</span></div>
                {/if}
                <div id="payment">
                {#if !response && (!offer.swap.minimum || !(offer.swap.minimum > portion || portion > offer.swap.normalAmount))}
                <button on:click={()=> takeOffer(offer)} id="payButton">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.9 16.01C21.97 15.85 22 15.68 22 15.5V8H2V15.5C2 16.33 2.67 17 3.5 17H12C12 14.24 14.24 12 17 12C19.42 12 21.44 13.72 21.9 16.01Z" fill="#F0C8FA" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M22 8H2V4.5C2 3.67 2.67 3 3.5 3H20.5C21.33 3 22 3.67 22 4.5V8Z" fill="#315BE1" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 7H2V8H22V7Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round"/>
                        <path d="M17 22C19.7614 22 22 19.7614 22 17C22 14.2386 19.7614 12 17 12C14.2386 12 12 14.2386 12 17C12 19.7614 14.2386 22 17 22Z" fill="#315BE1" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.6001 16.3499L16.4001 18.1499L19.4001 15.1499" stroke="#FFFEFC" stroke-miterlimit="10"/>
                    </svg>
                    &nbsp;Take Offer
                </button>
                {:else}
                <button disabled id="payButtonDisabled">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.9 16.01C21.97 15.85 22 15.68 22 15.5V8H2V15.5C2 16.33 2.67 17 3.5 17H12C12 14.24 14.24 12 17 12C19.42 12 21.44 13.72 21.9 16.01Z" fill="#F0C8FA" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M22 8H2V4.5C2 3.67 2.67 3 3.5 3H20.5C21.33 3 22 3.67 22 4.5V8Z" fill="#315BE1" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 7H2V8H22V7Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round"/>
                        <path d="M17 22C19.7614 22 22 19.7614 22 17C22 14.2386 19.7614 12 17 12C14.2386 12 12 14.2386 12 17C12 19.7614 14.2386 22 17 22Z" fill="#315BE1" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.6001 16.3499L16.4001 18.1499L19.4001 15.1499" stroke="#FFFEFC" stroke-miterlimit="10"/>
                    </svg>
                    &nbsp;Take Offer
                </button>
                {/if}
                </div>
                </div>
            </div>
            {/if}
            {/each}
            <div class="backDiv"><button id="back" class="back" on:click={()=>offerId = null}>back</button></div>
            {/if}
            {/await}
        {/if}
    {/if}
{/if}

</div>

{:else}
<div id="loadingContainer">
    <div class="svg-loader">
      <svg class="svg-container" height="50" width="50" viewBox="0 0 100 100">
        <circle class="loader-svg bg" cx="50" cy="50" r="45"></circle>
        <circle class="loader-svg animate" cx="50" cy="50" r="45"></circle>
      </svg>
    </div>
    </div>
{/if}

<style>
    #main{
        padding:10px;
        display: flex;
        flex-direction: column;
        padding-top: 0;
        
    }

    #tradefromtrader{
        display: flex;
        align-items: center;
    }

    #tradefromtrader svg{
        height: 20px;
        width: 20px;
        margin-left: 2px;
    }

    img{
        height:32px;
        width: 32px;
        z-index: 2;
    }

    p{
    margin: 20px 50px;
    }

    #explanation{
        margin-bottom: 5px;
    }

    #paymentResponse{
        display: flex;
        justify-content: center;
    }

    #payment{
        display: flex;
        flex-direction: row-reverse;
        margin-top: 20px;
        margin-right: 10px;
    }

    #payButton, #payButtonDisabled{
        color: #FFFEFC;
        background-color: #0E76FD;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        display: flex;
        align-items: center;
    }

    #offer{
        background: #FFFEFC;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        border-style: solid;
        border-width: 1px;
        border-color: #529DFF;
        padding: 25px;
        margin-bottom: 10px;
        display: flex;
    }

    #logoContainer{
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        margin-right: 10px;
    }

    #logoContainer span,  .logoSpan{
        background-color: #25282D;
        border-radius: 40px;
        overflow:hidden;
        height: 32px;
        width: 32px;
       /* display: flex;
        align-items: center;
        justify-content: center;*/
        display:grid;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        
    }
    #logoContainer span *, .logoSpan *{
        grid-row: 1;
        grid-column: 1;
    }

    #logoContainer span img + svg, .logoSpan img + svg{
        opacity: 0;
    }

    #logoContainer span svg, .logoSpan svg{
        height: 22px;
        width: 22px;
        margin: 5px;
        z-index: 1;
    }



    #offerDetails{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    #offerDetailFrom{
        display: flex;
        align-items: center;
    }

    #offerDetails span{
        margin-top: 5px;
        margin-bottom: 5px;
    }

    #offerDetails span{
        text-align: left;
    }

    #offerDetails span input{
        /*color: #E88BFF;*/
    }

    #offerBox{
        flex-grow: 1;
    }

    #portion{
        border:none;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: 5px;
    }

    #createButtons, #findButtons{
        margin-top: 10px;
        display: flex;
        justify-content: right;
    }

    #createButtons button, #findButtons button, .back{
        margin: 0px 10px;
        display: flex;
        align-items: center;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
    }

    .back, #back, #createButtonDisabled, #findButtonDisabled, #payButtonDisabled{
        color: #AAABB1;
        background-color:#F3F4F6;
    }

    .backDiv{
        display: flex;
        flex-direction: row-reverse;
    }

    #createButton, #findButton{
        background-color: #0E76FD;
        color: #FFFFFF;
    }


    #create, #find{
        font-size: 18px;
    }


    #amount, #rate, #partialDiv{
        margin-top: 10px;
    }

    #amount span, #rate, #partialDiv{
        display: flex;
        align-items: center;
        background: #FEFEFE;
        filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1));
        border-radius: 40px;
        padding: 10px;
    }

    #amount span{
        padding-right: 20px;
    }


    #partialDiv{
        flex-direction: column;
        align-items: flex-start;
        font: 18px;
        padding-left: 15px;
    }

    #partial{
        width: 20px;
        height: 20px;
    }

    #partialSpan{
        display: flex;
        align-items: center;
    }

    #minimum{
        display: flex;
        align-items: center;
        width: 95%;
    }

    #partial{
        flex-grow: 1;
    }

    #amount input, #rate input, #minimumInput{
        width: 0;
        flex-grow: 1;
        height: 30px;
        border: none;
        padding-left: 15px;
        padding-right: 10px;
        font-size: 20px;
    }

    #amount #svg{
        background-color: #25282D;
        height: 32px;
        width: 32px;
        box-shadow: 2px 2px 20px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
        border-radius: 50px;
        display: flex;
        padding: 3px;
        margin-left: 5px;
    }
    #max, #xecToken, #partialSpan, #minimum{
        padding: 5px;
        margin: 5px;
        background-color: #D9D9D9;
        border-radius: 40px;
        color: white;
    }

    #partialSpan, #minimum{
        color:#AAABB1;
        background-color: white;
    }

    #svg svg{
        height: 24px;
        width: 24px;
        margin: auto;
    }


    #type{
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 20px;
    }

    #selectToken{
        display:flex;
        flex-wrap: wrap;
    }

    label{
        color:#AAABB1;
    }

    #type label{
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        padding-right: 20px;
        background: #F3F4F6;
        border-radius: 40px;
        margin: 10px;
        font-size: 20px;
    }

    #selectToken{
        background: #FFFEFC;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: 10px;
    }

    #selectToken label{
        background: #F3F4F6;
        border-radius: 40px;
        margin: 10px;
        padding: 5px;
        padding-right: 10px;
    }

    #selectToken #tokenid{
        margin: 20px;
    }

    #selectToken span#tokenid{
        display: flex;
        align-items: center;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        width: 100%;
        padding-left: 10px;
    }
    
    input#tokenid{
        border:none;
        flex-grow: 1;
        font-size: 20px;
    }

    input#tokenid:focus{
        outline:none;
    }


    :checked + span { 
        color: #0E76FD;
    }


    #swapitems{
        height: auto;
        overflow: auto;
        position: fixed;
        top: 70px;
        /*bottom: 10px;*/
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 65vh;
    }

    #buttons{
        display: flex;
        justify-content: center;
        margin-bottom: 25px;
        position: fixed;
        transform: translateX(-50%);
        left: 50%;
        max-width: 90vw;
        width: 100%;
    }

    #buttons button{
        margin: 0 10px;
        color:white;
        background-color: #25282D;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        display: flex;
        align-items: center;
        padding: 7px 15px;
    }

    #buttons button svg{
        margin: 0 5px 0px 0px;
    }

    .swapitem, .offerItem{
        background: #FFFEFC;
        box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: 15px;
        margin: 10px;
        height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .top{
        display:inline-flex;
        align-items: center;
    }

    .top > span{
        flex-grow:1;
        margin-right:15px;
        word-wrap: break-word;
    }

    span.logoSpan{
        flex-grow: 0;
        flex-shrink: 0;
        margin-right: 5px;
        margin-left: 15px;
    }

    .offerItem{
        height: auto;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        border-radius: 30px;
        transition: .2s;
        flex-direction: row;
    }

    .offerTop{
        text-align: left;
        display: flex;
        justify-content: center;
    }

    .offerItem div{
        flex-grow: 1;
    }

    #logoContainer{
        flex-grow:0;
    }

   .offerItem:hover{
        outline-style: solid;
        outline-width: 2.5px;
        outline-color: #0E76FD;
    }

    .offerBottom{
        display: flex;
        flex-direction: row-reverse;
        margin-top: 10px;
        margin-right: 20px;
    }

    .offerItemButton{
        background-color: white;
        padding: 0;
    }

    #swapitems::-webkit-scrollbar {
    display: none;
    }

    .swapType, .minimum{
        color: #AAABB1;
        background-color: #F3F4F6;
        padding: 0 10px;
        border-radius: 20px;
    }

    .bottom{
        display: flex;
        justify-content: space-between;
    }
    
    .bottom, .right, .left{
        display: flex;
        align-items: center
    } 

    .right button{
        margin-right: 20px;
        width: 50px;
        padding-top: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #F3F4F6;
        transition: .4s;
    }

    /*.right button svg{
        height: 20px;
        width: 20px;
        margin-bottom: 1px;
    }*/

    .right button:hover{
        box-shadow: 0px 0px 20px rgba(14, 118, 253, 0.5);
        background-color: #0E76FD;
    }

    .amount{
        color: #0E76FD;
    }
    
    .tokenAmount{
        color: #d33ff7;
    }

    .fiatAmount{
        color: #AAABB1;
    }

    .left{
        margin-left: 20px;
    }

    .delete{
        padding: 5px 8px;
        margin: 5px;
        border-radius: 20px;
    }

    #learn button{
        margin-top: 30px;
        color: #0E76FD;
        background-color: white;
    }

    #info{
        text-align: left;
    }


    #back{
        transition: .4s;
        margin: 0 10px 20px 0;
        padding: 10px 15px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    }

    #back:hover{
        color:#FFFEFC;
        background-color: #0E76FD;
    }

</style>