// --- GAME STATE & HI-LO ---
let totalDecks = 6;
const CARDS_PER_DECK = 52;
let totalCards = totalDecks * CARDS_PER_DECK;
let cardsDealt = 0;
let runningCount = 0;
let remainingCards = {};
let isRemovingMode = true; 

// --- STRATEGY UI STATE ---
let strategyDecks = 1;
let dealerCard = null; // Object: { rank, imgPath, exactId, val }
let playerHands = []; // Array of { id, cards: [], locked: [] }
let nextHandId = 1;

let currentActiveSlot = null; // { role: 'dealer' | 'player', handIndex?: num, cardIndex?: num }

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// --- DOM ELEMENTS ---
const decksInput = document.getElementById('decks');
const resetBtn = document.getElementById('reset-btn');
const runningCountDisplay = document.getElementById('running-count');
const trueCountDisplay = document.getElementById('true-count');
const cardsLeftDisplay = document.getElementById('cards-left');
const cardBtns = document.querySelectorAll('.card-btn');
const modeRemoveBtn = document.getElementById('mode-remove');
const modeAddBtn = document.getElementById('mode-add');

const strategyDeckBtns = document.querySelectorAll('#strategy-deck-toggle .deck-btn');
const dealerArea = document.getElementById('dealer-area');
const playerHandsContainer = document.getElementById('player-hands-container');
const modal = document.getElementById('card-modal');
const suitSelector = document.querySelector('.suit-selector');
const cardPickerGrid = document.getElementById('card-picker-grid');
const backBtn = document.getElementById('back-to-suits');

// --- INITIALIZATION ---
function init() {
    resetShoe();
    window.resetTable();
}

function resetShoe() {
    totalDecks = parseInt(decksInput.value) || 6;
    totalCards = totalDecks * CARDS_PER_DECK;
    cardsDealt = 0;
    runningCount = 0;
    
    cardValues.forEach(val => { remainingCards[val] = totalDecks * 4; });
    updateDisplay();
}

// --- ADD / REMOVE TOGGLE LOGIC ---
modeRemoveBtn.addEventListener('click', () => {
    isRemovingMode = true;
    modeRemoveBtn.classList.add('active'); modeAddBtn.classList.remove('active');
    updateDisplay();
});

modeAddBtn.addEventListener('click', () => {
    isRemovingMode = false;
    modeAddBtn.classList.add('active'); modeRemoveBtn.classList.remove('active');
    updateDisplay();
});

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

    let maxCopies = totalDecks * 4;
    cardBtns.forEach(btn => {
        let val = btn.getAttribute('data-val');
        let rem = remainingCards[val];
        btn.querySelector('.badge').textContent = rem;
        
        if (isRemovingMode) btn.disabled = rem <= 0;
        else btn.disabled = rem >= maxCopies;
    });
}

cardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        let val = btn.getAttribute('data-val');
        let maxCopies = totalDecks * 4;

        if (isRemovingMode) {
            if (remainingCards[val] <= 0) return;
            remainingCards[val]--; cardsDealt++;
            if (['2','3','4','5','6'].includes(val)) runningCount += 1;
            else if (['10','J','Q','K','A'].includes(val)) runningCount -= 1;
        } else {
            if (remainingCards[val] >= maxCopies) return;
            remainingCards[val]++; cardsDealt--;
            if (['2','3','4','5','6'].includes(val)) runningCount -= 1;
            else if (['10','J','Q','K','A'].includes(val)) runningCount += 1;
        }
        updateDisplay();
    });
});

resetBtn.addEventListener('click', resetShoe);
decksInput.addEventListener('change', resetShoe);


// --- STRATEGY ENGINE UI MANAGEMENT ---

// Deck Toggle
strategyDeckBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        strategyDeckBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        strategyDecks = parseInt(e.target.getAttribute('data-val'));
        window.resetTable();
    });
});

window.resetTable = function() {
    dealerCard = null;
    nextHandId = 1;
    playerHands = [ { id: nextHandId++, cards: [null, null], locked: [false, false] } ];
    renderTable();
}

window.addCardSlot = function(hIndex) {
    let limit = strategyDecks === 1 ? 11 : 12;
    if (playerHands[hIndex].cards.length < limit) {
        playerHands[hIndex].cards.push(null);
        playerHands[hIndex].locked.push(false);
        renderTable();
    }
}

