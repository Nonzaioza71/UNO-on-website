// js/utils.js

// Global Variables
const colors = ["red", "green", "blue", "yellow"];
const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "+2"];
const wilds = ["Wild", "+4"];

// เปลี่ยนเป็น let
let opponentStats = {
    playedColors: { red: 0, green: 0, blue: 0, yellow: 0 },
    actionUsage: { Skip: 0, Reverse: 0, "+2": 0, "+4": 0 },
    totalTurns: 0
};

// เปลี่ยนเป็น let และปรับโครงสร้างให้ถูกต้อง
let botStrategyUsage = {
    aggressiveSkip: { wins: 0, losses: 0, usedInTurn: false },
    colorBaiting: { wins: 0, losses: 0, usedInTurn: false },
    wildDelay: { wins: 0, losses: 0, usedInTurn: false },
    counterUNO: { wins: 0, losses: 0, usedInTurn: false },
    aggressiveDraw: { wins: 0, losses: 0, usedInTurn: false },
    reverseTactics: { wins: 0, losses: 0, usedInTurn: false },
    handOptimization: { wins: 0, losses: 0, usedInTurn: false },
    bluffPlusFour: { wins: 0, losses: 0, usedInTurn: false },

    discardHighValue: { wins: 0, losses: 0, usedInTurn: false },       // การเลือกทิ้งไพ่แต้มสูง (ตัวเลข 7-9)
    keepActionCards: { wins: 0, losses: 0, usedInTurn: false },        // การเก็บ Action Card ไว้ใช้ในจังหวะสำคัญ
    drainOpponentColor: { wins: 0, losses: 0, usedInTurn: false },     // การพยายามเล่นไพ่สีที่คู่ต่อสู้กำลังจะหมด
    forceOpponentDraw: { wins: 0, losses: 0, usedInTurn: false },      // การลงไพ่ +2/+4 อย่างมีกลยุทธ์เพื่อบังคับจั่วต่อเนื่อง
    preventUNO: { wins: 0, losses: 0, usedInTurn: false },             // การลง Action Card ที่ขัดขวางไม่ให้คู่ต่อสู้กด UNO
    strategicReverse: { wins: 0, losses: 0, usedInTurn: false },       // การใช้ Reverse เพื่อเปลี่ยนทิศทางกลับมาที่บอท
    observeOpponentWild: { wins: 0, losses: 0, usedInTurn: false },    // การสังเกตว่าคู่ต่อสู้เลือกสีอะไรบ่อยๆ
    stackingAttack: { wins: 0, losses: 0, usedInTurn: false }          // การพยายามลงไพ่ +2 หรือ +4 ทับกัน
};


// Card Functions (ส่วนนี้เหมือนเดิม)
function canPlay(card, center) {
    if (!card || !center) return false;
    if (card.color === "black") return true;
    return card.color === center.color || card.value === center.value;
}

function getMostFrequentColor(hand, playedWildCard = null) {
    const colorCounts = {};
    hand.forEach(card => {
        if (card.color !== "black" && card !== playedWildCard) {
            colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
        }
    });

    let maxCount = -1;
    let mostFrequent = null;
    for (const color in colorCounts) {
        if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            mostFrequent = color;
        }
    }
    return mostFrequent;
}

function getDiscardedColorCounts() {
    const colorCount = { "red": 0, "green": 0, "blue": 0, "yellow": 0 };
    discardPile.forEach(card => {
        if (card?.color && colors.includes(card.color)) {
            colorCount[card.color]++;
        }
    });
    return colorCount;
}

function trackOpponentPlay(card) {
    if (card.color && card.color !== "black") {
        opponentStats.playedColors[card.color]++;
    }
    if (["Skip", "Reverse", "+2", "+4"].includes(card.value)) {
        opponentStats.actionUsage[card.value]++;
    }
    opponentStats.totalTurns++;
}


// Bot AI Strategy Decision Functions (ส่วนนี้มีการปรับปรุง)
function shouldUseStrategy(strategyName) {
    const strategy = botStrategyUsage[strategyName];
    if (!strategy || strategy.wins === undefined) { // เพิ่มการตรวจสอบว่ามี wins/losses หรือไม่
        return false;
    }

    const totalUses = strategy.wins + strategy.losses;
    if (totalUses < 5) {
        return true;
    }
    return strategy.wins / totalUses > 0.55;
}

