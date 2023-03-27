<script>
  import {greeted, mnemonic, keyringArray, promise, funds, tokenUTXO, tokenCoins, tokenFunds as tokenFundsStore, view, coins, price, onCooldown, reloading, isMobile as isMobileStore, copied, loaded} from './lib/stores';
  import {keyring, reload, copyContent} from './lib/functions'
  import {checkPegs} from './lib/swap'
  import {main} from './lib/history'
  import {BigNumber} from 'bignumber.js'
  import { fly,fade } from 'svelte/transition';
  import Welcome from './Welcome.svelte'
  import Home from './Home.svelte'
  import History from './History'
  import Tokens from './Tokens.svelte'
  import Send from './Send.svelte'
  import Swap from './Swap.svelte'
  import { Mnemonic, hd, KeyRing} from 'bcash'
    import { set } from 'bcash/lib/protocol/network';


  let learn
  let transitionStatus
  
  if(localStorage.getItem('mnemonic')){
    mnemonic.set(new Mnemonic(localStorage.getItem('mnemonic')))
    greeted.set(true)
  }

  async function live(){
    try{
    let time = Date.now()
    let sign = $keyringArray[12].sign(Buffer.from(time.toString()))
    let pubkey = $keyringArray[12].publicKey.toString('hex')
    
    
    fetch('https://gorbeious.cash/live/', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
        time: time,
        pubkey: pubkey.toString('hex'),
        message: sign.toString('hex')
    })})
    
    }catch(error){
        console.log(error)
    }
    

    await new Promise(resolve => setTimeout(resolve, 5000));
    live()

  }

  async function reloadTimer(){
    await new Promise(resolve => setTimeout(resolve, 60000));
    if(!$reloading){
        await reload()
    }
    reloadTimer()
  }

  async function pegTimer(){
    await new Promise(resolve => setTimeout(resolve, 5000));
    while(typeof $price != 'number' || $reloading){
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    reloading.set(true)
    await checkPegs($price)
    reloading.set(false)
    await new Promise(resolve => setTimeout(resolve, 3600000));
    pegTimer()
  }

  async function appMain(){
    await reload()
    loaded.set(true)
    main()
    pegTimer()
    live()
    reloadTimer()
  }


  $: if($greeted){
    keyringArray.set(keyring($mnemonic))
    console.log('keyring created')
    appMain()
  }

  $:{
    //console.log('Counting Token Balances')
    let tokenFunds = {}
    let tokenUTXOCount = 0
    Object.keys($tokenCoins).forEach(function(tokenId, index) {
      let amount = new BigNumber(0)
      $tokenCoins[tokenId].map(a=> amount = amount.plus(a.slp.value))
      $tokenCoins[tokenId].map(a=>tokenUTXOCount++)
      if(amount.gt(new BigNumber(0))){
        tokenFunds[tokenId] = amount
    }
    tokenUTXO.set(tokenUTXOCount)
    tokenFundsStore.set(tokenFunds) 
    });
  }

  $:{
    let count = 0
    //console.log('Counting Funds')
    $coins.map(coin => count = count + coin.value)
    funds.set(count)
  }

  function deleteWallet(){
    greeted.set(false)
    localStorage.removeItem("mnemonic")
    view.set('home')
  }
   
  let deleting

  async function fetchAsync () {
    let url = 'https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd'
    let response = await fetch(url);
    let data = await response.json();
    console.log(data.ecash.usd);
    price.set(data.ecash.usd)
    console.log('getting price')
    await new Promise(resolve => setTimeout(resolve, 600000));
    fetchAsync()
  }
  fetchAsync()
  
  let isMobile = window.matchMedia("(any-pointer:coarse)").matches;

  if(isMobile){
    isMobileStore.set(true)
    window.onfocus = function(){
      console.log('window focused')
      if(!$onCooldown && !reloading){
        onCooldown.set(true)
        reload()
        setTimeout(function() {onCooldown.set(false)}, 5000);
      }
    }
  }

</script>
<main>
  {#if !$greeted}
  <Welcome />

  {:else}

  
  <div class='menubar'>
    <div id="home"><button on:click={()=> view.set('home')}>
      <svg width="120" height="94" viewBox="0 0 120 94" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_1_59)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M42.2273 58.7264C41.1337 57.9511 40.8756 56.436 41.6508 55.3425C43.268 53.0612 44.2367 50.2111 44.2367 47.1013C44.2367 43.9918 43.268 41.1416 41.6508 38.8602C40.8756 37.7666 41.1337 36.2516 42.2273 35.4764C43.3209 34.7011 44.836 34.9592 45.6113 36.0529C47.8028 39.1447 49.0912 42.9736 49.0912 47.1013C49.0912 51.2291 47.8028 55.0581 45.6113 58.1499C44.836 59.2436 43.3209 59.5016 42.2273 58.7264Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M48.1446 65.9787C47.1145 65.1206 46.9751 63.5903 47.8329 62.5601C51.2502 58.4576 53.3389 53.0502 53.3389 47.1013C53.3389 41.1524 51.2502 35.745 47.8329 31.6424C46.9751 30.6124 47.1145 29.0819 48.1446 28.224C49.1745 27.366 50.7051 27.5055 51.5631 28.5355C55.6989 33.5008 58.1934 40.0047 58.1934 47.1013C58.1934 54.1978 55.6989 60.7018 51.5631 65.667C50.7051 66.6971 49.1745 66.8364 48.1446 65.9787Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M33.888 47.09C33.888 45.3691 35.283 43.9741 37.0039 43.9741C38.7248 43.9741 40.1198 45.3691 40.1198 47.09C40.1198 48.8109 38.7248 50.2059 37.0039 50.2059C35.283 50.2059 33.888 48.8109 33.888 47.09Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M27.3853 47.09C27.3853 45.818 28.4164 44.7869 29.6883 44.7869C30.9602 44.7869 31.9914 45.818 31.9914 47.09C31.9914 48.362 30.9602 49.393 29.6883 49.393C28.4164 49.393 27.3853 48.362 27.3853 47.09Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M77.7616 35.4762C78.8552 36.2514 79.1134 37.7665 78.3381 38.86C76.721 41.1414 75.7522 43.9914 75.7522 47.1012C75.7522 50.2107 76.721 53.0609 78.3381 55.3423C79.1134 56.4359 78.8552 57.951 77.7616 58.7262C76.668 59.5014 75.153 59.2433 74.3777 58.1497C72.1861 55.0579 70.8978 51.229 70.8978 47.1012C70.8978 42.9734 72.1861 39.1445 74.3777 36.0527C75.153 34.9589 76.668 34.7009 77.7616 35.4762Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M71.8444 28.2239C72.8745 29.0819 73.0138 30.6123 72.156 31.6424C68.7387 35.7449 66.6501 41.1523 66.6501 47.1012C66.6501 53.0502 68.7387 58.4575 72.156 62.5601C73.0138 63.5901 72.8745 65.1206 71.8444 65.9786C70.8145 66.8365 69.2839 66.697 68.4258 65.667C64.2901 60.7018 61.7956 54.1978 61.7956 47.1012C61.7956 40.0047 64.2901 33.5007 68.4258 28.5355C69.2839 27.5054 70.8145 27.3661 71.8444 28.2239Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M86.101 47.1126C86.101 48.8335 84.7059 50.2285 82.9851 50.2285C81.2642 50.2285 79.8692 48.8335 79.8692 47.1126C79.8692 45.3917 81.2642 43.9967 82.9851 43.9967C84.7059 43.9967 86.101 45.3917 86.101 47.1126Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M92.604 47.1126C92.604 48.3845 91.5726 49.4156 90.3006 49.4156C89.0287 49.4156 87.9976 48.3845 87.9976 47.1126C87.9976 45.8406 89.0287 44.8095 90.3006 44.8095C91.5726 44.8095 92.604 45.8406 92.604 47.1126Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M42.2273 58.7264C41.1337 57.9511 40.8756 56.436 41.6508 55.3425C43.268 53.0612 44.2367 50.2111 44.2367 47.1013C44.2367 43.9918 43.268 41.1416 41.6508 38.8602C40.8756 37.7666 41.1337 36.2516 42.2273 35.4764C43.3209 34.7011 44.836 34.9592 45.6113 36.0529C47.8028 39.1447 49.0912 42.9736 49.0912 47.1013C49.0912 51.2291 47.8028 55.0581 45.6113 58.1499C44.836 59.2436 43.3209 59.5016 42.2273 58.7264Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M48.1446 65.9787C47.1145 65.1206 46.9751 63.5903 47.8329 62.5601C51.2502 58.4576 53.3389 53.0502 53.3389 47.1013C53.3389 41.1524 51.2502 35.745 47.8329 31.6424C46.9751 30.6124 47.1145 29.0819 48.1446 28.224C49.1745 27.366 50.7051 27.5055 51.5631 28.5355C55.6989 33.5008 58.1934 40.0047 58.1934 47.1013C58.1934 54.1978 55.6989 60.7018 51.5631 65.667C50.7051 66.6971 49.1745 66.8364 48.1446 65.9787Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M33.888 47.09C33.888 45.3691 35.283 43.9741 37.0039 43.9741C38.7248 43.9741 40.1198 45.3691 40.1198 47.09C40.1198 48.8109 38.7248 50.2059 37.0039 50.2059C35.283 50.2059 33.888 48.8109 33.888 47.09Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M27.3853 47.09C27.3853 45.818 28.4164 44.7869 29.6883 44.7869C30.9602 44.7869 31.9914 45.818 31.9914 47.09C31.9914 48.362 30.9602 49.393 29.6883 49.393C28.4164 49.393 27.3853 48.362 27.3853 47.09Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M77.7616 35.4762C78.8552 36.2514 79.1134 37.7665 78.3381 38.86C76.721 41.1414 75.7522 43.9914 75.7522 47.1012C75.7522 50.2107 76.721 53.0609 78.3381 55.3423C79.1134 56.4359 78.8552 57.951 77.7616 58.7262C76.668 59.5014 75.153 59.2433 74.3777 58.1497C72.1861 55.0579 70.8978 51.229 70.8978 47.1012C70.8978 42.9734 72.1861 39.1445 74.3777 36.0527C75.153 34.9589 76.668 34.7009 77.7616 35.4762Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M71.8444 28.2239C72.8745 29.0819 73.0138 30.6123 72.156 31.6424C68.7387 35.7449 66.6501 41.1523 66.6501 47.1012C66.6501 53.0502 68.7387 58.4575 72.156 62.5601C73.0138 63.5901 72.8745 65.1206 71.8444 65.9786C70.8145 66.8365 69.2839 66.697 68.4258 65.667C64.2901 60.7018 61.7956 54.1978 61.7956 47.1012C61.7956 40.0047 64.2901 33.5007 68.4258 28.5355C69.2839 27.5054 70.8145 27.3661 71.8444 28.2239Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M86.101 47.1126C86.101 48.8335 84.7059 50.2285 82.9851 50.2285C81.2642 50.2285 79.8692 48.8335 79.8692 47.1126C79.8692 45.3917 81.2642 43.9967 82.9851 43.9967C84.7059 43.9967 86.101 45.3917 86.101 47.1126Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M92.604 47.1126C92.604 48.3845 91.5726 49.4156 90.3006 49.4156C89.0287 49.4156 87.9976 48.3845 87.9976 47.1126C87.9976 45.8406 89.0287 44.8095 90.3006 44.8095C91.5726 44.8095 92.604 45.8406 92.604 47.1126Z" fill="black"/>
        </g>
        <defs>
        <clipPath id="clip0_1_59">
        <rect width="66" height="40" fill="white" transform="translate(27 27)"/>
        </clipPath>
        </defs>
      </svg>
      
      
      
      
    </button></div><div id="token">
    <button on:click={()=> view.set('tokens')}>
      {#if !($view == 'tokens' || $view == 'tokeninfo')}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.1333 14.0267V19.36C12.1333 20.5933 12.8453 21.7893 14.2 22.7133C15.8106 23.812 18.4013 24.56 21.3333 24.56C24.2653 24.56 26.856 23.812 28.4666 22.7133C29.8213 21.7893 30.5333 20.5933 30.5333 19.36V14.0267C30.5333 13.364 29.996 12.8267 29.3333 12.8267C28.6706 12.8267 28.1333 13.364 28.1333 14.0267V19.36C28.1333 19.8947 27.7013 20.3307 27.1133 20.7307C25.812 21.6187 23.7026 22.16 21.3333 22.16C18.964 22.16 16.8546 21.6187 15.5533 20.7307C14.9653 20.3307 14.5333 19.8947 14.5333 19.36V14.0267C14.5333 13.364 13.996 12.8267 13.3333 12.8267C12.6706 12.8267 12.1333 13.364 12.1333 14.0267Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.1333 19.3602V24.6935C12.1333 25.9268 12.8453 27.1228 14.2 28.0468C15.8106 29.1455 18.4013 29.8935 21.3333 29.8935C24.2653 29.8935 26.856 29.1455 28.4666 28.0468C29.8213 27.1228 30.5333 25.9268 30.5333 24.6935V19.3602C30.5333 18.6975 29.996 18.1602 29.3333 18.1602C28.6706 18.1602 28.1333 18.6975 28.1333 19.3602V24.6935C28.1333 25.2282 27.7013 25.6642 27.1133 26.0642C25.812 26.9522 23.7026 27.4935 21.3333 27.4935C18.964 27.4935 16.8546 26.9522 15.5533 26.0642C14.9653 25.6642 14.5333 25.2282 14.5333 24.6935V19.3602C14.5333 18.6975 13.996 18.1602 13.3333 18.1602C12.6706 18.1602 12.1333 18.6975 12.1333 19.3602Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.3333 8.82666C18.4026 8.82666 15.812 9.57466 14.2013 10.6733C12.8466 11.5973 12.1333 12.7933 12.1333 14.0267C12.1333 15.26 12.8466 16.456 14.2013 17.38C15.812 18.4787 18.4026 19.2267 21.3333 19.2267C24.264 19.2267 26.8546 18.4787 28.4653 17.38C29.82 16.456 30.5333 15.26 30.5333 14.0267C30.5333 12.7933 29.82 11.5973 28.4653 10.6733C26.8546 9.57466 24.264 8.82666 21.3333 8.82666ZM21.3333 11.2267C23.7013 11.2267 25.8106 11.7693 27.1133 12.656C27.7013 13.0573 28.1333 13.492 28.1333 14.0267C28.1333 14.5613 27.7013 14.996 27.1133 15.3973C25.8106 16.284 23.7013 16.8267 21.3333 16.8267C18.9653 16.8267 16.856 16.284 15.5533 15.3973C14.9653 14.996 14.5333 14.5613 14.5333 14.0267C14.5333 13.492 14.9653 13.0573 15.5533 12.656C16.856 11.7693 18.9653 11.2267 21.3333 11.2267Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.4668 6.6668V12.0001C1.4668 13.0081 1.93213 13.9788 2.83613 14.8041C3.90413 15.7801 5.64813 16.5721 7.76946 16.9508C8.42146 17.0668 9.04413 16.6321 9.16146 15.9801C9.27746 15.3268 8.84146 14.7041 8.18946 14.5881C6.83746 14.3468 5.6708 13.9175 4.84813 13.3441C4.28146 12.9508 3.8668 12.5228 3.8668 12.0001V6.6668C3.8668 6.00413 3.32946 5.4668 2.6668 5.4668C2.00413 5.4668 1.4668 6.00413 1.4668 6.6668Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.4668 12.0001V17.3335C1.4668 18.4601 2.0548 19.5495 3.1868 20.4335C4.52413 21.4788 6.69346 22.2615 9.2388 22.4748C9.8988 22.5295 10.4788 22.0388 10.5335 21.3788C10.5895 20.7188 10.0988 20.1375 9.4388 20.0828C7.4388 19.9161 5.7148 19.3628 4.6628 18.5415C4.20146 18.1815 3.8668 17.7935 3.8668 17.3335V12.0001C3.8668 11.3375 3.32946 10.8001 2.6668 10.8001C2.00413 10.8001 1.4668 11.3375 1.4668 12.0001ZM9.4228 9.4148C7.42946 9.24546 5.70946 8.69213 4.66146 7.87213C4.20013 7.51213 3.8668 7.12546 3.8668 6.6668C3.8668 6.13213 4.2988 5.69746 4.8868 5.29613C6.18946 4.40946 8.2988 3.8668 10.6668 3.8668C13.0348 3.8668 15.1441 4.40946 16.4468 5.29613C17.0348 5.69746 17.4668 6.13213 17.4668 6.6668C17.4668 7.32946 18.0041 7.8668 18.6668 7.8668C19.3295 7.8668 19.8668 7.32946 19.8668 6.6668C19.8668 5.43346 19.1535 4.23746 17.7988 3.31346C16.1881 2.2148 13.5975 1.4668 10.6668 1.4668C7.73613 1.4668 5.14546 2.2148 3.5348 3.31346C2.18013 4.23746 1.4668 5.43346 1.4668 6.6668C1.4668 7.79213 2.05346 8.88013 3.1828 9.7628C4.51746 10.8068 6.6828 11.5908 9.22013 11.8055C9.88013 11.8615 10.4615 11.3721 10.5175 10.7121C10.5735 10.0521 10.0828 9.4708 9.4228 9.4148Z" fill="#25282D"/>
      </svg>
      {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="16" fill="#FFCEA2"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.1333 14.0267V19.36C12.1333 20.5933 12.8453 21.7893 14.2 22.7133C15.8106 23.812 18.4013 24.56 21.3333 24.56C24.2653 24.56 26.856 23.812 28.4666 22.7133C29.8213 21.7893 30.5333 20.5933 30.5333 19.36V14.0267C30.5333 13.364 29.996 12.8267 29.3333 12.8267C28.6706 12.8267 28.1333 13.364 28.1333 14.0267V19.36C28.1333 19.8947 27.7013 20.3307 27.1133 20.7307C25.812 21.6187 23.7026 22.16 21.3333 22.16C18.964 22.16 16.8546 21.6187 15.5533 20.7307C14.9653 20.3307 14.5333 19.8947 14.5333 19.36V14.0267C14.5333 13.364 13.996 12.8267 13.3333 12.8267C12.6706 12.8267 12.1333 13.364 12.1333 14.0267Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.1333 19.36V24.6933C12.1333 25.9267 12.8453 27.1227 14.2 28.0467C15.8106 29.1453 18.4013 29.8933 21.3333 29.8933C24.2653 29.8933 26.856 29.1453 28.4666 28.0467C29.8213 27.1227 30.5333 25.9267 30.5333 24.6933V19.36C30.5333 18.6973 29.996 18.16 29.3333 18.16C28.6706 18.16 28.1333 18.6973 28.1333 19.36V24.6933C28.1333 25.228 27.7013 25.664 27.1133 26.064C25.812 26.952 23.7026 27.4933 21.3333 27.4933C18.964 27.4933 16.8546 26.952 15.5533 26.064C14.9653 25.664 14.5333 25.228 14.5333 24.6933V19.36C14.5333 18.6973 13.996 18.16 13.3333 18.16C12.6706 18.16 12.1333 18.6973 12.1333 19.36Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.3333 8.82666C18.4026 8.82666 15.812 9.57466 14.2013 10.6733C12.8466 11.5973 12.1333 12.7933 12.1333 14.0267C12.1333 15.26 12.8466 16.456 14.2013 17.38C15.812 18.4787 18.4026 19.2267 21.3333 19.2267C24.264 19.2267 26.8546 18.4787 28.4653 17.38C29.82 16.456 30.5333 15.26 30.5333 14.0267C30.5333 12.7933 29.82 11.5973 28.4653 10.6733C26.8546 9.57466 24.264 8.82666 21.3333 8.82666ZM21.3333 11.2267C23.7013 11.2267 25.8106 11.7693 27.1133 12.656C27.7013 13.0573 28.1333 13.492 28.1333 14.0267C28.1333 14.5613 27.7013 14.996 27.1133 15.3973C25.8106 16.284 23.7013 16.8267 21.3333 16.8267C18.9653 16.8267 16.856 16.284 15.5533 15.3973C14.9653 14.996 14.5333 14.5613 14.5333 14.0267C14.5333 13.492 14.9653 13.0573 15.5533 12.656C16.856 11.7693 18.9653 11.2267 21.3333 11.2267Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.46667 6.66667V12C1.46667 13.008 1.93201 13.9787 2.83601 14.804C3.90401 15.78 5.64801 16.572 7.76934 16.9507C8.42134 17.0667 9.04401 16.632 9.16134 15.98C9.27734 15.3267 8.84134 14.704 8.18934 14.588C6.83734 14.3467 5.67067 13.9173 4.84801 13.344C4.28134 12.9507 3.86667 12.5227 3.86667 12V6.66667C3.86667 6.00401 3.32934 5.46667 2.66667 5.46667C2.00401 5.46667 1.46667 6.00401 1.46667 6.66667Z" fill="#25282D"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.46667 12V17.3333C1.46667 18.46 2.05467 19.5493 3.18667 20.4333C4.52401 21.4787 6.69334 22.2613 9.23867 22.4747C9.89867 22.5293 10.4787 22.0387 10.5333 21.3787C10.5893 20.7187 10.0987 20.1373 9.43867 20.0827C7.43867 19.916 5.71467 19.3627 4.66267 18.5413C4.20134 18.1813 3.86667 17.7933 3.86667 17.3333V12C3.86667 11.3373 3.32934 10.8 2.66667 10.8C2.00401 10.8 1.46667 11.3373 1.46667 12ZM9.42267 9.41467C7.42934 9.24534 5.70934 8.69201 4.66134 7.87201C4.20001 7.51201 3.86667 7.12534 3.86667 6.66667C3.86667 6.13201 4.29867 5.69734 4.88667 5.29601C6.18934 4.40934 8.29867 3.86667 10.6667 3.86667C13.0347 3.86667 15.144 4.40934 16.4467 5.29601C17.0347 5.69734 17.4667 6.13201 17.4667 6.66667C17.4667 7.32934 18.004 7.86667 18.6667 7.86667C19.3293 7.86667 19.8667 7.32934 19.8667 6.66667C19.8667 5.43334 19.1533 4.23734 17.7987 3.31334C16.188 2.21467 13.5973 1.46667 10.6667 1.46667C7.73601 1.46667 5.14534 2.21467 3.53467 3.31334C2.18001 4.23734 1.46667 5.43334 1.46667 6.66667C1.46667 7.79201 2.05334 8.88001 3.18267 9.76267C4.51734 10.8067 6.68267 11.5907 9.22001 11.8053C9.88001 11.8613 10.4613 11.372 10.5173 10.712C10.5733 10.052 10.0827 9.47067 9.42267 9.41467Z" fill="#25282D"/>
        </svg>
      {/if}
      </button></div>

    <div id="swap"><button on:click={()=> view.set('swap')}>
      {#if !($view == 'swap' || $view == 'swapping' || $view == 'offers')}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24.0001 5.33331L18.6667 10.6667H22.6667V20C22.6667 21.4733 21.4734 22.6667 20.0001 22.6667C18.5267 22.6667 17.3334 21.4733 17.3334 20V10.6667C17.3334 7.72665 14.9401 5.33331 12.0001 5.33331C9.06008 5.33331 6.66675 7.72665 6.66675 10.6667V20H2.66675L8.00008 25.3333L13.3334 20H9.33341V10.6667C9.33341 9.19331 10.5267 7.99998 12.0001 7.99998C13.4734 7.99998 14.6667 9.19331 14.6667 10.6667V20C14.6667 22.94 17.0601 25.3333 20.0001 25.3333C22.9401 25.3333 25.3334 22.94 25.3334 20V10.6667H29.3334L24.0001 5.33331Z" fill="#25282D"/>
        </svg>
        
      {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <g clip-path="url(#clip0_41_1008)">
        <rect width="32" height="32" rx="16" fill="#FFCEA1"/>
        <path d="M24.0001 5.33334L18.6667 10.6667H22.6667V20C22.6667 21.4733 21.4734 22.6667 20.0001 22.6667C18.5267 22.6667 17.3334 21.4733 17.3334 20V10.6667C17.3334 7.72668 14.9401 5.33334 12.0001 5.33334C9.06008 5.33334 6.66675 7.72668 6.66675 10.6667V20H2.66675L8.00008 25.3333L13.3334 20H9.33341V10.6667C9.33341 9.19334 10.5267 8.00001 12.0001 8.00001C13.4734 8.00001 14.6667 9.19334 14.6667 10.6667V20C14.6667 22.94 17.0601 25.3333 20.0001 25.3333C22.9401 25.3333 25.3334 22.94 25.3334 20V10.6667H29.3334L24.0001 5.33334Z" fill="#25282D"/>
        </g>
        <defs>
        <clipPath id="clip0_41_1008">
        <rect width="32" height="32" rx="16" fill="white"/>
        </clipPath>
        </defs>
        </svg>
      {/if}
      </button>
  </div>
  <div id="settings">
    <button on:click={()=> view.set('settings')}>
      {#if $view != 'settings'}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_23_39)">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M30.1444 9.68799L29.1491 8.08973C28.307 6.73732 26.4408 6.27077 24.9773 7.04677C24.2806 7.42652 23.4494 7.53426 22.6668 7.34623C21.8842 7.1582 21.2146 6.68984 20.8055 6.04444C20.5424 5.63421 20.4011 5.16695 20.3957 4.68994C20.4195 3.92516 20.1076 3.18406 19.5313 2.63545C18.955 2.08684 18.1632 1.77746 17.3364 1.77777H15.331C14.521 1.77777 13.7444 2.07645 13.173 2.60774C12.6015 3.13902 12.2825 3.85912 12.2864 4.60867C12.2624 6.15624 10.8996 7.3991 9.22711 7.39894C8.71157 7.39398 8.20662 7.26315 7.7633 7.01967C6.29978 6.24368 4.43362 6.71023 3.59153 8.06264L2.52297 9.68799C1.68191 11.0387 2.17924 12.7645 3.63544 13.5483C4.582 14.054 5.16511 14.9886 5.16511 16C5.16511 17.0114 4.582 17.9459 3.63544 18.4516C2.18109 19.2302 1.68322 20.9517 2.52297 22.2984L3.53298 23.9102C3.92753 24.5691 4.58952 25.0552 5.37246 25.2611C6.15541 25.467 6.99474 25.3757 7.70475 25.0074C8.40272 24.6306 9.23449 24.5273 10.0151 24.7206C10.7957 24.9139 11.4606 25.3877 11.8619 26.0368C12.125 26.447 12.2664 26.9143 12.2717 27.3913C12.2717 28.9547 13.6414 30.2222 15.331 30.2222H17.3364C19.0203 30.2222 20.3876 28.963 20.3957 27.4049C20.3918 26.653 20.7128 25.9308 21.2874 25.3991C21.862 24.8675 22.6424 24.5703 23.455 24.5739C23.9692 24.5867 24.4721 24.717 24.9188 24.9532C26.3785 25.7315 28.2435 25.2713 29.0906 23.9238L30.1444 22.2984C30.5524 21.6505 30.6644 20.8787 30.4556 20.1542C30.2468 19.4297 29.7344 18.812 29.032 18.4381C28.3296 18.0642 27.8172 17.4465 27.6084 16.7219C27.3996 15.9974 27.5116 15.2257 27.9196 14.5778C28.1848 14.1491 28.5688 13.7939 29.032 13.5483C30.4795 12.765 30.9756 11.0492 30.1444 9.70159V9.68799Z" stroke="#25282D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16.3409 19.9007C18.669 19.9007 20.5563 18.1543 20.5563 16C20.5563 13.8457 18.669 12.0993 16.3409 12.0993C14.0127 12.0993 12.1254 13.8457 12.1254 16C12.1254 18.1543 14.0127 19.9007 16.3409 19.9007Z" stroke="#25282D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
        <clipPath id="clip0_23_39">
        <rect width="32" height="32" fill="white"/>
        </clipPath>
        </defs>
        </svg>
        
      {:else}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_23_39)">
        <path d="M30.5584 16C30.5584 8.14528 24.1909 1.77777 16.3362 1.77777C8.48144 1.77777 2.11393 8.14528 2.11393 16C2.11393 23.8547 8.48144 30.2222 16.3362 30.2222C24.1909 30.2222 30.5584 23.8547 30.5584 16Z" fill="#FFCEA1"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M30.1444 9.68799L29.1491 8.08973C28.307 6.73732 26.4408 6.27077 24.9773 7.04677C24.2806 7.42652 23.4494 7.53426 22.6668 7.34623C21.8842 7.1582 21.2146 6.68984 20.8055 6.04444C20.5424 5.63421 20.4011 5.16695 20.3957 4.68994C20.4195 3.92516 20.1076 3.18406 19.5313 2.63545C18.955 2.08684 18.1632 1.77746 17.3364 1.77777H15.331C14.521 1.77777 13.7444 2.07645 13.173 2.60774C12.6015 3.13902 12.2825 3.85912 12.2864 4.60867C12.2624 6.15624 10.8996 7.3991 9.22711 7.39894C8.71157 7.39398 8.20662 7.26315 7.7633 7.01967C6.29978 6.24368 4.43362 6.71023 3.59153 8.06264L2.52297 9.68799C1.68191 11.0387 2.17924 12.7645 3.63544 13.5483C4.582 14.054 5.16511 14.9886 5.16511 16C5.16511 17.0114 4.582 17.9459 3.63544 18.4516C2.18109 19.2302 1.68322 20.9517 2.52297 22.2984L3.53298 23.9102C3.92753 24.5691 4.58952 25.0552 5.37246 25.2611C6.15541 25.467 6.99474 25.3757 7.70475 25.0074C8.40272 24.6306 9.23449 24.5273 10.0151 24.7206C10.7957 24.9139 11.4606 25.3877 11.8619 26.0368C12.125 26.447 12.2664 26.9143 12.2717 27.3913C12.2717 28.9547 13.6414 30.2222 15.331 30.2222H17.3364C19.0203 30.2222 20.3876 28.963 20.3957 27.4049C20.3918 26.653 20.7128 25.9308 21.2874 25.3991C21.862 24.8675 22.6424 24.5703 23.455 24.5739C23.9692 24.5867 24.4721 24.717 24.9188 24.9532C26.3785 25.7315 28.2435 25.2713 29.0906 23.9238L30.1444 22.2984C30.5524 21.6505 30.6644 20.8787 30.4556 20.1542C30.2468 19.4297 29.7344 18.812 29.032 18.4381C28.3296 18.0642 27.8172 17.4465 27.6084 16.7219C27.3996 15.9974 27.5116 15.2257 27.9196 14.5778C28.1848 14.1491 28.5688 13.7939 29.032 13.5483C30.4795 12.765 30.9756 11.0492 30.1444 9.70159V9.68799Z" stroke="#25282D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16.3409 19.9007C18.669 19.9007 20.5563 18.1543 20.5563 16C20.5563 13.8457 18.669 12.0993 16.3409 12.0993C14.0127 12.0993 12.1254 13.8457 12.1254 16C12.1254 18.1543 14.0127 19.9007 16.3409 19.9007Z" stroke="#25282D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
        <clipPath id="clip0_23_39">
        <rect width="32" height="32" fill="white"/>
        </clipPath>
        </defs>
        </svg>
        
      {/if}
      
  </button></div> </div>

    <div id="main">
    {#if $view == 'settings'}
    {#if !learn && !transitionStatus}
      <div id="settingsmenu">
      <div id="mnemonicContainer">
        <div id='mnemonic'><span>
          {#if $copied != $mnemonic}
          {$mnemonic}
          {:else}
          copied!
          {/if}
        </span><button on:click={()=> copyContent($mnemonic)}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.3335 5.50016V2.75016C7.3335 2.246 7.746 1.8335 8.25016 1.8335H18.3335C18.8377 1.8335 19.2502 2.246 19.2502 2.75016V15.5835C19.2502 16.0877 18.8377 16.5002 18.3335 16.5002H14.6668V6.41683C14.6668 5.91266 14.2543 5.50016 13.7502 5.50016H7.3335Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.75 20.1667H3.66667C3.1625 20.1667 2.75 19.7542 2.75 19.25V6.41667C2.75 5.9125 3.1625 5.5 3.66667 5.5H13.75C14.2542 5.5 14.6667 5.9125 14.6667 6.41667V19.25C14.6667 19.7542 14.2542 20.1667 13.75 20.1667Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg></button>
            
        </div>
        <div id="deleteContainer">
        {#if !deleting}
        <button id="delete" on:click={()=> deleting = true}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 8L19.12 14.13C18.76 14.04 18.38 14 18 14C15.24 14 13 16.24 13 19C13 21.67 15.09 23.85 17.72 23.98C17.67 24 17.62 24 17.56 24H8.44C7.91 24 7.47 23.59 7.44 23.06L6.5 8H19.5Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 6L17.12 12.13C16.76 12.04 16.38 12 16 12C13.24 12 11 14.24 11 17C11 19.67 13.09 21.85 15.72 21.98C15.67 22 15.62 22 15.56 22H6.44C5.91 22 5.47 21.59 5.44 21.06L4.5 6H17.5Z" fill="#F0C8FA"/>
            <path d="M4.5 6H17.5" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 5C9.5 4.44772 9.94772 4 10.5 4H15.5C16.0523 4 16.5 4.44772 16.5 5V6C16.5 6.55228 16.0523 7 15.5 7H10.5C9.94772 7 9.5 6.55228 9.5 6V5Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 3C7.5 2.44772 7.94772 2 8.5 2H13.5C14.0523 2 14.5 2.44772 14.5 3V4C14.5 4.55228 14.0523 5 13.5 5H8.5C7.94772 5 7.5 4.55228 7.5 4V3Z" fill="#F0C8FA"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.5 8H5.5C5.22 8 5 7.78 5 7.5V5.5C5 5.22 5.22 5 5.5 5H20.5C20.78 5 21 5.22 21 5.5V7.5C21 7.78 20.78 8 20.5 8Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 6H3.5C3.22 6 3 5.78 3 5.5V3.5C3 3.22 3.22 3 3.5 3H18.5C18.78 3 19 3.22 19 3.5V5.5C19 5.78 18.78 6 18.5 6Z" fill="#F0C8FA"/>
            <path d="M18 24C20.7614 24 23 21.7614 23 19C23 16.2386 20.7614 14 18 14C15.2386 14 13 16.2386 13 19C13 21.7614 15.2386 24 18 24Z" fill="#315BE1"/>
            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" fill="#F0C8FA"/>
            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.8799 14.8799L18.1199 19.1199" stroke="white" stroke-miterlimit="10" stroke-linejoin="round"/>
            <path d="M18.1199 14.8799L13.8799 19.1199" stroke="white" stroke-miterlimit="10" stroke-linejoin="round"/>
          </svg>
            
          Delete Wallet</button>
        {:else}
        <button on:click={()=> deleting = false}>Cancel</button><button id="delete" on:click={deleteWallet}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 8L19.12 14.13C18.76 14.04 18.38 14 18 14C15.24 14 13 16.24 13 19C13 21.67 15.09 23.85 17.72 23.98C17.67 24 17.62 24 17.56 24H8.44C7.91 24 7.47 23.59 7.44 23.06L6.5 8H19.5Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 6L17.12 12.13C16.76 12.04 16.38 12 16 12C13.24 12 11 14.24 11 17C11 19.67 13.09 21.85 15.72 21.98C15.67 22 15.62 22 15.56 22H6.44C5.91 22 5.47 21.59 5.44 21.06L4.5 6H17.5Z" fill="#F0C8FA"/>
            <path d="M4.5 6H17.5" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 5C9.5 4.44772 9.94772 4 10.5 4H15.5C16.0523 4 16.5 4.44772 16.5 5V6C16.5 6.55228 16.0523 7 15.5 7H10.5C9.94772 7 9.5 6.55228 9.5 6V5Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 3C7.5 2.44772 7.94772 2 8.5 2H13.5C14.0523 2 14.5 2.44772 14.5 3V4C14.5 4.55228 14.0523 5 13.5 5H8.5C7.94772 5 7.5 4.55228 7.5 4V3Z" fill="#F0C8FA"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.5 8H5.5C5.22 8 5 7.78 5 7.5V5.5C5 5.22 5.22 5 5.5 5H20.5C20.78 5 21 5.22 21 5.5V7.5C21 7.78 20.78 8 20.5 8Z" fill="#315BE1"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 6H3.5C3.22 6 3 5.78 3 5.5V3.5C3 3.22 3.22 3 3.5 3H18.5C18.78 3 19 3.22 19 3.5V5.5C19 5.78 18.78 6 18.5 6Z" fill="#F0C8FA"/>
            <path d="M18 24C20.7614 24 23 21.7614 23 19C23 16.2386 20.7614 14 18 14C15.2386 14 13 16.2386 13 19C13 21.7614 15.2386 24 18 24Z" fill="#315BE1"/>
            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" fill="#F0C8FA"/>
            <path d="M16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22Z" stroke="white" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.8799 14.8799L18.1199 19.1199" stroke="white" stroke-miterlimit="10" stroke-linejoin="round"/>
            <path d="M18.1199 14.8799L13.8799 19.1199" stroke="white" stroke-miterlimit="10" stroke-linejoin="round"/>
          </svg>
          Delete my wallet</button>
        {/if}
        </div>
        {#if deleting}
        <div id="finalWarning"> Delete wallet? All local data will be lost</div>
        {/if}
      </div>
      <br><br><b>version: 0.5.2</b>
      <div class="learnMore"><button class="learnMore" on:click={()=> learn = true}>Learn More</button></div>
      </div>
    {:else if !transitionStatus}
      <div transition:fly="{{ y: 300, duration: 1000 }}" on:outrostart="{() => transitionStatus = true}" on:outroend="{() => transitionStatus = false}">
        <h3>What is Gorbeious?</h3>
        <div id='info'>
            Gorbeious is a non-custodial wallet for eCash and eTokens<br>
            It allows you to Swap, that is exchange, between eCash and Tokens Peer-To-Peer<br>
            <br>Meaning: <ul> <li>No signup</li>
                <li>No centralized platform</li>
                <li>No trusted third party</li>
            </ul>
            To start Swapping deposit:
            <ul>
                <li>eCash, for transaction fees and for buying Tokens</li>
                <li>eTokens, to sell for eCash</li>
            </ul>
        
            For support join our <a rel="noreferrer" href="https://t.me/gorbeious" target="_blank" >Telegram Channel</a>

        </div>
      <button class="default" id="back" on:click={()=> learn = false}>Back</button>
      </div>  
    {/if}
    {:else}
      <div id="balance">

      {#await $promise}
      Loading..
      <div class="svg-loader">
        <svg class="svg-container" height="50" width="50" viewBox="0 0 100 100">
          <circle class="loader-svg bg" cx="50" cy="50" r="45"></circle>
          <circle class="loader-svg animate" cx="50" cy="50" r="45"></circle>
        </svg>
      </div>
      {:then balance}
      <span id='xec'>
        <span id='xecicon'><svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.11295 6.2287C5.22123 5.60289 6.34011 4.97777 7.44838 4.35195C7.61163 4.25809 7.79774 4.20858 7.98732 4.20858C8.1769 4.20858 8.363 4.25809 8.52626 4.35195L10.1731 5.27036C10.1945 5.28301 10.2121 5.30081 10.2244 5.32203C10.2366 5.34325 10.2431 5.36718 10.2431 5.39153C10.2431 5.41588 10.2366 5.43981 10.2244 5.46103C10.2121 5.48225 10.1945 5.50005 10.1731 5.5127L6.14432 7.77292C6.09354 7.80147 6.05147 7.84265 6.02241 7.89225C5.99335 7.94185 5.97834 7.99808 5.97893 8.05518V9.95258C5.97787 10.0089 5.99274 10.0643 6.02192 10.1129C6.05109 10.1615 6.09344 10.2013 6.14432 10.228L7.83359 11.1767C7.88155 11.2064 7.9372 11.2222 7.99403 11.2222C8.05087 11.2222 8.10652 11.2064 8.15448 11.1767L15.1158 7.27172C16.2969 6.60529 16.2969 4.68861 15.1158 4.02218L8.85917 0.511032C8.59818 0.357356 8.29901 0.276123 7.99403 0.276123C7.68906 0.276123 7.38989 0.357356 7.1289 0.511032L0.871536 4.02218C0.60585 4.16784 0.384961 4.38002 0.231736 4.63675C0.0785107 4.89349 -0.00148075 5.18545 4.23411e-05 5.48241C4.23411e-05 7.8335 0.0106445 10.1743 4.23411e-05 12.515C-0.00210467 12.8124 0.0774368 13.1049 0.230423 13.3623C0.383409 13.6197 0.604272 13.8325 0.870122 13.9787L7.12749 17.5002C7.39033 17.6486 7.68878 17.7268 7.99262 17.7268C8.29646 17.7268 8.59491 17.6486 8.85775 17.5002L15.1144 13.9787C15.3798 13.8328 15.5998 13.6198 15.7511 13.3621C15.9024 13.1045 15.9793 12.8118 15.9739 12.515V9.45758L8.52555 13.6572C8.3623 13.7511 8.17619 13.8006 7.98661 13.8006C7.79704 13.8006 7.61093 13.7511 7.44767 13.6572L4.12568 11.7798C3.96039 11.6895 3.82312 11.5576 3.72834 11.3978C3.63356 11.238 3.58476 11.0562 3.58709 10.8717V7.12714C3.58683 6.94589 3.63555 6.76776 3.72835 6.61066C3.82115 6.45355 3.95477 6.32301 4.11578 6.23214L4.11295 6.2287Z" fill="white"/>
          </svg>
          </span> 
          
          {#key $funds}
              <span style="display: inline-block" in:fly={{ y: -20 }}>
                  {($funds/100).toLocaleString()}
              </span>
          {/key}
       &nbsp;XEC</span>
      {#if typeof $price == 'number'}${Number(($funds*$price/100).toFixed(2)).toLocaleString()}{/if}
      {:catch error}
      $price
      $typeof price
      {error}
      SOMETHING WENT WRONG
      {/await}
      </div>


      {#if $view == 'home'}
      <div id="homeComponent">
        <Home />
      </div>
      <div id="history">

      <History />
      </div>
      {:else if $view == 'tokens' || $view == 'tokenInfo'}
        <div id="tokens"><Tokens /></div>
      {:else if $view == 'send'}
        <div id="send"><Send /></div>
      {:else if $view == 'swap' || $view == 'swapping' || $view == 'offers'}
        <div id="swaps"><Swap /></div>
      {/if}
    {/if}
    <br>
  
      </div>  
  {/if}




</main>

<style>
  #main{
    padding-top: 30px;
  }
  .menubar{
    display: flex;
    justify-content: flex-start;
    position: fixed;
    padding-top: 20px;
    top: 0px;
    left: 50%;
    transform: translateX(-50%);
    width: 50vh;
  }
  .menubar div{
    display: flex;
    flex-grow: 1;
  }
  .menubar div button{
    background: none;
    padding: 0;
  }
  .menubar div button svg{
    width: 10vh;
    max-height: 10vw;
  }
  #home, #swap{
    justify-content: flex-start;
  }
  #token, #settings{
    justify-content: flex-end;
  }
  #balance{
    position: fixed;
    transform: translateX(-50%);
    left: 50%;
    top: 100px;
    font-size: 24px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  #xec{
    display: flex;
    align-items: center;
    margin: 10px;
  }
  #xec #xecicon{
    background: #25282D;
    box-shadow: 2px 2px 7px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
    border-radius: 100px;
    width: 28px;
    height: 28px;
    display: flex;
    margin: 0 5px;
  }
  #xecicon svg{
    margin: auto;
  }
  #homeComponent{
    position: fixed;
    max-width: 90vw;
    top: 190px;
    transform: translateX(-50%);
  }
  #history {
    height: auto;
    overflow: auto;
    position: fixed;
    top: 305px;
    bottom: 10px;
    transform: translateX(-50%);
    scrollbar-width: none;
    width: 100%;
    max-width: 65vh;
  }
  #tokens, #send, #swaps{
    height: auto;
    overflow: auto;
    position: fixed;
    top: 200px;
    /*bottom: 10px;*/
    transform: translateX(-50%);

  }

  #tokens{
    top: 180px;

  }

  #history, #send, #tokens, #swaps{
    bottom: 0px;
  }

  #swaps{
    width: 100%;
    max-width: 60vh;
    top:190px;
  }

  #history::-webkit-scrollbar, #tokens::-webkit-scrollbar, #swaps::-webkit-scrollbar {
    display: none;
  }
  #settingsmenu{
    padding: 20px;
  }

  #deleteContainer{
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  #deleteContainer button{
    display: flex;
    align-items: center;
  }

  #delete{
    margin-left: 10px;
  }

  #deleteContainer button svg{
    margin-right: 5px;
  }

  #mnemonic, #deleteContainer button{
    background-color: #25282D;
    color:#F4EBFF;
    border-radius: 40px;
    border: none;
    box-shadow: 2px 2px 20px rgba(0, 60, 179, 0.2), 0px 0px 0px rgba(0, 60, 179, 0.2);
  }

  #finalWarning{
    margin-top: 20px;
  }

  #mnemonic{
    padding: 30px;
    margin-top: 10px;
    max-width: 50vh;
    display: flex;
    flex-direction: column;
  }

  #mnemonic button{
    background-color: #25282D;
    padding: 0;
    align-self: flex-end;
  }

</style>
