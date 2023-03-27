<script>
    import {copied, keyringArray, view} from './lib/stores.js'
    import {encode} from 'ecashaddrjs'
    let eToken = false


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
<div id="address">
    {#each $keyringArray.slice(0,1) as address}
    <div id="addressContainer">
        <button id="addressButton" on:click={()=> eToken ? copyContent(encode('etoken', 'P2PKH', address.getHash())) : copyContent(address.getAddress())}>
            {#if ($copied != address.getAddress().toString() && !eToken) || (eToken && $copied != encode('etoken', 'P2PKH', address.getHash()))}
            <span>
            {#if !eToken}
            {address.getAddress().toString().slice(0,14)}...{address.getAddress().toString().slice(-10)}
            {:else}
            {encode('etoken', 'P2PKH', address.getHash()).slice(0,14)}...{encode('etoken', 'P2PKH', address.getHash()).slice(-10)}
            {/if}
        
            </span>
            {:else}
            copied!
            {/if}
        </button>
        <button id="selector" on:click={()=> eToken = !eToken}>
            {#if eToken}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" data-reactroot="">
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" fill="#f0c8fa" d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M7.5 12C7.5 11.4477 7.05228 11 6.5 11C5.94772 11 5.5 11.4477 5.5 12C5.5 12.5523 5.94772 13 6.5 13C7.05228 13 7.5 12.5523 7.5 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M18.5 12C18.5 11.4477 18.0523 11 17.5 11C16.9477 11 16.5 11.4477 16.5 12C16.5 12.5523 16.9477 13 17.5 13C18.0523 13 18.5 12.5523 18.5 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5C12.2761 12.5 12.5 12.2761 12.5 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M7 12C7 11.7239 6.77614 11.5 6.5 11.5C6.22386 11.5 6 11.7239 6 12C6 12.2761 6.22386 12.5 6.5 12.5C6.77614 12.5 7 12.2761 7 12Z"/>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="#0e76fd" d="M18 12C18 11.7239 17.7761 11.5 17.5 11.5C17.2239 11.5 17 11.7239 17 12C17 12.2761 17.2239 12.5 17.5 12.5C17.7761 12.5 18 12.2761 18 12Z"/>
                </svg>
            {:else}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21C16.5228 21 21 16.5228 21 11Z" fill="#FBD4AC" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.5 11C6.5 10.4477 6.05228 10 5.5 10C4.94772 10 4.5 10.4477 4.5 11C4.5 11.5523 4.94772 12 5.5 12C6.05228 12 6.5 11.5523 6.5 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 11C12 10.4477 11.5523 10 11 10C10.4477 10 10 10.4477 10 11C10 11.5523 10.4477 12 11 12C11.5523 12 12 11.5523 12 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17.5 11C17.5 10.4477 17.0523 10 16.5 10C15.9477 10 15.5 10.4477 15.5 11C15.5 11.5523 15.9477 12 16.5 12C17.0523 12 17.5 11.5523 17.5 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11.5 11C11.5 10.7239 11.2761 10.5 11 10.5C10.7239 10.5 10.5 10.7239 10.5 11C10.5 11.2761 10.7239 11.5 11 11.5C11.2761 11.5 11.5 11.2761 11.5 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 11C6 10.7239 5.77614 10.5 5.5 10.5C5.22386 10.5 5 10.7239 5 11C5 11.2761 5.22386 11.5 5.5 11.5C5.77614 11.5 6 11.2761 6 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 11C17 10.7239 16.7761 10.5 16.5 10.5C16.2239 10.5 16 10.7239 16 11C16 11.2761 16.2239 11.5 16.5 11.5C16.7761 11.5 17 11.2761 17 11Z" stroke="#0E76FD" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                
            {/if}
        </button>
        <button id="copyIcon" on:click={()=> eToken ? copyContent(encode('etoken', 'P2PKH', address.getHash())) : copyContent(address.getAddress())}>
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93945 6.58618V3.58618C8.93945 3.03618 9.38945 2.58618 9.93945 2.58618H20.9395C21.4895 2.58618 21.9395 3.03618 21.9395 3.58618V17.5862C21.9395 18.1362 21.4895 18.5862 20.9395 18.5862H16.9395V7.58618C16.9395 7.03618 16.4895 6.58618 15.9395 6.58618H8.93945Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9395 22.5862H4.93945C4.38945 22.5862 3.93945 22.1362 3.93945 21.5862V7.58618C3.93945 7.03618 4.38945 6.58618 4.93945 6.58618H15.9395C16.4895 6.58618 16.9395 7.03618 16.9395 7.58618V21.5862C16.9395 22.1362 16.4895 22.5862 15.9395 22.5862Z" stroke="#0E76FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>
    {/each}

</div>
<div id="sendDiv"><button id="send" on:click={()=> view.set("send")}><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
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
<style>
    #sendDiv{
        padding-top: 10px;
    }

    #address, #sendDiv{
        border-radius: 40px;
        width: 90vw;
        display: flex;
        justify-content: center;
    }

    #address button, #send, #addressContainer{
        display: flex;
        align-items: center;
        background-color: white;
        background: #FEFEFE;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        padding: auto;
        color: black;
    }

    #addressContainer{
        height: auto;
        margin: 4px 2px;
    }

    #addressContainer > * {
        padding-top: 10px;
        padding-bottom: 10px;
    }

    #addressButton, #selector{
        padding-right: 5px;
    }

    #copyIcon, #selector{
        padding-left: 5px;
    }

    #send{
        color:white;
        background-color: #25282D;
        opacity: 1;
    }

    #address button{
        word-break: break-all;
        margin: 4px 2px;
        opacity: 0.6;
        transition: 0.3s;
        cursor: pointer;
    }

    #addressContainer button{
        box-shadow: none;
        margin: 0;
    }

    #address button:hover{
        opacity: 1;
    }
    #address button:active{
        transform: translateY(8px);
    }
</style>