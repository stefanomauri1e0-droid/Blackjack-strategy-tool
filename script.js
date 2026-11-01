// --- GAME STATE ---
let totalDecks = 6;
const CARDS_PER_DECK = 52;
let totalCards = totalDecks * CARDS_PER_DECK;
let cardsDealt = 0;
let runningCount = 0;

// Object to track exact remaining copies of each card rank
let remainingCards = {};

// --- DOM ELEMENTS ---
const decksInput = document.getElementById('decks');
const resetBtn = document.getElementById('reset-btn');
const runningCountDisplay = document.getElementById('running-count');
const trueCountDisplay = document.getElementById('true-count');
const cardsLeftDisplay = document.getElementById('cards-left');
const cardBtns = document.querySelectorAll('.card-btn');

const pCard1 = document.getElementById('p-card-1');
const pCard2 = document.getElementById('p-card-2');
const dCard = document.getElementById('d-card');
const actionResult = document.getElementById('action-result');

const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const strategyValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']; // Only 10 for faces in strategy

// --- INITIALIZATION ---
function init() {
    populateSelects();
    resetShoe();
}

function resetShoe() {
    totalDecks = parseInt(decksInput.value) || 6;
    totalCards = totalDecks * CARDS_PER_DECK;
    cardsDealt = 0;
    runningCount = 0;
    
    // Initialize available copies for each card rank (4 suits per deck)
    cardValues.forEach(val => {
        remainingCards[val] = totalDecks * 4;
    });

    updateDisplay();
}

function updateDisplay() {
    runningCountDisplay.textContent = runningCount;
    let cardsLeft = totalCards - cardsDealt;
    cardsLeftDisplay.textContent = cardsLeft > 0 ? cardsLeft : 0;

    // Calculate True Count = Running Count / Remaining Decks
    let decksRemaining = cardsLeft / CARDS_PER_DECK;
    if (decksRemaining <= 0) decksRemaining = 1; // Prevent division by zero
    let trueCount = runningCount / decksRemaining;
    
    trueCountDisplay.textContent = trueCount > 0 ? "+" + trueCount.toFixed(2) : trueCount.toFixed(2);
    
    // UI Color coding based on advantage
    if (trueCount >= 2) trueCountDisplay.style.color = '#22c55e'; // Green: Player advantage
    else if (trueCount <= -1) trueCountDisplay.style.color = '#ef4444'; // Red: House advantage
    else trueCountDisplay.style.color = '#38bdf8'; // Blue: Neutral

    // Update buttons badges and disable state
    cardBtns.forEach(btn => {
        let val = btn.getAttribute('data-val');
        let rem = remainingCards[val];
        
        btn.querySelector('.badge').textContent = rem;
        
        if (rem <= 0) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

// --- CARD COUNTING LOGIC (Hi-Lo System) ---
cardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        let val = btn.getAttribute('data-val');
        
        // Prevent action if no cards of this rank are left
        if (remainingCards[val] <= 0) return;

        remainingCards[val]--;
        cardsDealt++;

        // Hi-Lo rules
        if (['2','3','4','5','6'].includes(val)) {
            runningCount += 1;
        } else if (['10','J','Q','K','A'].includes(val)) {
            runningCount -= 1;
        } 
        // 7, 8, 9 are 0, so no change to runningCount

        updateDisplay();
    });
});

resetBtn.addEventListener('click', resetShoe);
decksInput.addEventListener('change', resetShoe);

// --- BASIC STRATEGY LOGIC ---
function populateSelects() {
    [pCard1, pCard2, dCard].forEach(select => {
        strategyValues.forEach(val => {
            let option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            select.appendChild(option);
        });
        select.addEventListener('change', calculateStrategy);
    });
}

function getValue(card) {
    if (card === 'A') return 11;
    return parseInt(card);
}

function calculateStrategy() {
    let c1 = pCard1.value;
    let c2 = pCard2.value;
    let dc = getValue(dCard.value);
    
    let isPair = (c1 === c2);
    let isSoft = (c1 === 'A' || c2 === 'A') && !isPair;
    let total = getValue(c1) + getValue(c2);
    
    let action = "STAND"; // Default fallback

    // Simplified multi-deck engine logic
    if (isPair) {
        let pVal = getValue(c1);
        if (pVal === 11 || pVal === 8) action = "SPLIT";
        else if (pVal === 10) action = "STAND";
        else if (pVal === 9 && dc !== 7 && dc !== 10 && dc !== 11) action = "SPLIT";
        else if (pVal === 7 && dc <= 7) action = "SPLIT";
        else if (pVal === 6 && dc <= 6) action = "SPLIT";
        else if (pVal === 5 && dc <= 9) action = "DOUBLE";
        else if (pVal <= 4 && dc <= 6) action = "SPLIT";
        else action = "HIT";
    } 
    else if (isSoft) {
        let otherCard = c1 === 'A' ? getValue(c2) : getValue(c1);
        if (otherCard >= 8) action = "STAND";
        else if (otherCard === 7 && dc <= 8) action = (dc <= 6) ? "DOUBLE" : "STAND";
        else if (otherCard >= 4 && dc >= 4 && dc <= 6) action = "DOUBLE";
        else if (otherCard <= 3 && dc >= 5 && dc <= 6) action = "DOUBLE";
        else action = "HIT";
    } 
    else {
        // Hard totals
        if (total >= 17) action = "STAND";
        else if (total >= 13 && dc <= 6) action = "STAND";
        else if (total === 12 && dc >= 4 && dc <= 6) action = "STAND";
        else if (total === 11) action = "DOUBLE";
        else if (total === 10 && dc <= 9) action = "DOUBLE";
        else if (total === 9 && dc >= 3 && dc <= 6) action = "DOUBLE";
        else action = "HIT";
    }

    actionResult.textContent = action;
    
    // Color coding for actions
    if(action === "HIT") actionResult.style.color = "#22c55e"; // Green
    else if(action === "STAND") actionResult.style.color = "#ef4444"; // Red
    else if(action === "DOUBLE") actionResult.style.color = "#eab308"; // Yellow
    else if(action === "SPLIT") actionResult.style.color = "#a855f7"; // Purple
}

init();
