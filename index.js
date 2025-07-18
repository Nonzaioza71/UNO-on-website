const canvas = document.getElementById("unoCanvas");
const ctx = canvas.getContext("2d");
const wildColorPicker = document.getElementById("wildColorPicker");
const colors = ["red", "green", "blue", "yellow"];
const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "+2"];
const wilds = ["Wild", "+4"];
let unoDeclared = false;
let gameEnd = false;
let deck = [], playerHands = [], centerCard = {}, currentPlayer = 0, direction = 1;
let discardPile = [];
let activeAnimations = [];
const animationDuration = 400;
let wildCardTemp = null, wildCardIndex = -1;
let justDrawnCard = false;
let handOffset = 0; // เพิ่มตัวแปรสำหรับควบคุมการเลื่อนของมือผู้เล่น

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

function canPlay(card, center) {
    return card?.color === center?.color || card?.value === center?.value || card?.color === "black";
}

function animateCardMovement(card, startX, startY, endX, endY, type, targetHand = null) {
    return new Promise(resolve => {
        const animationInstance = { card, startX, startY, endX, endY, startTime: performance.now(), duration: animationDuration, type, targetHand, resolve };
        activeAnimations.push(animationInstance);
        if (activeAnimations.length === 1) requestAnimationFrame(animationLoop);
    });
}

function animationLoop(currentTime) {
    let animationsFinished = [];
    activeAnimations.forEach(anim => {
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        anim.currentX = anim.startX + (anim.endX - anim.startX) * progress;
        anim.currentY = anim.startY + (anim.endY - anim.startY) * progress;
        if (progress === 1) animationsFinished.push(anim);
    });

    drawGame();

    activeAnimations.forEach(anim => {
        let displayColor = anim.card.color;
        let displayValue = anim.card.value;
        let textColor = displayColor === "yellow" ? "#000" : "white";

        if (anim.type === 'draw' && anim.targetHand === 1) {
            displayColor = "#333";
            displayValue = "UNOx";
            textColor = "white";
        } else if (anim.type === 'draw' && anim.targetHand === 0 && anim.currentY < 400) {
            displayColor = "#333";
            displayValue = "UNOx";
            textColor = "white";
        }
        drawRoundedCard(anim.currentX, anim.currentY, 80, 100, 12, displayColor, displayValue, textColor);
    });

    activeAnimations = activeAnimations.filter(anim => {
        if (animationsFinished.includes(anim)) {
            anim.resolve();
            return false;
        }
        return true;
    });
    if (activeAnimations.length > 0) requestAnimationFrame(animationLoop);
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

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deckRadius = 15;
    const cardWidth = 80;
    const cardHeight = 120;
    const centerCardX = 400;
    const centerCardY = 250;
    const drawPileX = 750;
    const drawPileY = 250;

    // Draw Pile
    drawRoundedCard(drawPileX, drawPileY, cardWidth, cardHeight, deckRadius, "#333", "UNO", "white");

    // Center card
    drawRoundedCard(centerCardX, centerCardY, cardWidth, cardHeight, deckRadius, centerCard?.color === "black" ? "#000" : centerCard?.color || "#fff", centerCard?.value || "", "white");

    // Player 0 (Human)
    ctx.font = "20px Arial";
    ctx.fillText("🧑‍💻 คุณ", 50, 470);
    document.getElementById("unoButton").style.display = ((playerHands?.[0]?.length || 0) === 2 && currentPlayer === 0) ? "inline-block" : "none";

    // คำนวณขอบเขตการเลื่อน
    const playerHand = playerHands?.[0];
    const cardSpacing = 90;
    const initialX = 50;
    const playerHandY = 500;
    const totalHandWidth = (playerHand?.length || 0) * cardSpacing;
    const maxOffset = Math.max(0, totalHandWidth - canvas.width + initialX + cardWidth); // รวมระยะห่างจากการ์ดใบสุดท้ายกับขอบจอ + cardWidth ด้วย

    // จำกัด handOffset ให้อยู่ในช่วงที่ถูกต้อง
    handOffset = Math.max(0, Math.min(handOffset, maxOffset));

    playerHand?.forEach((card, i) => {
        const isAnimatingThisCard = activeAnimations.some(anim => (anim.type === 'play' && anim.card === card) || (anim.type === 'draw' && anim.card === card && anim.targetHand === 0));
        if (isAnimatingThisCard) return;

        // ปรับตำแหน่ง x ด้วย handOffset
        const x = initialX + i * cardSpacing - handOffset;
        const y = playerHandY;
        const textColor = card?.color === "yellow" ? "#000" : "white";
        drawRoundedCard(x, y, 80, 100, 12, card?.color === "black" ? "#000" : card?.color || "#fff", card?.value || "", textColor);

        if (currentPlayer === 0 && (canPlay(card, centerCard) || justDrawnCard)) {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, 80, 100);
        }
    });

    // Bot (Player 1)
    ctx.fillText("🤖 Bot", 50, 50);
    playerHands?.[1]?.forEach((card, i) => {
        const isAnimatingThisCard = activeAnimations.some(anim => (anim.type === 'play' && anim.card === card) || (anim.type === 'draw' && anim.card === card && anim.targetHand === 1));
        if (isAnimatingThisCard) return;

        const x = 50 + i * 90, y = 80;
        drawRoundedCard(x, y, 80, 100, 12, "#333", "UNO", "white");
    });

    // Turn indicator (Top Right Corner)
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    ctx.fillText(currentPlayer === 0 ? "📢 ตาคุณ!" : "🤖 ตา Bot!", canvas.width - 20, 30);
    ctx.textAlign = "left";
}

