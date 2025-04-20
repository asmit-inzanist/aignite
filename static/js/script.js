const scroll = new LocomotiveScroll({
    el: document.querySelector('#main'),
    smooth: true
});

const scrollableDiv = document.querySelector("#output");

scrollableDiv.addEventListener("mouseenter", () => {
    document.body.style.overflow = "hidden";
  });
  scrollableDiv.addEventListener("mouseleave", () => {
    document.body.style.overflow = "";
  });

var ana = document.getElementsByClassName('analysing')[0];
var st = document.getElementsByClassName('started')[0];
var home = document.getElementsByClassName('home')[0];
var cont = document.getElementsByClassName('cont')[0];
var abt = document.getElementsByClassName('abt')[0];

home.addEventListener('click', () => {
    scroll.scrollTo("#page1");
})
abt.addEventListener('click', () => {
    scroll.scrollTo("#page2");
})
cont.addEventListener('click', () => {
    scroll.scrollTo("#page3");
})

st.addEventListener('click', () => {
    scroll.scrollTo("#analyser");
})

ana.addEventListener('click', () => {
    scroll.scrollTo("#analyser");
})

const cursor = document.querySelector('.custom-cursor');
var main = document.querySelector('#main');

gsap.set("#cursor", { xPercent: -50, yPercent: -50 }); // center the circle on mouse

// Use a single gsap tween and just update its position — no stacking
let moveCursor = gsap.to(cursor, {
    x: 0,
    y: 0,
    duration: 0.5,
    ease: "back.out(1.7)",
    paused: true
});

main.addEventListener("mousemove", (e) => {
    moveCursor.vars.x = e.clientX;
    moveCursor.vars.y = e.clientY;
    moveCursor.invalidate().restart(); // re-apply and restart tween
});




function processFile(promptType) {
    let fileInput = document.getElementById("fileInput").files[0];
    let userInput = document.getElementById("userInput").value;
    let formData = new FormData();

    if (!fileInput) {
        alert("Please upload a file before submitting.");
        return;
    }

    const dropArea = document.getElementById('drop-area');

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.backgroundColor = "#f9f9f9";
        fileInput = e.dataTransfer.files;
        console.log("Dropped files:", files);
        // handle files here...
    });

    formData.append("file", fileInput);
    formData.append("user_input", userInput);
    formData.append("prompt_type", promptType);

    document.getElementById("output").innerHTML = "Processing... Please wait.";

    fetch("/process", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("output").innerHTML = `<p>${data.response}</p>`;
        })
        .catch(error => console.error("Error:", error));
}

let account = null;
let contract = null;
let web3 = null;
const CONTRACT_ADDRESS = "0xd652eDaB0d06B8d45db78743b46c078b53da6070";

const ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_streak",
                "type": "uint256"
            }
        ],
        "name": "getRewardAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getStreak",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getRewardBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Connect once and reuse
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            account = accounts[0];
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
            document.getElementById("walletStatus").innerText = `Connected: ${account}`;
        } catch (err) {
            console.error("MetaMask connection failed:", err);
            alert("MetaMask connection failed. Please try again.");
        }
    } else {
        alert("Please install MetaMask.");
    }
}

async function ensureConnected() {
    if (!account || !contract) {
        await connectWallet();
    }
}

// Auto-connect once page loads
window.addEventListener("load", async () => {
    if (window.ethereum) {
        try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                account = accounts[0];
                const web3 = new Web3(window.ethereum);
                contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
                console.log("Wallet already connected:", account);
            }
        } catch (error) {
            console.error("Auto-connection failed:", error);
        }
    }
});


async function claimReward() {
    await ensureConnected();
    if (!account || !contract) return;

    try {
        const tx = await contract.methods.claimReward().send({ from: account });
        alert(`Reward claimed! Tx Hash: ${tx.transactionHash}`);
    } catch (err) {
        console.error(err);
        alert("Error claiming reward. Maybe already claimed today?");
    }
}

async function getStreak() {
    await ensureConnected();
    if (!account || !contract) return;

    try {
        const streak = await contract.methods.getStreak().call({ from: account });
        alert(`Your current streak is: ${streak} days`);
    } catch (err) {
        console.error(err);
        alert("Failed to get streak.");
    }
}

async function getRewardBalance() {
    await ensureConnected();
    if (!account || !contract) return;

    try {
        const balance = await contract.methods.getRewardBalance().call({ from: account });
        alert(`Your reward balance is: ${balance} tokens`);
    } catch (err) {
        console.error(err);
        alert("Failed to get reward balance.");
    }
}

async function getWalletBalance() {
    await ensureConnected();
    if (!account || !web3) return;

    try {
        const balanceWei = await web3.eth.getBalance(account);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        document.getElementById("balanceValue").innerText = parseFloat(balanceEth).toFixed(4);
    } catch (err) {
        console.error(err);
        alert("Failed to fetch wallet balance.");
    }
}


let synth = window.speechSynthesis;
let utterance;
let isSpeaking = false;
let isPaused = false;
let selectedVoice = null;

// Load voices asynchronously
function loadVoices() {
    const voices = synth.getVoices();
    // You can log all voices to see available options
    // console.log(voices);

    // Try to pick a natural female English voice
    selectedVoice = voices.find(voice =>
        voice.name.includes("Female") ||
        voice.name.includes("Google UK English Female") ||
        voice.name.includes("Zira") ||
        (voice.lang === "en-US" && voice.name.toLowerCase().includes("google"))
    ) || voices[0]; // Fallback to first voice if none matched
}

// Make sure voices are loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function toggleSpeech() {
    const outputText = document.getElementById("output").innerText.trim();
    const btn = document.getElementById("speechToggle");

    if (!outputText) return;

    if (!isSpeaking) {
        synth.cancel();
        utterance = new SpeechSynthesisUtterance(outputText);

        // Set the selected voice (female/natural)
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        synth.speak(utterance);
        isSpeaking = true;
        isPaused = false;
        btn.innerText = "⏸ Pause";

        utterance.onend = () => {
            isSpeaking = false;
            isPaused = false;
            btn.innerText = "🔊 Speak";
        };
    } else if (!isPaused) {
        synth.pause();
        isPaused = true;
        btn.innerText = "▶️ Resume";
    } else {
        synth.resume();
        isPaused = false;
        btn.innerText = "⏸ Pause";
    }
}

function stopSpeech() {
    const btn = document.getElementById("speechToggle");

    if (synth.speaking || isPaused) {
        synth.cancel();  // Completely stop any current speech
        isSpeaking = false;
        isPaused = false;
        btn.innerText = "🔊 Speak";  // Reset the toggle button label
    }
}





let subMenu = document.getElementById("submenu");

function toggleSubMenu() {
    submenu.classList.toggle("active");
}


