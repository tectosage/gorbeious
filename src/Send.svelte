<script>
    import {keyringArray, coins, copied, view} from './lib/stores'
    import {sendXEC, getMax, copyContent} from './lib/functions'
    let address
    let amount
    let sendPromise

    async function send(){
        let result = await sendXEC(address, amount)
        sendPromise = result[0]
        await sendPromise
   }

   async function getMaxXEC(){
        amount = await getMax()
   }
</script>
<!----
<div class="input"><span class="input">To: <input size="5" bind:value={address}></span></div>
<div class="input"><span class="input">Amount: <input type=number bind:value={amount}><button on:click={getMaxXEC}>Max</button>XEC</span></div>
<button on:click={send}>Send!</button><br>
    <div>
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
-->
<div id="main">
    <div id="to"><input size="5" placeholder="to:" bind:value={address}></div>
    <div id="amount"><span id='marginalized'><span id="svg">
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.11295 6.2287C5.22123 5.60289 6.34011 4.97777 7.44838 4.35195C7.61163 4.25809 7.79774 4.20858 7.98732 4.20858C8.1769 4.20858 8.363 4.25809 8.52626 4.35195L10.1731 5.27036C10.1945 5.28301 10.2121 5.30081 10.2244 5.32203C10.2366 5.34325 10.2431 5.36718 10.2431 5.39153C10.2431 5.41588 10.2366 5.43981 10.2244 5.46103C10.2121 5.48225 10.1945 5.50005 10.1731 5.5127L6.14432 7.77292C6.09354 7.80147 6.05147 7.84265 6.02241 7.89225C5.99335 7.94185 5.97834 7.99808 5.97893 8.05518V9.95258C5.97787 10.0089 5.99274 10.0643 6.02192 10.1129C6.05109 10.1615 6.09344 10.2013 6.14432 10.228L7.83359 11.1767C7.88155 11.2064 7.9372 11.2222 7.99403 11.2222C8.05087 11.2222 8.10652 11.2064 8.15448 11.1767L15.1158 7.27172C16.2969 6.60529 16.2969 4.68861 15.1158 4.02218L8.85917 0.511032C8.59818 0.357356 8.29901 0.276123 7.99403 0.276123C7.68906 0.276123 7.38989 0.357356 7.1289 0.511032L0.871536 4.02218C0.60585 4.16784 0.384961 4.38002 0.231736 4.63675C0.0785107 4.89349 -0.00148075 5.18545 4.23411e-05 5.48241C4.23411e-05 7.8335 0.0106445 10.1743 4.23411e-05 12.515C-0.00210467 12.8124 0.0774368 13.1049 0.230423 13.3623C0.383409 13.6197 0.604272 13.8325 0.870122 13.9787L7.12749 17.5002C7.39033 17.6486 7.68878 17.7268 7.99262 17.7268C8.29646 17.7268 8.59491 17.6486 8.85775 17.5002L15.1144 13.9787C15.3798 13.8328 15.5998 13.6198 15.7511 13.3621C15.9024 13.1045 15.9793 12.8118 15.9739 12.515V9.45758L8.52555 13.6572C8.3623 13.7511 8.17619 13.8006 7.98661 13.8006C7.79704 13.8006 7.61093 13.7511 7.44767 13.6572L4.12568 11.7798C3.96039 11.6895 3.82312 11.5576 3.72834 11.3978C3.63356 11.238 3.58476 11.0562 3.58709 10.8717V7.12714C3.58683 6.94589 3.63555 6.76776 3.72835 6.61066C3.82115 6.45355 3.95477 6.32301 4.11578 6.23214L4.11295 6.2287Z" fill="#FFFEFC"/>
        </svg>
        
        </span> <input type=number placeholder="Amount:" bind:value={amount}><button id="max" on:click={getMaxXEC}>max</button>XEC</div>
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

    <div id='sendDiv'><button  id="back" on:click={()=> view.set('home')}>back</button><button id="send" on:click={send}><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
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

<style>
        #main{
        width: 400px;
        max-width: 80vw;
        background: #FFFEFC;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: 10px 20px;
        margin: 20px;
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

    input:focus{
        outline: none;
    }

    input{
        font-weight: 600;
        font-family: 'Helvetica Neue'
    }

    #amount span{
        display: flex;
        align-items: center;
        background: #FEFEFE;
        filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1));
        border-radius: 40px;
        padding: 10px;
    }

    #amount input{
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
        height: 28px;
        width: 28px;
        box-shadow: 2px 2px 20px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
        border-radius: 50px;
        display: flex;
        padding: 2px;
        margin-left: 5px;
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
        height: 20px;
        width: 20px;
        margin: auto;
    }

    #to, #amount{
        margin-top: 15px;
        margin-bottom: 15px;
    }


    #sendDiv{
        display: flex;
        justify-content: space-around;
        margin-bottom: 25px;
        margin-top: 20px;
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
