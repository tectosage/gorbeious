<script>
    import {copied, historyArray, tokenRecords, price, transactionPromise} from './lib/stores.js'
    import { fly, fade } from 'svelte/transition';

    const copyContent = async (text) => {
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
  

    
</script>

{#if $historyArray}
{#await $transactionPromise}
<div id="loadingContainer">

<div class="svg-loader">
  <svg class="svg-container" height="50" width="50" viewBox="0 0 100 100">
    <circle class="loader-svg bg" cx="50" cy="50" r="45"></circle>
    <circle class="loader-svg animate" cx="50" cy="50" r="45"></circle>
  </svg>
</div>
</div>
{/await}
{#each $historyArray.filter(h=> !h.swap || (h.swap.type == 'signal' || h.swap.type == 'pointer payment')).slice(0,50) as transaction(transaction)}


  <div class='transaction'>
    <div class='info'>
      <div class='left'>
      {#if transaction.isSwap}
      <svg width="28" height="21" viewBox="0 0 28 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.9998 0.333374L16.6665 5.66671H20.6665V15C20.6665 16.4734 19.4732 17.6667 17.9998 17.6667C16.5265 17.6667 15.3332 16.4734 15.3332 15V5.66671C15.3332 2.72671 12.9398 0.333374 9.99984 0.333374C7.05984 0.333374 4.6665 2.72671 4.6665 5.66671V15H0.666504L5.99984 20.3334L11.3332 15H7.33317V5.66671C7.33317 4.19337 8.5265 3.00004 9.99984 3.00004C11.4732 3.00004 12.6665 4.19337 12.6665 5.66671V15C12.6665 17.94 15.0598 20.3334 17.9998 20.3334C20.9398 20.3334 23.3332 17.94 23.3332 15V5.66671H27.3332L21.9998 0.333374Z" fill="white"/>
      </svg>
        
      {:else if Math.abs(transaction.slpValue) > 0}
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.8584 11.3966V15.73C9.8584 16.732 10.4369 17.7038 11.5376 18.4545C12.8462 19.3472 14.9511 19.955 17.3334 19.955C19.7156 19.955 21.8206 19.3472 23.1292 18.4545C24.2299 17.7038 24.8084 16.732 24.8084 15.73V11.3966C24.8084 10.8582 24.3718 10.4216 23.8334 10.4216C23.295 10.4216 22.8584 10.8582 22.8584 11.3966V15.73C22.8584 16.1644 22.5074 16.5186 22.0296 16.8436C20.9723 17.5651 19.2585 18.005 17.3334 18.005C15.4083 18.005 13.6945 17.5651 12.6371 16.8436C12.1594 16.5186 11.8084 16.1644 11.8084 15.73V11.3966C11.8084 10.8582 11.3718 10.4216 10.8334 10.4216C10.295 10.4216 9.8584 10.8582 9.8584 11.3966Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.8584 15.73V20.0633C9.8584 21.0654 10.4369 22.0372 11.5376 22.7879C12.8462 23.6806 14.9511 24.2883 17.3334 24.2883C19.7156 24.2883 21.8206 23.6806 23.1292 22.7879C24.2299 22.0372 24.8084 21.0654 24.8084 20.0633V15.73C24.8084 15.1916 24.3718 14.755 23.8334 14.755C23.295 14.755 22.8584 15.1916 22.8584 15.73V20.0633C22.8584 20.4978 22.5074 20.852 22.0296 21.177C20.9723 21.8985 19.2585 22.3383 17.3334 22.3383C15.4083 22.3383 13.6945 21.8985 12.6371 21.177C12.1594 20.852 11.8084 20.4978 11.8084 20.0633V15.73C11.8084 15.1916 11.3718 14.755 10.8334 14.755C10.295 14.755 9.8584 15.1916 9.8584 15.73Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3334 7.17163C14.9522 7.17163 12.8473 7.77938 11.5386 8.67205C10.438 9.4228 9.8584 10.3945 9.8584 11.3966C9.8584 12.3987 10.438 13.3705 11.5386 14.1212C12.8473 15.0139 14.9522 15.6216 17.3334 15.6216C19.7146 15.6216 21.8195 15.0139 23.1281 14.1212C24.2288 13.3705 24.8084 12.3987 24.8084 11.3966C24.8084 10.3945 24.2288 9.4228 23.1281 8.67205C21.8195 7.77938 19.7146 7.17163 17.3334 7.17163ZM17.3334 9.12163C19.2574 9.12163 20.9712 9.56255 22.0296 10.283C22.5074 10.609 22.8584 10.9622 22.8584 11.3966C22.8584 11.831 22.5074 12.1842 22.0296 12.5103C20.9712 13.2307 19.2574 13.6716 17.3334 13.6716C15.4094 13.6716 13.6956 13.2307 12.6371 12.5103C12.1594 12.1842 11.8084 11.831 11.8084 11.3966C11.8084 10.9622 12.1594 10.609 12.6371 10.283C13.6956 9.56255 15.4094 9.12163 17.3334 9.12163Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.19189 5.41665V9.74998C1.19189 10.569 1.56998 11.3577 2.30448 12.0282C3.17223 12.8212 4.58923 13.4647 6.31281 13.7724C6.84256 13.8666 7.34848 13.5135 7.44381 12.9837C7.53806 12.4529 7.18381 11.947 6.65406 11.8527C5.55556 11.6566 4.60764 11.3078 3.93923 10.842C3.47881 10.5224 3.14189 10.1746 3.14189 9.74998V5.41665C3.14189 4.87823 2.70531 4.44165 2.16689 4.44165C1.62848 4.44165 1.19189 4.87823 1.19189 5.41665Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.19189 9.74998V14.0833C1.19189 14.9987 1.66964 15.8838 2.58939 16.6021C3.67598 17.4514 5.43856 18.0873 7.50664 18.2607C8.04289 18.3051 8.51414 17.9064 8.55856 17.3701C8.60406 16.8339 8.20539 16.3616 7.66914 16.3171C6.04414 16.1817 4.64339 15.7321 3.78864 15.0648C3.41381 14.7723 3.14189 14.4571 3.14189 14.0833V9.74998C3.14189 9.21157 2.70531 8.77498 2.16689 8.77498C1.62848 8.77498 1.19189 9.21157 1.19189 9.74998ZM7.65614 7.6494C6.03656 7.51182 4.63906 7.06223 3.78756 6.39598C3.41273 6.10348 3.14189 5.78932 3.14189 5.41665C3.14189 4.98223 3.49289 4.62907 3.97064 4.30298C5.02906 3.58257 6.74289 3.14165 8.66689 3.14165C10.5909 3.14165 12.3047 3.58257 13.3631 4.30298C13.8409 4.62907 14.1919 4.98223 14.1919 5.41665C14.1919 5.95507 14.6285 6.39165 15.1669 6.39165C15.7053 6.39165 16.1419 5.95507 16.1419 5.41665C16.1419 4.41457 15.5623 3.44282 14.4616 2.69207C13.153 1.7994 11.0481 1.19165 8.66689 1.19165C6.28573 1.19165 4.18081 1.7994 2.87214 2.69207C1.77148 3.44282 1.19189 4.41457 1.19189 5.41665C1.19189 6.33098 1.66856 7.21498 2.58614 7.93215C3.67056 8.7804 5.42989 9.4174 7.49148 9.59182C8.02773 9.63732 8.50006 9.23973 8.54556 8.70348C8.59106 8.16723 8.19239 7.6949 7.65614 7.6494Z" fill="white"/>
      </svg>
      {:else}        
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.19767 10.9193C9.13715 9.77196 11.0952 8.6259 13.0347 7.47858C13.3204 7.30649 13.6461 7.21572 13.9778 7.21572C14.3096 7.21572 14.6353 7.30649 14.921 7.47858L17.803 9.16233C17.8403 9.18552 17.8712 9.21814 17.8927 9.25705C17.9141 9.29596 17.9254 9.33984 17.9254 9.38447C17.9254 9.42911 17.9141 9.47299 17.8927 9.5119C17.8712 9.5508 17.8403 9.58342 17.803 9.60662L10.7526 13.7503C10.6637 13.8027 10.5901 13.8782 10.5392 13.9691C10.4884 14.0601 10.4621 14.1631 10.4631 14.2678V17.7464C10.4613 17.8496 10.4873 17.9513 10.5384 18.0403C10.5894 18.1294 10.6635 18.2024 10.7526 18.2513L13.7088 19.9906C13.7927 20.045 13.8901 20.0739 13.9896 20.0739C14.089 20.0739 14.1864 20.045 14.2703 19.9906L26.4527 12.8315C28.5196 11.6097 28.5196 8.09579 26.4527 6.874L15.5035 0.436892C15.0468 0.155152 14.5233 0.00622559 13.9896 0.00622559C13.4559 0.00622559 12.9323 0.155152 12.4756 0.436892L1.52519 6.874C1.06024 7.14104 0.673681 7.53003 0.405537 8.00071C0.137394 8.47139 -0.00259131 9.00665 7.40969e-05 9.55108C7.40969e-05 13.8614 0.0186278 18.1528 7.40969e-05 22.4442C-0.00368318 22.9894 0.135514 23.5257 0.40324 23.9975C0.670966 24.4694 1.05748 24.8595 1.52271 25.1276L12.4731 31.5837C12.9331 31.8558 13.4554 31.9992 13.9871 31.9992C14.5188 31.9992 15.0411 31.8558 15.5011 31.5837L26.4502 25.1276C26.9146 24.8602 27.2996 24.4696 27.5644 23.9973C27.8291 23.5249 27.9639 22.9883 27.9543 22.4442V16.8389L14.9197 24.5382C14.634 24.7103 14.3083 24.801 13.9766 24.801C13.6448 24.801 13.3191 24.7103 13.0334 24.5382L7.21994 21.0962C6.93068 20.9308 6.69047 20.6889 6.5246 20.3959C6.35873 20.1029 6.27334 19.7697 6.27741 19.4314V12.5664C6.27695 12.2341 6.36221 11.9076 6.52461 11.6195C6.68702 11.3315 6.92085 11.0922 7.20262 10.9256L7.19767 10.9193Z" fill="white"/>
      </svg>
        
      {/if}
      </div>
      <div class='right'>
        <div class='top'>
          <span class='sentRec'>
            {#if transaction.swap}
            {transaction.swap.type == 'signal' ? 'Offer' : 'Payment'}, {transaction.swap.status}
            {:else if transaction.isSwap}
            Swap:&nbsp
              {#if transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) < -999999}
              <span class="negative">
                -{(Math.abs(transaction.slpValue) / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
              {:else if transaction.slpValue < 0}
              <span class="negative">
                -{(Math.abs(transaction.slpValue) / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)).toLocaleString()} {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
              {:else if transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) > 999999}
              <span class='tokenAmount'>
                +{(transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
              {:else}
              <span class='tokenAmount'>
                +{(transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)).toLocaleString()} {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
              {/if}
            {:else if transaction.value < 0}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M1.6665 9.99998C1.6665 9.53973 2.0396 9.16665 2.49984 9.16665H17.4998C17.9601 9.16665 18.3332 9.53973 18.3332 9.99998C18.3332 10.4602 17.9601 10.8333 17.4998 10.8333H2.49984C2.0396 10.8333 1.6665 10.4602 1.6665 9.99998Z" fill="#030303"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9106 15.5892C11.5851 15.2638 11.5851 14.7362 11.9106 14.4107L16.3213 9.99998L11.9106 5.58923C11.5851 5.26381 11.5851 4.73615 11.9106 4.41073C12.236 4.08531 12.7636 4.08531 13.0891 4.41073L18.0891 9.41073C18.4145 9.73615 18.4145 10.2638 18.0891 10.5892L13.0891 15.5892C12.7636 15.9147 12.236 15.9147 11.9106 15.5892Z" fill="#030303"/>
              </svg> Sent
            {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.99984 1.66669C10.4601 1.66669 10.8332 2.03979 10.8332 2.50002V17.5C10.8332 17.9603 10.4601 18.3334 9.99984 18.3334C9.53959 18.3334 9.1665 17.9603 9.1665 17.5V2.50002C9.1665 2.03979 9.53959 1.66669 9.99984 1.66669Z" fill="#030303"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.41058 11.9107C4.73602 11.5853 5.26365 11.5853 5.5891 11.9107L9.99984 16.3215L14.4106 11.9107C14.736 11.5853 15.2637 11.5853 15.5891 11.9107C15.9145 12.2362 15.9145 12.7638 15.5891 13.0892L10.5891 18.0892C10.2637 18.4147 9.736 18.4147 9.41059 18.0892L4.41058 13.0892C4.08515 12.7638 4.08515 12.2362 4.41058 11.9107Z" fill="#030303"/>
              </svg> Received
            {/if}
          </span>
          <span class='amount'>
            {#if Math.abs(transaction.slpValue) > 0 && !transaction.isSwap}
              {#if transaction.slpValue > 0}
                {#if transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) > 999999 }
                <span class='tokenAmount'>
                  + {(transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)/1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
                {:else}
                <span class='tokenAmount'>
                  + {(transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)).toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals})} {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
                {/if}
              {:else}
                {#if transaction.slpValue / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals) < -999999}
                <span class="negative">
                  - {(Math.abs(transaction.slpValue) / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)/1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
                {:else}
                <span class="negative">
                  - {(Math.abs(transaction.slpValue) / (10 ** $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals)).toLocaleString(undefined, {maximumFractionDigits: $tokenRecords[transaction.slpTxData.slpMeta.tokenId].decimals})} {$tokenRecords[transaction.slpTxData.slpMeta.tokenId].ticker}</span>
                {/if}
              {/if}
            {:else}
              {#if transaction.value > 0}
              <span class="positive">+ {(transaction.value/100).toLocaleString(undefined, {maximumFractionDigits:0})} XEC</span>
              {:else}
              <span class="negative">- {Math.abs(transaction.value/100).toLocaleString(undefined, {maximumFractionDigits:0})} XEC</span>
              {/if}
            {/if}
          </span>
        </div>
        <div class='bottom'>
          <span class='date'>
            {new Date(transaction.timeFirstSeen*1000).toLocaleString('en-us',{day:'numeric', month:'long', year:'numeric'})}
          </span>
          <span class='fiat'>
            {#if Math.abs(transaction.slpValue) > 0 && !transaction.isSwap}
            etoken
            {:else if Math.abs(transaction.value * $price) > 1}
            $ {Math.abs(transaction.value * $price / 100).toLocaleString(undefined, {maximumFractionDigits:2, minimumFractionDigits: 2})}
            {/if}
          </span>
        </div>
      </div>
    </div>
    <div class='buttons'>
      <button class="txid" on:click={()=> copyContent(transaction.txid)}>
        {#if $copied == transaction.txid}
          copied!
        {:else}
          txid:{transaction.txid.slice(0,5)}...{transaction.txid.slice(-8)}
        {/if}
      </button>
      <span class="txid"><a href={'https://explorer.e.cash/tx/' + transaction.txid} target="_blank" rel="noreferrer">view on explorer<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_32_2443)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.196 2.02549C13.796 0.43596 16.3707 0.43596 17.9707 2.02549L17.9726 2.02742C18.7694 2.82421 19.1667 3.87269 19.1667 4.91668C19.1667 5.96066 18.7694 7.00914 17.9726 7.80594L15.4059 10.3726C15.0805 10.698 14.5529 10.698 14.2274 10.3726C13.9019 10.0472 13.9019 9.51951 14.2274 9.19409L16.7941 6.62742C17.2639 6.15754 17.5 5.53936 17.5 4.91668C17.5 4.29442 17.2643 3.67665 16.795 3.2069C15.8453 2.26449 14.3217 2.26438 13.3719 3.20658L9.1271 7.45979C8.6521 7.92858 8.41668 8.54468 8.41668 9.16668C8.41668 9.27868 8.42518 9.39159 8.44077 9.51409C8.45002 9.55193 8.45468 9.58176 8.45727 9.59984C8.45868 9.60968 8.45985 9.61901 8.46085 9.62801C8.48535 9.74159 8.51352 9.84168 8.5486 9.93693C8.5516 9.94509 8.55452 9.95326 8.55727 9.96151C8.66602 10.2879 8.85393 10.5983 9.1241 10.8623L9.13093 10.869C9.27043 11.0086 9.41718 11.1235 9.5621 11.2104C9.95677 11.4473 10.0847 11.9591 9.84793 12.3538C9.6111 12.7484 9.09927 12.8763 8.7046 12.6396C8.4341 12.4773 8.18207 12.2768 7.95578 12.051C7.49769 11.6023 7.17149 11.0683 6.9802 10.5008C6.90612 10.2974 6.85514 10.0999 6.81617 9.90509C6.81479 9.89818 6.81349 9.89118 6.81228 9.88426C6.80732 9.86234 6.80323 9.84018 6.80004 9.81784C6.77137 9.61718 6.75 9.40093 6.75 9.16668C6.75 8.12291 7.14723 7.07322 7.95423 6.27559L12.196 2.02549ZM6.8 9.74168C6.8 9.74351 6.8 9.74534 6.80002 9.74726L6.8 9.74168Z" fill="#AAABB1"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1522 7.64626C10.3891 7.25161 10.9009 7.12364 11.2956 7.36043C11.5661 7.52271 11.8181 7.72326 12.0444 7.94905C12.5025 8.39784 12.8287 8.93167 13.02 9.49926C13.0941 9.70259 13.145 9.90009 13.184 10.0949C13.1853 10.1018 13.1867 10.1088 13.1879 10.1158C13.1928 10.1377 13.1969 10.1598 13.2001 10.1822C13.2288 10.3828 13.2502 10.5991 13.2502 10.8333C13.2502 11.8771 12.8529 12.9268 12.0459 13.7244L7.80415 17.9745C6.20417 19.5641 3.6295 19.5641 2.02951 17.9745L2.02757 17.9726C1.23078 17.1758 0.833496 16.1273 0.833496 15.0833C0.833496 14.0393 1.23078 12.9908 2.02757 12.1941L4.59424 9.62742C4.91968 9.30201 5.44731 9.30201 5.77275 9.62742C6.09819 9.95284 6.09819 10.4805 5.77275 10.8059L3.20609 13.3726C2.73621 13.8425 2.50016 14.4607 2.50016 15.0833C2.50016 15.7056 2.73589 16.3233 3.20512 16.7931C4.15478 17.7355 5.67845 17.7357 6.62823 16.7934C6.62865 16.793 6.62908 16.7926 6.62951 16.7922L9.61008 13.8033L10.8731 12.5403C11.3481 12.0714 11.5835 11.4553 11.5835 10.8333C11.5835 10.7213 11.5749 10.6084 11.5594 10.4859C11.5501 10.4481 11.5455 10.4183 11.5429 10.4002C11.5415 10.3903 11.5403 10.381 11.5393 10.372C11.5148 10.2584 11.4867 10.1583 11.4516 10.0631C11.4486 10.0549 11.4457 10.0468 11.4429 10.0385C11.3341 9.71209 11.1462 9.40167 10.8761 9.13767L10.8692 9.13101C10.7297 8.99142 10.5829 8.87651 10.4381 8.78959C10.0434 8.55275 9.9155 8.04091 10.1522 7.64626ZM13.2002 10.2583C13.2002 10.2565 13.2002 10.2547 13.2002 10.2528V10.2583Z" fill="#AAABB1"/>
        </g>
        <defs>
        <clipPath id="clip0_32_2443">
        <rect width="20" height="20" fill="white"/>
        </clipPath>
        </defs>
        </svg>
        </a></span>
    </div>
  </div>
<!--{/key}-->

{/each}
{#if $historyArray.length == 0}
<p>Your transaction history will appear here</p>
{/if}

{/if}

<style>

#loadingContainer{
  margin-top:10px;
}

p{
  margin: 20px 50px;
}

.transaction, .right{
  display: flex;
  flex-direction: column;

}

.right{
  width: 80%;
  margin: 10px auto;
}

.transaction{
  background: #FFFFFF;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);
  border-radius: 40px;
  padding: 20px;
  width: 80%;
  margin: 20px auto;
}

.top, .bottom, .buttons{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: auto;
}

.info{
  place-items: center;
}

.info{
  display: flex;
  flex-direction: row;
  align-items: center;
}

.date, .fiat, .negative{
  color: #AAABB1;
}

.positive{
  color: #0E76FD;
}

.tokenAmount{
  color:#d33ff7;
}

.sentRec {
  display: inline-flex;
  align-items: center;
}

.left{
  background-color: #25282D;
  height: 40px;
  width: 40px;
  box-shadow: 2px 2px 20px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
  border-radius: 50px;
  display: flex;
  margin-bottom: 10px;
}

.right{
  margin-top: 0;
}

.left svg{
  margin: auto;
  height: 25px;
  width: 25px;
}

.txid{
  background: #F3F4F6;
  border-radius: 40px;
  color: #AAABB1;
  padding: 3px 15px;
}

.txid a{
  display: inline-flex;
  align-items: center;
  color: #AAABB1;
}


@media (orientation: portrait) {
  .transaction {
    padding: 15px;
    width: 80%;
  }
  .txid {
    padding: 3px 5px;
    font-size: 14px;
  }

}

</style>