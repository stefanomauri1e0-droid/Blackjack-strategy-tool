// --- GAME STATE & HI-LO ---
let totalDecks = 6;
const CARDS_PER_DECK = 52;
let totalCards = totalDecks * CARDS_PER_DECK;
let cardsDealt = 0;
let runningCount = 0;
let remainingCards = {};

// --- STRATEGY STATE ---
let selectedHands = {
    dealer: null,
    player1: null,
    player2: null
};
let currentActiveSlot = null; // Tracks which table slot was clicked

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// --- DOM ELEMENTS ---
const decksInput = document.getElementById('decks');
const resetBtn = document.getElementById('reset-btn');
const runningCountDisplay = document.getElementById('running-count');
const trueCountDisplay = document.getElementById('true-count');
const cardsLeftDisplay = document.getElementById('cards-left');
const cardBtns = document.querySelectorAll('.card-btn');

const actionResult = document.getElementById('action-result');
const modal = document.getElementById('card-modal');
const suitSelector = document.querySelector('.suit-selector');
const cardPickerGrid = document.getElementById('card-picker-grid');
const backBtn = document.getElementById('back-to-suits');

// --- INITIALIZATION ---
function init() {
    resetShoe();
}

function resetShoe() {
    totalDecks = parseInt(decksInput.value) || 6;
    totalCards = totalDecks * CARDS_PER_DECK;
    cardsDealt = 0;
    runningCount = 0;
    
    cardValues.forEach(val => {
        remainingCards[val] = totalDecks * 4;
    });

    updateDisplay();
}

function updateDisplay() {
    runningCountDisplay.textContent = runningCount;
    let cardsLeft = totalCards - cardsDealt;
    cardsLeftDisplay.textContent = cardsLeft > 0 ? cardsLeft : 0;

    let decksRemaining = cardsLeft / CARDS_PER_DECK;
    if (decksRemaining <= 0) decksRemaining = 1;
    let trueCount = runningCount / decksRemaining;
    
    trueCountDisplay.textContent = trueCount > 0 ? "+" + trueCount.toFixed(2) : trueCount.toFixed(2);
    
    if (trueCount >= 2) trueCountDisplay.style.color = '#22c55e';
    else if (trueCount <= -1) trueCountDisplay.style.color = '#ef4444';
    else trueCountDisplay.style.color = '#ffd700';

    cardBtns.forEach(btn => {
        let val = btn.getAttribute('data-val');
        let rem = remainingCards[val];
        btn.querySelector('.badge').textContent = rem;
        btn.disabled = rem <= 0;
    });
}

// --- HI-LO LOGIC ---
cardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        let val = btn.getAttribute('data-val');
        if (remainingCards[val] <= 0) return;

        remainingCards[val]--;
        cardsDealt++;

        if (['2','3','4','5','6'].includes(val)) runningCount += 1;
        else if (['10','J','Q','K','A'].includes(val)) runningCount -= 1;

        updateDisplay();
    });
});

resetBtn.addEventListener('click', resetShoe);
decksInput.addEventListener('change', resetShoe);

// --- MODAL & VISUAL SELECTION LOGIC ---
window.openCardSelector = function(role) {
    currentActiveSlot = role;
    modal.style.display = 'block';
    resetModalToSuits();
}

window.closeModal = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

window.resetModalToSuits = function() {
    suitSelector.style.display = 'flex';
    cardPickerGrid.style.display = 'none';
    backBtn.style.display = 'none';
}

window.showCards = function(suit) {
    suitSelector.style.display = 'none';
    cardPickerGrid.style.display = 'flex';
    backBtn.style.display = 'block';
    cardPickerGrid.innerHTML = ''; // Clear previous

    ranks.forEach(rank => {
        let img = document.createElement('img');
        
        let folderName = suit;
        let fileName = `${rank}_of_${suit.toLowerCase()}.png`;
        if(rank === 'queen' || rank === 'king') fileName = `${rank}_of_${suit.toLowerCase()}.jpg`;
        
        // Updated path to match the new structure
        let path = `assets/images/Playing Cards/${folderName}/${fileName}`;
        
        img.src = path;
        img.className = 'modal-card-img';
        img.onclick = () => selectCard(rank, path);
        cardPickerGrid.appendChild(img);
    });
}

