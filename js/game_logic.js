let deck = [];
let playerHands = [];
let centerCard = {};
let currentPlayer = 0;
let direction = 1;
let discardPile = [];
let unoDeclared = false;
let gameEnd = false;
let justDrawnCard = false;
let wildCardTemp = null;
let wildCardIndex = -1;
let handOffset = 0;
let isProcessingTurn = false;

function createDeck() {
    deck = [];
    colors.forEach(color => {
        values.forEach(val => {
            deck.push({ color, value: val });
            if (val !== "0") deck.push({ color, value: val });
        });
    });
    wilds.forEach(val => {
        for (let i = 0; i < 4; i++) deck.push({ color: "black", value: val });
    });
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards(numPlayers = 2) {
    playerHands = Array.from({ length: numPlayers }, () => []);
    for (let i = 0; i < 7; i++) {
        for (let p = 0; p < numPlayers; p++) {
            if (deck.length > 0) playerHands[p].push(deck.pop());
            else { console.error("Deck is empty while dealing cards!"); break; }
        }
    }
}

async function drawCard(player, withAnimation = true) {
    if (deck.length === 0) {
        const currentCenter = centerCard;
        deck = [...discardPile.filter(card => card !== currentCenter)];
        shuffleDeck();
        discardPile = [];
        if (deck.length === 0) {
            createDeck();
            shuffleDeck();
        }
    }
    
    const cardDrawn = deck.pop();
    if (!withAnimation) {
        playerHands?.[player]?.push(cardDrawn);
        drawGame();
        return;
    }

    const startX = 750;
    const startY = 250;
    let endX = 50 + (playerHands?.[player]?.length || 0) * 90;
    let endY = (player === 0) ? 500 : 80;
    
    await animateCardMovement(cardDrawn, startX, startY, endX, endY, 'draw', player);
    playerHands?.[player]?.push(cardDrawn);
    drawGame();
}

async function playCard(index) {
    if (isProcessingTurn) return;
    isProcessingTurn = true;

    const hand = playerHands?.[currentPlayer];
    if (!hand || index < 0 || index >= hand.length) {
        console.warn("❗ ไม่พบไพ่ตำแหน่งนี้:", index);
        isProcessingTurn = false;
        return;
    }
    const card = hand?.[index];

    const startX = (currentPlayer === 0) ? (50 + index * 90 - handOffset) : (50 + index * 90);
    const startY = (currentPlayer === 0) ? 500 : 80;
    const endX = 400;
    const endY = 250;
    
    hand.splice(index, 1);

    let cardForAnimation = card?.color === "black" ? { ...card, color: centerCard?.color || "black"} : card;
    await animateCardMovement(cardForAnimation, startX, startY, endX, endY, 'play', currentPlayer);
    
    discardPile.push(centerCard);
    centerCard = card;

    if ((playerHands?.[0]?.length || 0) === 1 && currentPlayer === 0 && !unoDeclared) {
        Swal.fire({ title: "❗ Bot แย้ง! คุณลืมประกาศ UNO!", text: "คุณต้องจั่วเพิ่ม 2 ใบ", icon: "error", timer: 3000, showConfirmButton: false });
        await drawCard(currentPlayer, true);
        await drawCard(currentPlayer, true);
    }
    unoDeclared = false;

    if (checkWin()) return;

    if (card?.value === "Reverse") { 
        direction *= -1; 
        endTurn();
    }
    else if (card?.value === "Skip") { 
        endTurn(true);
    }
    else if (card?.value === "+2") {
        const playerToDraw = (currentPlayer + direction + 2) % 2;
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        endTurn();
    } else if (card?.value === "+4") {
        const playerToDraw = (currentPlayer + direction + 2) % 2;
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        endTurn();
    } else { 
        endTurn();
    }
    
    if (currentPlayer === 0) {
        trackOpponentPlay(card);
        saveOpponentStatsToLocalStorage();
    }
}

async function chooseWildColor(colorChosen) {
    if (isProcessingTurn) return;
    isProcessingTurn = true;

    const cardToPlay = wildCardTemp;
    const startX = 50 + wildCardIndex * 90 - handOffset;
    const startY = 500;
    const endX = 400;
    const endY = 250;

    playerHands?.[currentPlayer]?.splice(wildCardIndex, 1);
    wildColorPicker.style.display = "none";

    const playedCardWithColor = { ...cardToPlay, color: colorChosen };

    discardPile.push(centerCard);
    centerCard = playedCardWithColor;

    await animateCardMovement(playedCardWithColor, startX, startY, endX, endY, 'play', currentPlayer);

    if (checkWin()) return;

    if (playedCardWithColor?.value === "+4") {
        const playerToDraw = (currentPlayer + direction + 2) % 2;
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        await drawCard(playerToDraw, true);
        endTurn();
    } else {
        endTurn();
    }
    
    if (currentPlayer === 0) {
        trackOpponentPlay(playedCardWithColor);
        saveOpponentStatsToLocalStorage();
    }
}

function endTurn(skipNext = false) {
    justDrawnCard = false;
    currentPlayer = (currentPlayer + direction + 2) % 2;
    if (skipNext) currentPlayer = (currentPlayer + direction + 2) % 2;
    
    drawGame();
    isProcessingTurn = false;

    if (currentPlayer === 1) {
        setTimeout(async () => {
            await botTurn();
        }, 800);
    }
}

function checkWin() {
    if ((playerHands?.[currentPlayer]?.length || 0) === 0 && gameEnd == false) {
        const winnerName = currentPlayer === 0 ? "คุณชนะแล้ว 🎉" : "Bot ชนะแล้ว 🤖";
        gameEnd = true;

        recordStrategyOutcome(!(currentPlayer === 0));
        saveOpponentStatsToLocalStorage();

        Swal.fire({
            title: winnerName,
            text: "ขอบคุณที่เล่น UNO กับเรา!",
            icon: "success",
            confirmButtonText: "เริ่มใหม่อีกครั้ง",
            allowOutsideClick: false
        }).then(() => {
            initGame();
            gameEnd = false;
        });
        isProcessingTurn = false;
        return true;
    }
    return false;
}

async function initGame() {
    gameEnd = false;
    deck = [];
    playerHands = [[], []];
    discardPile = [];
    activeAnimations = [];
    unoDeclared = false;
    justDrawnCard = false;
    handOffset = 0;
    isProcessingTurn = false;

    createDeck();
    shuffleDeck();
    dealCards();
    
    do {
        centerCard = deck.pop(); 
        if (!centerCard && deck.length === 0) {
            if (discardPile.length > 0) {
                deck = [...discardPile];
                shuffleDeck();
                discardPile = [];
            } else {
                createDeck();
                shuffleDeck();
            }
            centerCard = deck.pop();
        }
    } while (centerCard?.color === "black");

    currentPlayer = Math.floor(Math.random() * 2);

    for (const key in botStrategyUsage) {
        botStrategyUsage[key].usedInTurn = false;
    }
    loadOpponentStatsFromLocalStorage();
    drawGame();
    
    if (currentPlayer === 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await botTurn();
    }
}
