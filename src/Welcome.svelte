<script>
import {Mnemonic} from 'bcash'
    import { keys } from 'bcash/lib/hd/words/chinese-simplified.js';
    import { set } from 'bcash/lib/protocol/network';
import {greeted, mnemonic} from './lib/stores.js'
import { fly } from 'svelte/transition';

let mnemonic_phrase
let seedInput
let restoreSeed
let learn
let transitionStatus

const seed = (restoreSeed) => {
    if(!restoreSeed){
        mnemonic_phrase = new Mnemonic
    }else{
        try{
            mnemonic_phrase = new Mnemonic(restoreSeed)
        }catch{
            alert('Invalid Seed Phrase, try again please')
        }
    }
    mnemonic.set(mnemonic_phrase)
    localStorage.setItem("mnemonic", mnemonic_phrase.toString())
}

const greet = () => {
    greeted.set(true)
}


</script>
<svg class="logo" width="120" height="105" viewBox="0 0 120 105" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M41.8421 64.0647C40.7484 63.2894 40.4903 61.7744 41.2656 60.6809C42.8827 58.3995 43.8514 55.5495 43.8514 52.4397C43.8514 49.3302 42.8827 46.48 41.2656 44.1986C40.4903 43.105 40.7484 41.5899 41.8421 40.8147C42.9356 40.0395 44.4507 40.2976 45.226 41.3912C47.4175 44.483 48.7059 48.3119 48.7059 52.4397C48.7059 56.5675 47.4175 60.3964 45.226 63.4882C44.4507 64.582 42.9356 64.84 41.8421 64.0647Z" fill="url(#paint0_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M47.7593 71.317C46.7292 70.459 46.5899 68.9286 47.4477 67.8985C50.865 63.796 52.9536 58.3886 52.9536 52.4396C52.9536 46.4907 50.865 41.0834 47.4477 36.9808C46.5899 35.9508 46.7292 34.4203 47.7593 33.5623C48.7892 32.7044 50.3198 32.8439 51.1779 33.8739C55.3136 38.8391 57.8081 45.343 57.8081 52.4396C57.8081 59.5362 55.3136 66.0402 51.1779 71.0053C50.3198 72.0355 48.7892 72.1748 47.7593 71.317Z" fill="url(#paint1_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M33.5027 52.4283C33.5027 50.7074 34.8978 49.3124 36.6186 49.3124C38.3395 49.3124 39.7345 50.7074 39.7345 52.4283C39.7345 54.1492 38.3395 55.5442 36.6186 55.5442C34.8978 55.5442 33.5027 54.1492 33.5027 52.4283Z" fill="url(#paint2_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M27 52.4283C27 51.1564 28.0311 50.1253 29.3031 50.1253C30.575 50.1253 31.6061 51.1564 31.6061 52.4283C31.6061 53.7003 30.575 54.7314 29.3031 54.7314C28.0311 54.7314 27 53.7003 27 52.4283Z" fill="url(#paint3_linear_126_737)"/>
    <g filter="url(#filter0_f_126_737)">
    <path d="M37.6379 52.0823L37.4635 53.0331L35.3994 53.5224" stroke="white" stroke-width="10"/>
    </g>
    <g filter="url(#filter1_f_126_737)">
    <path d="M44.0697 40.3712L43.5434 63.5228" stroke="white" stroke-width="3"/>
    </g>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M77.3764 40.8145C78.47 41.5898 78.7281 43.1048 77.9529 44.1983C76.3357 46.4797 75.367 49.3297 75.367 52.4395C75.367 55.549 76.3357 58.3992 77.9529 60.6806C78.7281 61.7742 78.47 63.2893 77.3764 64.0645C76.2828 64.8397 74.7677 64.5816 73.9925 63.488C71.8009 60.3962 70.5125 56.5673 70.5125 52.4395C70.5125 48.3117 71.8009 44.4828 73.9925 41.391C74.7677 40.2972 76.2828 40.0392 77.3764 40.8145Z" fill="url(#paint4_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M71.4591 33.5622C72.4892 34.4202 72.6286 35.9506 71.7708 36.9807C68.3535 41.0832 66.2648 46.4906 66.2648 52.4396C66.2648 58.3885 68.3535 63.7958 71.7708 67.8984C72.6286 68.9284 72.4892 70.4589 71.4591 71.3169C70.4292 72.1748 68.8986 72.0353 68.0406 71.0054C63.9048 66.0401 61.4103 59.5362 61.4103 52.4396C61.4103 45.343 63.9048 38.839 68.0406 33.8739C68.8986 32.8437 70.4292 32.7044 71.4591 33.5622Z" fill="url(#paint5_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M85.7157 52.4509C85.7157 54.1718 84.3207 55.5668 82.5998 55.5668C80.8789 55.5668 79.4839 54.1718 79.4839 52.4509C79.4839 50.73 80.8789 49.335 82.5998 49.335C84.3207 49.335 85.7157 50.73 85.7157 52.4509Z" fill="url(#paint6_linear_126_737)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M92.2184 52.4509C92.2184 53.7229 91.1873 54.7539 89.9154 54.7539C88.6435 54.7539 87.6123 53.7229 87.6123 52.4509C87.6123 51.1789 88.6435 50.1478 89.9154 50.1478C91.1873 50.1478 92.2184 51.1789 92.2184 52.4509Z" fill="url(#paint7_linear_126_737)"/>
    <g filter="url(#filter2_f_126_737)">
    <path d="M81.5805 52.7969L81.7549 51.8461L83.8191 51.3568" stroke="white" stroke-width="10"/>
    </g>
    <g filter="url(#filter3_f_126_737)">
    <path d="M75.1488 64.508L75.6751 41.3564" stroke="white" stroke-width="3"/>
    </g>
    <defs>
    <filter id="filter0_f_126_737" x="-7.45444" y="8.16792" width="90.0103" height="90.2197" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur_126_737"/>
    </filter>
    <filter id="filter1_f_126_737" x="2.04377" y="0.337082" width="83.5255" height="103.22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur_126_737"/>
    </filter>
    <filter id="filter2_f_126_737" x="36.6626" y="6.49164" width="90.0103" height="90.2197" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur_126_737"/>
    </filter>
    <filter id="filter3_f_126_737" x="33.6491" y="1.32229" width="83.5255" height="103.22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur_126_737"/>
    </filter>
    <linearGradient id="paint0_linear_126_737" x1="44.7621" y1="40.3675" x2="44.7621" y2="64.512" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    <linearGradient id="paint1_linear_126_737" x1="52.3468" y1="33" x2="52.3468" y2="71.8792" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    <linearGradient id="paint2_linear_126_737" x1="36.6186" y1="49.3124" x2="36.6186" y2="55.5442" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFA9FC"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#885EFF"/>
    </linearGradient>
    <linearGradient id="paint3_linear_126_737" x1="29.3031" y1="50.1253" x2="29.3031" y2="54.7314" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    <linearGradient id="paint4_linear_126_737" x1="74.4563" y1="64.5117" x2="74.4563" y2="40.3672" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    <linearGradient id="paint5_linear_126_737" x1="66.8717" y1="71.8792" x2="66.8717" y2="33" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    <linearGradient id="paint6_linear_126_737" x1="82.5998" y1="55.5668" x2="82.5998" y2="49.335" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFA9FC"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#885EFF"/>
    </linearGradient>
    <linearGradient id="paint7_linear_126_737" x1="89.9154" y1="54.7539" x2="89.9154" y2="50.1478" gradientUnits="userSpaceOnUse">
    <stop stop-color="#56A4FF"/>
    <stop offset="1" stop-color="#BFC6FF"/>
    <stop offset="1" stop-color="#5586E3"/>
    </linearGradient>
    </defs>
</svg>
    

<div id='main'>
{#if !mnemonic_phrase}
<div class='welcome'>👋 Welcome to Gorbeious</div>
{/if}
{#if !learn}
    {#if !transitionStatus}
    {#if mnemonic_phrase}
        <p>️ 💡Below is your mnemonic phrase. It is the only way your wallet can be restored if lost. You should write it down. </p>
        
        <div id="mnemonic">{mnemonic_phrase}</div>
        <div id="continue"><button class="default" on:click={greet}><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_32_1110)">
            <path d="M9.02979 16.7278L9.99978 24.3606L12.9998 18.459L23.9998 4.68848L9.02979 16.7278Z" fill="#70A0FF"/>
            <path d="M7.02979 14.7605L7.99978 22.3933L10.9998 16.4917L21.9998 2.72119L7.02979 14.7605Z" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 18.459L10 24.3606L17.76 20.5442L13 18.459Z" fill="#70A0FF"/>
            <path d="M11 16.4917L8 22.3933L15.76 18.5769L11 16.4917Z" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 14.5245L9.03 16.7278L24 4.68848L4 14.5245Z" fill="#FED6FF"/>
            <path d="M2 12.5573L7.03 14.7605L22 2.72119L2 12.5573Z" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 18.459L22 22.3934L24 4.68848L13 18.459Z" fill="#FED6FF"/>
            <path d="M11 16.4917L20 20.4261L22 2.72119L11 16.4917Z" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <defs>
            <clipPath id="clip0_32_1110">
            <rect width="24" height="23.6066" fill="white" transform="translate(0 0.753906)"/>
            </clipPath>
            </defs>
            </svg>
            Continue</button></div>
    {:else if seedInput}
        <br><textarea type='text' size="80" id="seedInput" rows="4" placeholder="Your Seed:" bind:value={restoreSeed}></textarea>
        <div id="seedButtons"><button class="default upgradedBack" on:click={()=> seedInput = false}>back</button>
            <button class="default" id="import" on:click={seed(restoreSeed)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.45 17.5698L14.95 20.0698L18.71 23.9998L21.21 21.4998L17.45 17.5698Z" fill="#F0C8FA"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M15.45 15.5698L12.95 18.0698L16.71 21.9998L19.21 19.4998L15.45 15.5698Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.93 9.3999C10.86 9.4999 10.77 9.5899 10.68 9.6799C10.53 9.8299 10.37 9.9599 10.21 10.0799L20.29 20.6299L21 19.9199L10.93 9.3999Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.5 13C11.9853 13 14 10.9853 14 8.5C14 6.01472 11.9853 4 9.5 4C7.01472 4 5 6.01472 5 8.5C5 10.9853 7.01472 13 9.5 13Z" fill="#F0C8FA"/>
                <path d="M7.5 11C9.98528 11 12 8.98528 12 6.5C12 4.01472 9.98528 2 7.5 2C5.01472 2 3 4.01472 3 6.5C3 8.98528 5.01472 11 7.5 11Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                
            Import</button></div>
    {:else}
        <button class="default" id="generate" on:click={seed}>
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_32_928)">
            <path d="M4.5 8C4.5 6.89543 5.39543 6 6.5 6H22.5C23.6046 6 24.5 6.89543 24.5 8V20C24.5 21.1046 23.6046 22 22.5 22H6.5C5.39543 22 4.5 21.1046 4.5 20V8Z" fill="#315BE1"/>
            <path d="M2.5 6C2.5 4.89543 3.39543 4 4.5 4H20.5C21.6046 4 22.5 4.89543 22.5 6V18C22.5 19.1046 21.6046 20 20.5 20H4.5C3.39543 20 2.5 19.1046 2.5 18V6Z" fill="#F0C8FA"/>
            <path d="M4.5 4C3.39543 4 2.5 4.89543 2.5 6V16H17.5C18.6046 16 19.5 15.1046 19.5 14V12H13.5C12.3954 12 11.5 11.1046 11.5 10C11.5 8.89543 12.3954 8 13.5 8H19.5V6C19.5 4.89543 18.6046 4 17.5 4H4.5Z" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 6C5.39543 6 4.5 6.89543 4.5 8V18H19.5C20.6046 18 21.5 17.1046 21.5 16V14H15.5C14.3954 14 13.5 13.1046 13.5 12C13.5 10.8954 14.3954 10 15.5 10H21.5V8C21.5 6.89543 20.6046 6 19.5 6H6.5Z" fill="#315BE1"/>
            <path d="M4.5 4C3.39543 4 2.5 4.89543 2.5 6V16H17.5C18.6046 16 19.5 15.1046 19.5 14V12H13.5C12.3954 12 11.5 11.1046 11.5 10C11.5 8.89543 12.3954 8 13.5 8H19.5V6C19.5 4.89543 18.6046 4 17.5 4H4.5Z" fill="#F0C8FA"/>
            <path d="M22.5 8H13.5C12.3954 8 11.5 8.89543 11.5 10C11.5 11.1046 12.3954 12 13.5 12H22.5" stroke="#FFFEFC"/>
            <path d="M15.5 10H24.5V14H15.5C14.3954 14 13.5 13.1046 13.5 12C13.5 10.8954 14.3954 10 15.5 10Z" fill="#315BE1"/>
            <path d="M13.5 8H22.5V12H13.5C12.3954 12 11.5 11.1046 11.5 10C11.5 8.89543 12.3954 8 13.5 8Z" fill="#F0C8FA"/>
            <path d="M15.5 10H16.5" stroke="#FFFEFC" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <defs>
            <clipPath id="clip0_32_928">
            <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
            </clipPath>
            </defs>
            </svg>
            Generate Wallet</button>
        <button class="default" id="restore" on:click={()=> seedInput = true}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.45 17.5698L14.95 20.0698L18.71 23.9998L21.21 21.4998L17.45 17.5698Z" fill="#F0C8FA"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.45 15.5698L12.95 18.0698L16.71 21.9998L19.21 19.4998L15.45 15.5698Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.93 9.3999C10.86 9.4999 10.77 9.5899 10.68 9.6799C10.53 9.8299 10.37 9.9599 10.21 10.0799L20.29 20.6299L21 19.9199L10.93 9.3999Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.5 13C11.9853 13 14 10.9853 14 8.5C14 6.01472 11.9853 4 9.5 4C7.01472 4 5 6.01472 5 8.5C5 10.9853 7.01472 13 9.5 13Z" fill="#F0C8FA"/>
            <path d="M7.5 11C9.98528 11 12 8.98528 12 6.5C12 4.01472 9.98528 2 7.5 2C5.01472 2 3 4.01472 3 6.5C3 8.98528 5.01472 11 7.5 11Z" stroke="#FFFEFC" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            Restore from Seed
        </button>
    {/if}

    <div class="learnMore"><button class="learnMore" on:click={()=> learn = true}>Learn More</button></div>
    {/if}
{:else}
    <div transition:fly="{{ y: 300, duration: 1000 }}" on:outrostart="{() => transitionStatus = true}" on:outroend="{() => transitionStatus = false}">
        <h3>What is Gorbeious?</h3>
        <div id='info'>
            Gorbeious is a non-custodial wallet for eCash and eTokens<br>
            It allows you to Swap, that is exchange, between eCash and Tokens Peer-To-Peer<br>
            <br>Meaning: <ul> <li>No signup</li>
                <li>No centralized platform</li>
                <li>No trusted third party</li>
            </ul>
            To start Swapping, create a wallet, and deposit:
            <ul>
                <li>eCash, for transaction fees and for buying Tokens</li>
                <li>eTokens, to sell for eCash</li>
            </ul>
        
            For support join our <a rel="noreferrer" href="https://t.me/gorbeious" target="_blank" >Telegram Channel</a>

        </div>
    <button class="default" id="back" on:click={()=> learn = false}>Back</button>
    </div>
{/if}
</div>

<style>
    #main{
        display: flex;
        flex-direction: column;
        place-items: center;
        max-width: 70vh;
        margin-bottom: 40px;
    }
    .logo{
        position: fixed;
        width: 56px;
        height: 56px;
        left: 59px;
        top: 49px;
    }
    .welcome{
        font-family: 'font';
        font-style: normal;
        font-weight: 600;
        font-size: 24px;
        line-height: 29px;
        text-align: center;
        color: #25282D;
        margin-bottom: 20px;
    }
    .default{
        margin: 10px;
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.1)
    }
    #restore, #generate{
        width: 80%;
    }


    #seedInput{
        background: #FEFEFE;
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.1);
        border-radius: 40px;
        width: 90%;
        word-break: normal;
        padding: 20px;
        resize: none;
        margin: auto;
        font-family: 'font';
        font-weight: 700;
        border:none;
    }

    #seedButtons{
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;

    }

    #import{
        margin-right: 0;
    }
    p{
        padding: 15px;
        max-width: 90%;
        margin: auto;
    }
    #mnemonic{
        padding: 35px;
        background: #25282D;
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.1);
        border-radius: 30px;
        width: auto;
        color: #F4EBFF;
        margin: 15px;
    }
    #continue{
        align-self: flex-end;
        padding-right: 30px;
    }
    #continue button{
        width: 100%;
    }
</style>