canvas.addEventListener("click", async function (event) {
    if (currentPlayer !== 0) return;
    const mx = event.offsetX, my = event.offsetY;

    if (mx >= 750 && mx <= 830 && my >= 250 && my <= 370) {
        if (!justDrawnCard) {
            await drawCard(currentPlayer, true);
            justDrawnCard = true;
        }
        return;
    }

    // ตรวจสอบการคลิกที่ไพ่ในมือผู้เล่น (ต้องใช้ handOffset ในการคำนวณตำแหน่ง)
    for (let i = 0; i < (playerHands?.[0]?.length || 0); i++) {
        const card = playerHands?.[0]?.[i];
        // คำนวณตำแหน่ง x ของไพ่ด้วย handOffset
        const x = 50 + i * 90 - handOffset;
        const y = 500;
        const canPlayThisCard = canPlay(card, centerCard);
        const isLastCardDrawn = justDrawnCard && (i === playerHands[0].length - 1);

        if (mx >= x && mx <= x + 80 && my >= y && my <= y + 100) {
            if (!justDrawnCard && canPlayThisCard) {
                if (card?.value === "Wild" || card?.value === "+4") {
                    wildCardTemp = card;
                    wildCardIndex = i;
                    wildColorPicker.style.display = "block";
                    return;
                }
                await playCard(i);
                justDrawnCard = false;
                return;
            } else if (justDrawnCard && isLastCardDrawn && canPlayThisCard) {
                if (card?.value === "Wild" || card?.value === "+4") {
                    wildCardTemp = card;
                    wildCardIndex = i;
                    wildColorPicker.style.display = "block";
                    return;
                }
                await playCard(i);
                justDrawnCard = false;
                return;
            } else if (justDrawnCard && !isLastCardDrawn) {
                Swal.fire({ title: "❗ คุณเพิ่งจั่วไพ่", text: "คุณต้องเล่นไพ่ที่จั่วได้ หรือคลิกที่อื่นเพื่อจบตา", icon: "warning", timer: 2000, showConfirmButton: false });
                return;
            }
        }
    }
    if (justDrawnCard) {
        justDrawnCard = false;
        endTurn();
    }
});

