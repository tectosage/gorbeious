<script>
    import {tokenCoins, tokenRecords, view, transactionPromise, copied, reloading} from './lib/stores'
    import {BigNumber} from 'bignumber.js'
    import {sendToken, copyContent} from './lib/functions'
    import { fly, fade } from 'svelte/transition';
    import { keys, values } from 'bcash/lib/hd/words/chinese-simplified';

    let tokenFunds
    let viewedTokenId
    let address
    let amount
    let sendPromise

    $: if($view == 'tokens'){
        viewedTokenId = null
        sendPromise = null
        address = null
        amount = null
    }

    $: if(viewedTokenId){
        view.set('tokenInfo')
        console.log('running viewed tokens')
    }

    $:{
        tokenFunds = {}
        Object.keys($tokenCoins).forEach(function(tokenId, index) {
            let amount = new BigNumber(0)
            $tokenCoins[tokenId].map(a=> amount = amount.plus(a.slp.value))
            if(amount.gt(new BigNumber(0))){
                tokenFunds[tokenId] = amount
            } 
        });
    }

    async function send(){
        console.log('sending token')
        let result = await sendToken(viewedTokenId, amount, address)
        sendPromise = result[0]
        await sendPromise
    }
</script>
{#if !$reloading}
{#if $view == 'tokens'}
    {#each Object.keys(tokenFunds) as tokenId}
    <button class="token" on:click={()=> viewedTokenId = tokenId}>
        <!--<div></div>
        <div>
        <span id="name">{$tokenRecords[tokenId].name}</span>
        <br>
        text
            {#key tokenId}
            <span id="amount">
                {(tokenFunds[tokenId] / (10 ** $tokenRecords[tokenId].decimals)).toFixed($tokenRecords[tokenId].decimals)} {$tokenRecords[tokenId].ticker}
            </span>
            {/key}
        </div>-->
        <div class="icon"><span><img alt="token icon" src={"https://etoken-icons.s3.us-west-2.amazonaws.com/512/"+tokenId+'.png'}  onerror="this.onerror=null; this.remove();"><span class="tick">{$tokenRecords[tokenId].ticker.slice(0,1).toUpperCase()}</span></span></div>

        <div class="tokenShort">
            <div><span>{$tokenRecords[tokenId].name}</span><span>{(tokenFunds[tokenId] / (10 ** $tokenRecords[tokenId].decimals)).toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[tokenId].decimals})} {$tokenRecords[tokenId].ticker}</span></div>
            <div class='tokenId'>token id: {tokenId.slice(0,3)}...{tokenId.slice(-5)}</div>
        </div>
    </button>
    {/each}
    {#if Object.keys(tokenFunds).length == 0}
    <p>Your eTokens will appear here</p>
    {/if}
{:else}
<!--
<div class="input"><span class="input">To: <input size="5" bind:value={address}></span></div>
<div class="input"><span class="input">Amount: <input type=number bind:value={amount}><button on:click={()=> amount = tokenFunds[viewedTokenId] / (10 ** $tokenRecords[viewedTokenId].decimals)}>Max</button>{$tokenRecords[viewedTokenId].ticker}</span></div>
<button on:click={send}>Send!</button><br>


    <div id="resp">
        {#if sendPromise}
        {#await sendPromise}
        Loading
        {:then result}
        {#if result.txid}
        <span>Success!
            txid:{result.txid}</span>
        {:else}
        {result}
        {/if}
        {:catch error}
        SOMETHING WENT WRONG
        {error}
        {/await}
    {/if}
    </div>

<br>
<div class="tokenInfo">
Balance: {tokenFunds[viewedTokenId] / (10 ** $tokenRecords[viewedTokenId].decimals)} {$tokenRecords[viewedTokenId].ticker}<br>
Name: {$tokenRecords[viewedTokenId].name}<br>
Ticker: {$tokenRecords[viewedTokenId].ticker}<br>
Decimal Places: {$tokenRecords[viewedTokenId].decimals}<br>
Token ID: <button class= "txid" on:click={()=> copyContent(viewedTokenId)}>{viewedTokenId.slice(0,7)}..{viewedTokenId.slice(-7)}⎘</button><br>
URL: {$tokenRecords[viewedTokenId].uri}<br>
Total Minted: {$tokenRecords[viewedTokenId].totalMinted / (10** $tokenRecords[viewedTokenId].decimals)} {$tokenRecords[viewedTokenId].ticker}<br>
Total Burned: {$tokenRecords[viewedTokenId].totalBurned / (10** $tokenRecords[viewedTokenId].decimals)} {$tokenRecords[viewedTokenId].ticker}

</div>
-->
<div id="main">
    <div id="to"><input size="5" placeholder="to:" bind:value={address}></div>
    <div id="amount"><span id='marginalized'><span id="svg">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 7.89009V10.8901C6.8252 11.5838 7.22569 12.2566 7.98769 12.7763C8.89369 13.3943 10.3509 13.8151 12.0002 13.8151C13.6494 13.8151 15.1067 13.3943 16.0127 12.7763C16.7747 12.2566 17.1752 11.5838 17.1752 10.8901V7.89009C17.1752 7.51734 16.8729 7.21509 16.5002 7.21509C16.1274 7.21509 15.8252 7.51734 15.8252 7.89009V10.8901C15.8252 11.1908 15.5822 11.4361 15.2514 11.6611C14.5194 12.1606 13.3329 12.4651 12.0002 12.4651C10.6674 12.4651 9.48094 12.1606 8.74894 11.6611C8.41819 11.4361 8.17519 11.1908 8.17519 10.8901V7.89009C8.17519 7.51734 7.87294 7.21509 7.50019 7.21509C7.12744 7.21509 6.8252 7.51734 6.8252 7.89009Z" fill="#FFFEFC"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.8252 10.8901V13.8901C6.8252 14.5838 7.22569 15.2566 7.98769 15.7763C8.89369 16.3943 10.3509 16.8151 12.0002 16.8151C13.6494 16.8151 15.1067 16.3943 16.0127 15.7763C16.7747 15.2566 17.1752 14.5838 17.1752 13.8901V10.8901C17.1752 10.5173 16.8729 10.2151 16.5002 10.2151C16.1274 10.2151 15.8252 10.5173 15.8252 10.8901V13.8901C15.8252 14.1908 15.5822 14.4361 15.2514 14.6611C14.5194 15.1606 13.3329 15.4651 12.0002 15.4651C10.6674 15.4651 9.48094 15.1606 8.74894 14.6611C8.41819 14.4361 8.17519 14.1908 8.17519 13.8901V10.8901C8.17519 10.5173 7.87294 10.2151 7.50019 10.2151C7.12744 10.2151 6.8252 10.5173 6.8252 10.8901Z" fill="#FFFEFC"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0002 4.96509C10.3517 4.96509 8.89444 5.38584 7.98844 6.00384C7.22644 6.52359 6.8252 7.19634 6.8252 7.89009C6.8252 8.58384 7.22644 9.25659 7.98844 9.77634C8.89444 10.3943 10.3517 10.8151 12.0002 10.8151C13.6487 10.8151 15.1059 10.3943 16.0119 9.77634C16.7739 9.25659 17.1752 8.58384 17.1752 7.89009C17.1752 7.19634 16.7739 6.52359 16.0119 6.00384C15.1059 5.38584 13.6487 4.96509 12.0002 4.96509ZM12.0002 6.31509C13.3322 6.31509 14.5187 6.62034 15.2514 7.11909C15.5822 7.34484 15.8252 7.58934 15.8252 7.89009C15.8252 8.19084 15.5822 8.43534 15.2514 8.66109C14.5187 9.15984 13.3322 9.46509 12.0002 9.46509C10.6682 9.46509 9.48169 9.15984 8.74894 8.66109C8.41819 8.43534 8.17519 8.19084 8.17519 7.89009C8.17519 7.58934 8.41819 7.34484 8.74894 7.11909C9.48169 6.62034 10.6682 6.31509 12.0002 6.31509Z" fill="#FFFEFC"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 3.74995V6.74995C0.825195 7.31695 1.08694 7.86295 1.59544 8.3272C2.19619 8.8762 3.17719 9.3217 4.37044 9.5347C4.73719 9.59995 5.08745 9.35545 5.15345 8.9887C5.2187 8.6212 4.97344 8.27095 4.6067 8.2057C3.8462 8.06995 3.18994 7.82845 2.72719 7.50595C2.40844 7.2847 2.17519 7.04395 2.17519 6.74995V3.74995C2.17519 3.3772 1.87295 3.07495 1.5002 3.07495C1.12745 3.07495 0.825195 3.3772 0.825195 3.74995Z" fill="#FFFEFC"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.825195 6.74995V9.74995C0.825195 10.3837 1.15595 10.9965 1.7927 11.4937C2.54495 12.0817 3.76519 12.522 5.19694 12.642C5.56819 12.6727 5.89444 12.3967 5.92519 12.0255C5.95669 11.6542 5.6807 11.3272 5.30944 11.2965C4.18445 11.2027 3.21469 10.8914 2.62294 10.4295C2.36344 10.227 2.17519 10.0087 2.17519 9.74995V6.74995C2.17519 6.3772 1.87294 6.07495 1.50019 6.07495C1.12744 6.07495 0.825195 6.3772 0.825195 6.74995ZM5.30044 5.2957C4.17919 5.20045 3.21169 4.8892 2.6222 4.42795C2.3627 4.22545 2.17519 4.00795 2.17519 3.74995C2.17519 3.4492 2.41819 3.2047 2.74894 2.97895C3.48169 2.4802 4.66819 2.17495 6.00019 2.17495C7.33219 2.17495 8.51869 2.4802 9.25144 2.97895C9.58219 3.2047 9.82519 3.4492 9.82519 3.74995C9.82519 4.1227 10.1274 4.42495 10.5002 4.42495C10.8729 4.42495 11.1752 4.1227 11.1752 3.74995C11.1752 3.0562 10.7739 2.38345 10.0119 1.8637C9.10594 1.2457 7.64869 0.824951 6.00019 0.824951C4.35169 0.824951 2.89444 1.2457 1.98844 1.8637C1.22644 2.38345 0.825195 3.0562 0.825195 3.74995C0.825195 4.38295 1.1552 4.99495 1.79045 5.49145C2.5412 6.0787 3.75919 6.5197 5.18644 6.64045C5.55769 6.67195 5.8847 6.3967 5.91619 6.02545C5.94769 5.6542 5.67169 5.3272 5.30044 5.2957Z" fill="#FFFEFC"/>
        </svg>
        </span> <input type=number placeholder="Amount:" bind:value={amount}><button id="max" on:click={()=> amount = tokenFunds[viewedTokenId] / (10 ** $tokenRecords[viewedTokenId].decimals)}>max</button><span id="sendTicker">{$tokenRecords[viewedTokenId].ticker}</span></div>
        <div id="resp">
            {#if sendPromise}
            {#await sendPromise}
            Loading
            {:then result}
            {#if result.txid}
            <span id="resp">Success!<br>
                 <button id="txid" on:click={()=>copyContent(result.txid)}>
                    {#if $copied == result.txid}
                    copied!
                    {:else}
                    txid: {result.txid.slice(0,7)}...{result.txid.slice(-7)} <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93945 6.58618V3.58618C8.93945 3.03618 9.38945 2.58618 9.93945 2.58618H20.9395C21.4895 2.58618 21.9395 3.03618 21.9395 3.58618V17.5862C21.9395 18.1362 21.4895 18.5862 20.9395 18.5862H16.9395V7.58618C16.9395 7.03618 16.4895 6.58618 15.9395 6.58618H8.93945Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9395 22.5862H4.93945C4.38945 22.5862 3.93945 22.1362 3.93945 21.5862V7.58618C3.93945 7.03618 4.38945 6.58618 4.93945 6.58618H15.9395C16.4895 6.58618 16.9395 7.03618 16.9395 7.58618V21.5862C16.9395 22.1362 16.4895 22.5862 15.9395 22.5862Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    {/if}
                </button></span>
            {:else}
            {result}
            {/if}
            {:catch error}
            SOMETHING WENT WRONG
            {error}
            {/await}
        {/if}
        </div>
    <div id="info">
        <span>{(tokenFunds[viewedTokenId] / (10 ** $tokenRecords[viewedTokenId].decimals)).toLocaleString(undefined, {minimumFractionDigits: $tokenRecords[viewedTokenId].decimals})} {$tokenRecords[viewedTokenId].name}</span>
        <button on:click={()=> copyContent(viewedTokenId)}>
            {#if $copied == viewedTokenId}
            copied!
            {:else}
            Token ID: {viewedTokenId.slice(0,7)}...{viewedTokenId.slice(-7)}<svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93945 6.58618V3.58618C8.93945 3.03618 9.38945 2.58618 9.93945 2.58618H20.9395C21.4895 2.58618 21.9395 3.03618 21.9395 3.58618V17.5862C21.9395 18.1362 21.4895 18.5862 20.9395 18.5862H16.9395V7.58618C16.9395 7.03618 16.4895 6.58618 15.9395 6.58618H8.93945Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9395 22.5862H4.93945C4.38945 22.5862 3.93945 22.1362 3.93945 21.5862V7.58618C3.93945 7.03618 4.38945 6.58618 4.93945 6.58618H15.9395C16.4895 6.58618 16.9395 7.03618 16.9395 7.58618V21.5862C16.9395 22.1362 16.4895 22.5862 15.9395 22.5862Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                
            {/if}
        </button>
        <span>Total Minted: {($tokenRecords[viewedTokenId].totalMinted / (10** $tokenRecords[viewedTokenId].decimals)).toLocaleString()}</span>
        <span>Total Burned: {($tokenRecords[viewedTokenId].totalBurned / (10** $tokenRecords[viewedTokenId].decimals)).toLocaleString()}</span>
        <span>
            {#if $tokenRecords[viewedTokenId].uri.slice(0,4) != "http"}
            <a href={"http://" + $tokenRecords[viewedTokenId].uri} target="_blank" rel="noreferrer"> URL: {$tokenRecords[viewedTokenId].uri}</a>
            {:else}
            <a href={$tokenRecords[viewedTokenId].uri} target="_blank" rel="noreferrer"> URL: {$tokenRecords[viewedTokenId].uri}</a>
            {/if}
        </span>
    </div>
    <div id='sendDiv'><button id="back" on:click={()=> view.set('tokens')}>back</button><button id="send" on:click={send}><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_32_1280)">
        <path d="M9.02979 16.7278L9.99978 24.3606L12.9998 18.459L23.9998 4.68848L9.02979 16.7278Z" fill="#70A0FF"/>
        <path d="M7.02979 14.7605L7.99978 22.3933L10.9998 16.4917L21.9998 2.72119L7.02979 14.7605Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13 18.459L10 24.3606L17.76 20.5442L13 18.459Z" fill="#70A0FF"/>
        <path d="M11 16.4917L8 22.3933L15.76 18.5769L11 16.4917Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 14.5245L9.03 16.7278L24 4.68848L4 14.5245Z" fill="#FED6FF"/>
        <path d="M2 12.5573L7.03 14.7605L22 2.72119L2 12.5573Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13 18.459L22 22.3934L24 4.68848L13 18.459Z" fill="#FED6FF"/>
        <path d="M11 16.4917L20 20.4261L22 2.72119L11 16.4917Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
        <clipPath id="clip0_32_1280">
        <rect width="24" height="23.6066" fill="white" transform="translate(0 0.753906)"/>
        </clipPath>
        </defs>
        </svg>
        &nbsp Send</button></div>
</div>

{/if}
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
        width: 400px;
        max-width: 80vw;
        background: #FFFEFC;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: 10px 20px;
        margin: 20px;
        margin-bottom: 0;
    }



    .icon span{
        display: grid;
        display: flex;
    }

    .icon span *{
        grid-column: 1;
        grid-row: 1;
    }

    p{
        margin-top: 20px;
        width: 100vw;
    }
    .token {
        width: 90vw;
        max-width: 70vh;
        display: flex;
        justify-content: space-between;
        margin: 10px;
        align-items: center;
        border-radius: 40px;
        font-size: 16px;
    }

    .icon{
        flex-shrink: 0;
        font-size: 32px;
        width: 30px;
        height: 30px;
        color: white;
        background-color: #25282D;
        padding: 10px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-right: 20px;
        overflow:hidden
        

    }
    .icon span{
        margin: auto;

    }

    .tick{
        z-index: 1;
    }

    .icon img{
        z-index: 2;
        margin: auto;
        width: 50px;
        height: 50px;
        position: relative;
        right: 10px;
    }
    .icon img + span{
        opacity: 0;
    }

    
    .tokenShort{
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .tokenShort div{
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tokenId{
        color: #0E76FDBD;
    }

    #to input{
        width: 90%;
        margin: auto;
        background: #FEFEFE;
        border-radius: 40px;
        border: none;
        filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1));
        padding: 20px 15px;
        font-size: 20px;
    }



    #amount > span{
        display: flex;
        align-items: center;
        background: #FEFEFE;
        filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1));
        border-radius: 40px;
        padding: 10px;
    }

    #sendTicker{
        color:#2C2C2C;
    }

    #amount input{
        width: 0;
        flex-grow: 1;
        height: 30px;
        border: none;
        padding-left: 15px;
        padding-right: 10px;
        font-size: 20px;
        z-index: 1;
    }

    #amount #svg{
        background-color: #25282D;
        height: 28px;
        width: 28px;
        box-shadow: 2px 2px 20px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
        border-radius: 50px;
        display: flex;
        padding: 3px;
        margin-left: 5px;
        z-index: 99;
    }
    #max{
        padding: 5px;
        margin: 5px;
        background-color: #D9D9D9;
        border-radius: 40px;
        color: #FFFEFC;

    }


    #resp{
        width: auto;
        max-width: 80;
    }

    #resp button, #back, #send{
        background-color: #F3F4F6;;
        color: #AAABB1;
        border-radius: 40px;
        display: flex;
        align-items:center;
        margin: auto;

        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.1);

    }

    #send{
        color: #FFFEFC;
        background-color: #0E76FD;
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.1);
    }

    #svg svg{
        height: 22px;
        width: 22px;
        margin: auto;
    }

    #to, #amount, #info{
        margin-top: 15px;
        margin-bottom: 15px;
    }

    #info{
        margin-top: 30px;
        display: flex;
        flex-direction: column;
        align-items: flex-start; 
    }

    #sendDiv{
        display: flex;
        justify-content: space-around;
        margin-bottom: 25px;
    }

    #info *{
        background-color: #F3F4F6;;
        color: #AAABB1;
        border-radius: 40px;
        padding: 2px 10px;
        margin: 3px;
    }

    #info button{
        display: flex;
        align-items: center;
    }

    #info button svg{
        padding: 2px 5px;
    }

    #info span a{
        padding: 0;
    }

    #back, #send{
        transition: .4s;
    }

    #back:hover{
        color:#FFFEFC;
        background-color: #0E76FD;
    }

    #send:hover{
        background-color: black;
    }

  
</style>