window.removeCardSlot = function(hIndex) {
    if (playerHands[hIndex].cards.length > 2) {
        playerHands[hIndex].cards.pop();
        playerHands[hIndex].locked.pop();
        renderTable();
    }
}

window.splitHand = function(hIndex) {
    if (playerHands.length >= 4) return; // Max 4 hands allowed
    
    let currentHand = playerHands[hIndex];
    let splitCard = currentHand.cards[1];
    
    // Lock original hand's first card, empty the second
    currentHand.cards = [currentHand.cards[0], null];
    currentHand.locked = [true, false];

    // Create new hand
    playerHands.push({
        id: nextHandId++,
        cards: [splitCard, null],
        locked: [true, false]
    });
    
    renderTable();
}

function renderTable() {
    // 1. Render Dealer
    dealerArea.innerHTML = `
        <div class="table-label">Dealer's Hand</div>
        <div class="card-slots">
            <div class="card-slot static-back">
                <img src="assets/images/Playing%20Cards/red_card_back.png" alt="Card Back">
            </div>
            <div class="card-slot interactive-slot" onclick="openDealerSelector()">
                ${dealerCard 
                    ? `<img src="${dealerCard.imgPath}" alt="" class="selected-card-img" style="display:block;">` 
                    : `<span class="plus-icon" style="display:block;">+</span><img src="" style="display:none;">`}
            </div>
        </div>
    `;

    // 2. Render Player Hands
    let handsHtml = '';
    playerHands.forEach((hand, hIndex) => {
        
        // Evaluate logic to show actions and split button
        let canSplit = false;
        if (hand.cards.length === 2 && hand.cards[0] && hand.cards[1]) {
            // Check if numeric values are equal for splitting
            if (getNumericValue(hand.cards[0].val) === getNumericValue(hand.cards[1].val)) {
                if (playerHands.length < 4) canSplit = true;
            }
        }

        let actionObj = evaluateDynamicHand(hand.cards, dealerCard);
        
        let slotsHtml = hand.cards.map((card, cIndex) => {
            let isLocked = hand.locked[cIndex];
            let content = card 
                ? `<img src="${card.imgPath}" alt="" style="display:block;">` 
                : `<span class="plus-icon">+</span>`;
            
            if (isLocked && card) {
                return `<div class="card-slot locked">${content}</div>`;
            } else {
                return `<div class="card-slot interactive-slot" onclick="openPlayerSelector(${hIndex}, ${cIndex})">${content}</div>`;
            }
        }).join('');

        handsHtml += `
            <div class="hand-wrapper dark-wrap">
                <div class="table-label">YOUR HAND ${hand.id}</div>
                <div class="card-slots">${slotsHtml}</div>
                
                <div class="hand-controls">
                    <button class="btn-remove-slot" onclick="removeCardSlot(${hIndex})">-</button>
                    <button class="btn-add-slot" onclick="addCardSlot(${hIndex})">+</button>
                </div>
                
                <div class="action-box">
                    <span class="label">Recommended Action:</span>
                    <span class="action-result ${actionObj.cssClass}">${actionObj.text}</span>
                </div>
                
                ${canSplit ? `<button class="split-btn" onclick="splitHand(${hIndex})">SPLIT</button>` : ''}
            </div>
        `;
    });

    playerHandsContainer.innerHTML = handsHtml;
}

// --- MODAL SELECTION LOGIC ---
window.openDealerSelector = function() {
    currentActiveSlot = { role: 'dealer' };
    modal.style.display = 'block';
    resetModalToSuits();
}

window.openPlayerSelector = function(handIndex, cardIndex) {
    currentActiveSlot = { role: 'player', handIndex, cardIndex };
    modal.style.display = 'block';
    resetModalToSuits();
}

window.closeModal = function() { modal.style.display = 'none'; }
window.onclick = function(event) { if (event.target == modal) closeModal(); }
window.resetModalToSuits = function() {
    suitSelector.style.display = 'flex';
    cardPickerGrid.style.display = 'none';
    backBtn.style.display = 'none';
}