// เพิ่ม Event Listener สำหรับ Mouse Wheel (Scroll)
canvas.addEventListener('wheel', (event) => {
    // ตรวจสอบว่ากำลังเลื่อนบนพื้นที่ไพ่ในมือผู้เล่นหรือไม่
    const playerHandY = 500;
    const playerHandHeight = 100;
    if (event.offsetY >= playerHandY && event.offsetY <= playerHandY + playerHandHeight) {
        const scrollSpeed = 50; // ปรับความเร็วในการเลื่อน
        handOffset += event.deltaY > 0 ? scrollSpeed : -scrollSpeed; // เลื่อนตามทิศทาง wheel

        // คำนวณขอบเขตการเลื่อนอีกครั้งเพื่อจำกัด handOffset
        const playerHand = playerHands?.[0];
        const cardSpacing = 90;
        const initialX = 50;
        const cardWidth = 80;
        const totalHandWidth = (playerHand?.length || 0) * cardSpacing;
        const maxOffset = Math.max(0, totalHandWidth - canvas.width + initialX + cardWidth); // รวมระยะห่างจากการ์ดใบสุดท้ายกับขอบจอ + cardWidth ด้วย

        handOffset = Math.max(0, Math.min(handOffset, maxOffset));
        drawGame(); // วาดเกมใหม่เพื่อแสดงการเลื่อน
        event.preventDefault(); // ป้องกันการ scroll หน้าเว็บหลัก
    }
}, { passive: false }); // ใช้ { passive: false } เพื่อให้ preventDefault() ทำงานได้

document.getElementById("unoButton").addEventListener("click", () => {
    unoDeclared = true;
    Swal.fire({ title: "คุณประกาศ UNO แล้ว! ✅", timer: 1200, showConfirmButton: false });
});

function drawRoundedCard(x, y, width, height, radius = 12, color = "red", value = "5", textColor = "white") {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = "20px Arial";
    ctx.fillText(value, x + width / 2 - ctx.measureText(value).width / 2, y + height / 2 + 7);
}

async function playCard(index) {
    const hand = playerHands?.[currentPlayer];
    if (!hand || index < 0 || index >= hand.length) { console.warn("❗ ไม่พบไพ่ตำแหน่งนี้:", index); return; }
    const card = hand?.[index];
    // ปรับ startX โดยใช้ handOffset เพราะไพ่ถูกวาดด้วย offset
    const startX = 50 + index * 90 - handOffset;
    const startY = (currentPlayer === 0) ? 500 : 80;
    const endX = 400;
    const endY = 250;

    hand?.splice(index, 1);

    let cardForAnimation = card?.color === "black" ? centerCard : card;
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

    if (card?.value === "Reverse") { direction *= -1; endTurn(); }
    else if (card?.value === "Skip") { endTurn(true); }
    else if (card?.value === "+2") {
        const playerToDraw = (currentPlayer + direction + 2) % 2;
        for (let i = 0; i < 2; i++) await drawCard(playerToDraw, true);
        endTurn(true);
    } else if (card?.value === "+4") {
        const playerToDraw = (currentPlayer + direction + 2) % 2;
        for (let i = 0; i < 4; i++) await drawCard(playerToDraw, true);
        endTurn(true);
    } else { endTurn(); }
}

async function chooseWildColor(colorChosen) {
    const cardToPlay = wildCardTemp;
    // ปรับ startX โดยใช้ handOffset เพราะไพ่ถูกวาดด้วย offset
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
        for (let i = 0; i < 4; i++) await drawCard(playerToDraw, true);
        endTurn(true);
    } else { endTurn(); }
}

function endTurn(skipNext = false) {
    justDrawnCard = false;
    currentPlayer = (currentPlayer + direction + 2) % 2;
    if (skipNext) currentPlayer = (currentPlayer + direction + 2) % 2;
    drawGame();
    if (currentPlayer === 1) setTimeout(async () => await botTurn(), 800);
}

function checkWin() {
    if ((playerHands?.[currentPlayer]?.length || 0) === 0 && gameEnd == false) {
        const winnerName = currentPlayer === 0 ? "คุณชนะแล้ว 🎉" : "Bot ชนะแล้ว 🤖";
        gameEnd = true;
        Swal.fire({ title: winnerName, text: "ขอบคุณที่เล่น UNO กับเรา!", icon: "success", confirmButtonText: "เริ่มใหม่อีกครั้ง", allowOutsideClick: false }).then(() => {
            initGame();
            gameEnd = false;
        });
        return true;
    }
    return false;
}