function shouldAvoidStrategy(strategyName) {
    const strategy = botStrategyUsage[strategyName];
    if (!strategy || strategy.wins === undefined) { // เพิ่มการตรวจสอบว่ามี wins/losses หรือไม่
        return false;
    }

    const totalUses = strategy.wins + strategy.losses;
    if (totalUses < 5) {
        return false;
    }
    return strategy.wins / totalUses < 0.40;
}


// recordStrategyOutcome: ฟังก์ชันสำคัญที่แก้ไขล่าสุด
function recordStrategyOutcome(botWon) {
    console.log("Saving strategy stats...");

    const raw = localStorage.getItem("uno_strategyHistory");
    let history = raw ? JSON.parse(raw) : {};

    for (const key in botStrategyUsage) {
        if (botStrategyUsage.hasOwnProperty(key)) {
            console.log("กำลังตรวจสอบกลยุทธ์... : ", key, " | usedInTurn = " , botStrategyUsage[key]);
            // ตรวจสอบว่ากลยุทธ์นั้นถูกใช้ในเทิร์นนี้หรือไม่ และมีโครงสร้างที่ถูกต้อง

            if ((botStrategyUsage[key].usedInTurn !== undefined && botStrategyUsage[key].usedInTurn) || (typeof botStrategyUsage[key] === "boolean" && botStrategyUsage[key])) {
                if (!history[key]) {
                    history[key] = { wins: 0, losses: 0 };
                }
                history[key][botWon ? "wins" : "losses"]++;
            }
            // **รีเซ็ต usedInTurn หลังจากบันทึกผลแล้ว**
            botStrategyUsage[key].usedInTurn = false;
        }
    }
    localStorage.setItem("uno_strategyHistory", JSON.stringify(history));
    console.log("Strategy stats saved:", history);
}

// Local Storage Functions
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

// ฟังก์ชันสำหรับโหลด Bot Strategy Stats (ต้องมีการเรียกใช้ตอนเริ่มเกม)
function loadBotStrategyStatsFromLocalStorage() {
    const savedStats = localStorage.getItem('uno_strategyHistory');
    if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        for (const strategy in botStrategyUsage) {
            if (botStrategyUsage.hasOwnProperty(strategy)) {
                if (parsedStats[strategy]) {
                    botStrategyUsage[strategy].wins = parsedStats[strategy].wins;
                    botStrategyUsage[strategy].losses = parsedStats[strategy].losses;
                } else {
                    // หากเป็นกลยุทธ์ใหม่ที่ไม่มีในข้อมูลเก่า ให้ตั้งค่าเริ่มต้น
                    botStrategyUsage[strategy] = { wins: 0, losses: 0, usedInTurn: false };
                }
            }
        }
    } else {
        console.log("No botStrategyUsage found in localStorage. Initializing default.");
        // หากไม่มีข้อมูลใน Local Storage เลย ก็ไม่ต้องทำอะไรเพิ่มเติม botStrategyUsage ถูกกำหนดค่าเริ่มต้นไว้แล้ว
    }
}

// อัปเดต getOpponentWeakColor ให้ใช้ playerHands ที่ถูกต้อง
function getOpponentWeakColor() {
    const playedColors = {};
    discardPile.forEach(card => {
        if (card.color !== "black") {
            playedColors[card.color] = (playedColors[card.color] || 0) + 1;
        }
    });
    let minCount = Infinity;
    let weakestColor = null;
    for (const c of colors) {
        const count = playedColors[c] || 0;
        if (count < minCount) {
            minCount = count;
            weakestColor = c;
        }
    }

    // ตรวจสอบ playerHands?.[1] สำหรับมือบอท
    const botHand = playerHands?.[1];
    const mostFrequentColorInBotHand = botHand ? getMostFrequentColor(botHand) : null;

    if (weakestColor && botHand && botHand.filter(card => card.color === weakestColor).length === 0 && mostFrequentColorInBotHand) {
        return mostFrequentColorInBotHand;
    }
    return weakestColor || "red";
}

// อัปเดต shouldUseSkip ให้ใช้ botStrategyUsage
function shouldUseSkip() {
    const opponentSkipRate = opponentStats.actionUsage["Skip"] / (opponentStats.totalTurns || 1);
    const botShouldUse = shouldUseStrategy("aggressiveSkip");

    return opponentSkipRate >= 0.2 || botShouldUse;
}