window.showCards = function(suit) {
    suitSelector.style.display = 'none';
    cardPickerGrid.style.display = 'flex';
    backBtn.style.display = 'block';
    cardPickerGrid.innerHTML = ''; 

    ranks.forEach(rank => {
        let exactCardId = `${rank}_of_${suit.toLowerCase()}`;
        let fileName = exactCardId + '.png';
        let path = `assets/images/Playing%20Cards/${suit}/${fileName}`;
        
        // Count limits
        let countOnTable = 0;
        if (dealerCard && dealerCard.exactId === exactCardId) countOnTable++;
        playerHands.forEach(hand => {
            hand.cards.forEach(card => {
                if (card && card.exactId === exactCardId) countOnTable++;
            });
        });

        let img = document.createElement('img');
        img.src = path;
        img.className = 'modal-card-img';
        
        if (countOnTable >= strategyDecks) {
            img.classList.add('disabled');
        } else {
            img.onclick = () => selectCard(rank, path, exactCardId);
        }
        
        cardPickerGrid.appendChild(img);
    });
}

function mapRankToValue(rank) {
    if (rank === 'ace') return 'A';
    if (rank === 'jack' || rank === 'queen' || rank === 'king') return '10'; 
    return rank;
}

window.selectCard = function(rank, imgPath, exactId) {
    let cardObj = { rank, imgPath, exactId, val: mapRankToValue(rank) };
    
    if (currentActiveSlot.role === 'dealer') {
        dealerCard = cardObj;
    } else {
        playerHands[currentActiveSlot.handIndex].cards[currentActiveSlot.cardIndex] = cardObj;
    }
    closeModal();
    renderTable(); 
}

// --- DYNAMIC BASIC STRATEGY MATH ---
function getNumericValue(val) {
    if (val === 'A') return 11;
    return parseInt(val);
}

function evaluateDynamicHand(cardsArray, dealerCardObj) {
    if (!dealerCardObj || cardsArray.includes(null)) {
        return { text: "Waiting...", cssClass: "waiting" };
    }

    let dVal = getNumericValue(dealerCardObj.val);
    let action = "STAND";

    if (cardsArray.length === 2) {
        let c1 = cardsArray[0].val;
        let c2 = cardsArray[1].val;
        let isPair = (c1 === c2); // We check actual string val so A,A is pair, 10,10 is pair.
        let isSoft = (c1 === 'A' || c2 === 'A') && !isPair;
        let total = getNumericValue(c1) + getNumericValue(c2);

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
            
            // Revert Split if max hands reached
            if (action === "SPLIT" && playerHands.length >= 4) {
                // If we can't split, we treat it as a hard total.
                isPair = false; 
            }
        } 
        
        if (!isPair && isSoft) {
            let otherCard = c1 === 'A' ? getNumericValue(c2) : getNumericValue(c1);
            if (otherCard >= 8) action = "STAND";
            else if (otherCard === 7 && dVal <= 8) action = (dVal <= 6) ? "DOUBLE" : "STAND";
            else if (otherCard >= 4 && dVal >= 4 && dVal <= 6) action = "DOUBLE";
            else if (otherCard <= 3 && dVal >= 5 && dVal <= 6) action = "DOUBLE";
            else action = "HIT";
        } 
        else if (!isPair && !isSoft) {
            // Hard totals
            if (total >= 17) action = "STAND";
            else if (total >= 13 && dVal <= 6) action = "STAND";
            else if (total === 12 && dVal >= 4 && dVal <= 6) action = "STAND";
            else if (total === 11) action = "DOUBLE";
            else if (total === 10 && dVal <= 9) action = "DOUBLE";
            else if (total === 9 && dVal >= 3 && dVal <= 6) action = "DOUBLE";
            else action = "HIT";
        }
    } else {
        // HAND HAS > 2 CARDS
        let sum = 0;
        let aces = 0;
        cardsArray.forEach(c => {
            if (c.val === 'A') { aces++; sum += 11; }
            else sum += getNumericValue(c.val);
        });

        // Adjust for soft aces
        while (sum > 21 && aces > 0) {
            sum -= 10;
            aces--;
        }

        let isSoft = aces > 0;
        
        if (sum > 21) {
            return { text: "BUST", cssClass: "stand" };
        }

        if (isSoft) {
            // Basic soft rules for > 2 cards (No doubles allowed)
            if (sum >= 18) action = "STAND"; // Some rules hit soft 18 vs 9,10,A but stand is safer fallback
            else action = "HIT";
        } else {
            // Hard totals > 2 cards
            if (sum >= 17) action = "STAND";
            else if (sum >= 13 && dVal <= 6) action = "STAND";
            else if (sum === 12 && dVal >= 4 && dVal <= 6) action = "STAND";
            else action = "HIT"; 
            // Note: 9, 10, 11 would normally double, but with >2 cards you can only HIT
        }
    }

    let cssClass = action.toLowerCase();
    return { text: action, cssClass };
}

init();