function getMostFrequentColor(hand, cardToExclude) {
    const colorCount = { "red": 0, "green": 0, "blue": 0, "yellow": 0 };
    hand?.forEach(card => {
        if (card !== cardToExclude && colors.includes(card?.color)) colorCount[card.color]++;
    });
    let maxCount = -1;
    let mostFrequent = "red";
    for (const color of colors) {
        if (colorCount[color] > maxCount) {
            maxCount = colorCount[color];
            mostFrequent = color;
        }
    }
    return mostFrequent;
}

async function botTurn() {
    if (currentPlayer !== 1) return;
    const botHand = playerHands?.[1];
    const opponentHandSize = playerHands?.[0]?.length || 0;
    let cardToPlay = null;
    let chosenColor = null;

    const playableCards = botHand?.filter(card => canPlay(card, centerCard)) || [];
    if (playableCards.length === 0) {
        await drawCard(1, true);
        endTurn();
        recordStrategyOutcome(false); // ถ้าบอทไม่ได้เล่น = แพ้
        return;
    }

    // กลยุทธ์ตอบโต้เมื่อผู้เล่นใกล้ชนะ
    if (opponentHandSize <= 2) {
        cardToPlay = playableCards.find(c => c.value === "+4");
        if (cardToPlay) {
            chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
            botStrategyUsage.colorBaiting = true;
            botStrategyUsage.counterUNO = true;
        }

        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "+2");
            if (cardToPlay) botStrategyUsage.counterUNO = true;
        }

        if (!cardToPlay && opponentHandSize === 1) {
            const consider = ["Reverse"];
            if (shouldUseSkip() && !shouldAvoidStrategy("aggressiveSkip")) {
                consider.push("Skip");
            }
            cardToPlay = playableCards.find(c => consider.includes(c.value));
            if (cardToPlay?.value === "Skip") {
                botStrategyUsage.aggressiveSkip = true;
            }
        }
    }

    // กลยุทธ์ลดจำนวนไพ่
    if (!cardToPlay) {
        const regular = playableCards.filter(c => c.color !== "black");
        cardToPlay = regular.find(c => c.color === centerCard?.color)
            || regular.find(c => c.value === centerCard?.value)
            || regular.find(c => ["Skip", "Reverse", "+2"].includes(c.value));
    }

    // กลยุทธ์ใช้ Wild เฉพาะจำเป็น
    if (!cardToPlay) {
        const wildCard = playableCards.find(c => c.value === "Wild");
        const hasSafePlay = playableCards.some(c => c.color !== "black");
        const avoidWild = shouldAvoidStrategy("wildDelay");
        if (wildCard && (!hasSafePlay || opponentHandSize <= 2 || botHand.length > 5) && !avoidWild) {
            cardToPlay = wildCard;
            botStrategyUsage.wildDelay = true;
        }
    }

    // กลยุทธ์ใช้ +4 เป็นทางเลือกสุดท้าย
    if (!cardToPlay) {
        cardToPlay = playableCards.find(c => c.value === "+4");
        if (cardToPlay) {
            chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
            botStrategyUsage.colorBaiting = true;
        }
    }

    // เลือกสีเมื่อเล่นการ์ดดำ
    if (cardToPlay?.color === "black") {
        chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
    }

    // เล่นการ์ด
    if (cardToPlay) {
        const index = botHand.indexOf(cardToPlay);
        const startX = 50 + index * 90;
        const startY = 80;
        const endX = 400;
        const endY = 250;

        const playedCardFinal = cardToPlay.color === "black"
            ? { ...cardToPlay, color: chosenColor || "red" }
            : cardToPlay;

        botHand.splice(index, 1);
        discardPile.push(centerCard);
        centerCard = playedCardFinal;

        await animateCardMovement(playedCardFinal, startX, startY, endX, endY, 'play', currentPlayer);
        if (checkWin()) {
            recordStrategyOutcome(true);
            saveOpponentStatsToLocalStorage();
            return;
        }

        switch (playedCardFinal.value) {
            case "Reverse": direction *= -1; endTurn(); break;
            case "Skip": endTurn(true); break;
            case "+2":
                const target2 = (currentPlayer + direction + 2) % 2;
                for (let i = 0; i < 2; i++) await drawCard(target2, true);
                endTurn(true); break;
            case "+4":
                const target4 = (currentPlayer + direction + 2) % 2;
                for (let i = 0; i < 4; i++) await drawCard(target4, true);
                endTurn(true); break;
            default: endTurn(); break;
        }

        saveOpponentStatsToLocalStorage();
    } else {
        await drawCard(1, true);
        endTurn();
        recordStrategyOutcome(false);
    }
}