function mapRankToValue(rank) {
    if (rank === 'ace') return 'A';
    if (rank === 'jack' || rank === 'queen' || rank === 'king') return '10'; 
    return rank;
}

window.selectCard = function(rank, imgPath) {
    let slotId = currentActiveSlot === 'dealer' ? 'dealer-slot' : 
                 currentActiveSlot === 'player1' ? 'player-slot-1' : 'player-slot-2';
    
    let slotEl = document.getElementById(slotId);
    let imgEl = slotEl.querySelector('img');
    let plusEl = slotEl.querySelector('.plus-icon');
    
    imgEl.src = imgPath;
    imgEl.style.display = 'block';
    plusEl.style.display = 'none';
    slotEl.style.border = 'none'; 

    selectedHands[currentActiveSlot] = mapRankToValue(rank);
    
    closeModal();
    evaluateBasicStrategy();
}

// --- BASIC STRATEGY ENGINE ---
function getNumericValue(val) {
    if (val === 'A') return 11;
    return parseInt(val);
}

function evaluateBasicStrategy() {
    let c1 = selectedHands.player1;
    let c2 = selectedHands.player2;
    let dc = selectedHands.dealer;

    if (!c1 || !c2 || !dc) {
        actionResult.textContent = "Waiting for cards...";
        actionResult.style.color = "var(--text-muted)";
        return;
    }

    let isPair = (c1 === c2);
    let isSoft = (c1 === 'A' || c2 === 'A') && !isPair;
    let dVal = getNumericValue(dc);
    let total = getNumericValue(c1) + getNumericValue(c2);
    
    let action = "STAND";

    if (isPair) {
        let pVal = getNumericValue(c1);
        if (pVal === 11 || pVal === 8) action = "SPLIT";
        else if (pVal === 10) action = "STAND";
        else if (pVal === 9 && dVal !== 7 && dVal !== 10 && dVal !== 11) action = "SPLIT";
        else if (pVal === 7 && dVal <= 7) action = "SPLIT";
        else if (pVal === 6 && dVal <= 6) action = "SPLIT";
        else if (pVal === 5 && dVal <= 9) action = "DOUBLE";
        else if (pVal <= 4 && dVal <= 6) action = "SPLIT";
        else action = "HIT";
    } 
    else if (isSoft) {
        let otherCard = c1 === 'A' ? getNumericValue(c2) : getNumericValue(c1);
        if (otherCard >= 8) action = "STAND";
        else if (otherCard === 7 && dVal <= 8) action = (dVal <= 6) ? "DOUBLE" : "STAND";
        else if (otherCard >= 4 && dVal >= 4 && dVal <= 6) action = "DOUBLE";
        else if (otherCard <= 3 && dVal >= 5 && dVal <= 6) action = "DOUBLE";
        else action = "HIT";
    } 
    else {
        // Hard totals
        if (total >= 17) action = "STAND";
        else if (total >= 13 && dVal <= 6) action = "STAND";
        else if (total === 12 && dVal >= 4 && dVal <= 6) action = "STAND";
        else if (total === 11) action = "DOUBLE";
        else if (total === 10 && dVal <= 9) action = "DOUBLE";
        else if (total === 9 && dVal >= 3 && dVal <= 6) action = "DOUBLE";
        else action = "HIT";
    }

    actionResult.textContent = action;
    
    if(action === "HIT") actionResult.style.color = "#22c55e";
    else if(action === "STAND") actionResult.style.color = "#ef4444";
    else if(action === "DOUBLE") actionResult.style.color = "#ffd700";
    else if(action === "SPLIT") actionResult.style.color = "#a855f7";
}

init();