// const opponentStats = {
//     playedColors: { red: 0, green: 0, blue: 0, yellow: 0 },
//     actionUsage: { Skip: 0, Reverse: 0, "+2": 0, "+4": 0 },
//     totalTurns: 0
// };

// const botStrategyUsage = {
//     aggressiveSkip: true,
//     colorBaiting: true,
//     wildDelay: true,
//     counterUNO: true
// };

// บันทึกการ์ดที่ผู้เล่นเล่น
function trackOpponentPlay(card) {
    if (card.color && card.color !== "black") {
        opponentStats.playedColors[card.color]++;
    }
    if (["Skip", "Reverse", "+2", "+4"].includes(card.value)) {
        opponentStats.actionUsage[card.value]++;
    }
    opponentStats.totalTurns++;
}

// วิเคราะห์ Win Rate ของกลยุทธ์
function getStrategyWinRate(strategyName) {
    const raw = localStorage.getItem("uno_strategyHistory");
    if (!raw) return null;
    const stats = JSON.parse(raw)[strategyName];
    const total = (stats?.wins || 0) + (stats?.losses || 0);
    return total > 0 ? stats.wins / total : null;
}

function shouldAvoidStrategy(strategyName) {
    const rate = getStrategyWinRate(strategyName);
    return rate !== null && rate < 0.4; // เลี่ยงถ้า win rate ต่ำ
}

// บันทึกผลลัพธ์ของกลยุทธ์หลังเกม
function recordStrategyOutcome(win) {
    const raw = localStorage.getItem("uno_strategyHistory");
    const history = raw ? JSON.parse(raw) : {};
    for (const key in botStrategyUsage) {
        if (!history[key]) history[key] = { wins: 0, losses: 0 };
        history[key][win ? "wins" : "losses"]++;
    }
    localStorage.setItem("uno_strategyHistory", JSON.stringify(history));
}

function resetOpponentStats() {
    opponentStats.playedColors = { red: 0, green: 0, blue: 0, yellow: 0 };
    opponentStats.actionUsage = { Skip: 0, Reverse: 0, "+2": 0, "+4": 0 };
    opponentStats.totalTurns = 0;
}

function saveOpponentStatsToLocalStorage() {
    localStorage.setItem("uno_opponentStats", JSON.stringify(opponentStats));
}

function loadOpponentStatsFromLocalStorage() {
    const raw = localStorage.getItem("uno_opponentStats");
    if (raw) Object.assign(opponentStats, JSON.parse(raw));
}

function getOpponentWeakColor() {
    const sorted = Object.entries(opponentStats.playedColors)
        .sort((a, b) => a[1] - b[1]);
    return sorted[0]?.[0];
}

function shouldUseSkip() {
    const rate = opponentStats.actionUsage["Skip"] / (opponentStats.totalTurns || 1);
    return rate >= 0.2;
}

async function initGame() {
    gameEnd = false;
    deck = [];
    playerHands = [[], []];
    discardPile = [];
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
    handOffset = 0; // รีเซ็ต offset เมื่อเริ่มเกมใหม่
    drawGame();

    if (currentPlayer === 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await botTurn();
    }
}

initGame();