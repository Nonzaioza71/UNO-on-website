// async function botTurn() {
//     if (currentPlayer !== 1 || isProcessingTurn) return;
//     isProcessingTurn = true;

//     const botHand = playerHands?.[1];
//     const opponentHandSize = playerHands?.[0]?.length || 0;
//     let cardToPlay = null;
//     let chosenColor = null;

//     for (const key in botStrategyUsage) {
//         botStrategyUsage[key] = false;
//     }

//     const playableCards = botHand?.filter(card => canPlay(card, centerCard)) || [];

//     if (playableCards.length === 0) {
//         await drawCard(1, true);
//         endTurn();
//         return;
//     }

//     if (opponentHandSize <= 2) {
//         cardToPlay = playableCards.find(c => c.value === "+4");
//         if (cardToPlay) {
//             chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
//             botStrategyUsage.colorBaiting = true;
//             botStrategyUsage.counterUNO = true;
//         }

//         if (!cardToPlay) {
//             cardToPlay = playableCards.find(c => c.value === "+2");
//             if (cardToPlay) botStrategyUsage.counterUNO = true;
//         }

//         if (!cardToPlay && opponentHandSize === 1) {
//             cardToPlay = playableCards.find(c => c.value === "Reverse");
//             if (!cardToPlay && shouldUseSkip() && !shouldAvoidStrategy("aggressiveSkip")) {
//                 cardToPlay = playableCards.find(c => c.value === "Skip");
//                 if (cardToPlay) botStrategyUsage.aggressiveSkip = true;
//             }
//         }
//     }

//     if (!cardToPlay) {
//         const regularPlayableCards = playableCards.filter(c => c.color !== "black");
//         cardToPlay = regularPlayableCards.find(c => c.color === centerCard?.color);
//         if (!cardToPlay) cardToPlay = regularPlayableCards.find(c => c.value === centerCard?.value);
//         if (!cardToPlay) cardToPlay = regularPlayableCards.find(c => ["Skip", "Reverse", "+2"].includes(c.value));
//     }

//     if (!cardToPlay) {
//         const wildCard = playableCards.find(c => c.value === "Wild");
//         const hasSafePlay = playableCards.some(c => c.color !== "black");
//         const avoidWild = shouldAvoidStrategy("wildDelay");

//         if (wildCard && (!hasSafePlay || opponentHandSize <= 2 || botHand.length > 5) && !avoidWild) {
//             cardToPlay = wildCard;
//             botStrategyUsage.wildDelay = true;
//         }
//     }

//     if (!cardToPlay) {
//         cardToPlay = playableCards.find(c => c.value === "+4");
//         if (cardToPlay) {
//             chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
//             botStrategyUsage.colorBaiting = true;
//         }
//     }

//     if (cardToPlay?.color === "black") {
//         chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
//     }

//     console.log("กลยุตบอท : " , botStrategyUsage);


//     if (cardToPlay) {
//         const index = botHand.indexOf(cardToPlay);
//         const startX = 50 + index * 90;
//         const startY = 80;
//         const endX = 400;
//         const endY = 250;

//         const playedCardFinal = cardToPlay.color === "black"
//             ? { ...cardToPlay, color: chosenColor || "red" }
//             : cardToPlay;

//         botHand.splice(index, 1);
//         discardPile.push(centerCard);
//         centerCard = playedCardFinal;

//         await animateCardMovement(playedCardFinal, startX, startY, endX, endY, 'play', currentPlayer);

//         if (checkWin()) {
//             saveOpponentStatsToLocalStorage();
//             return;
//         }

//         switch (playedCardFinal.value) {
//             case "Reverse":
//                 direction *= -1;
//                 endTurn();
//                 break;
//             case "Skip":
//                 endTurn(true);
//                 break;
//             case "+2":
//                 const target2 = (currentPlayer + direction + 2) % 2;
//                 for (let i = 0; i < 2; i++) await drawCard(target2, true);
//                 endTurn();
//                 break;
//             case "+4":
//                 const target4 = (currentPlayer + direction + 2) % 2;
//                 for (let i = 0; i < 4; i++) await drawCard(target4, true);
//                 endTurn();
//                 break;
//             default:
//                 endTurn();
//                 break;
//         }

//         saveOpponentStatsToLocalStorage();
//     } else {
//         await drawCard(1, true);
//         endTurn();
//     }
// }
async function botTurn() {
    if (currentPlayer !== 1 || isProcessingTurn) return;
    isProcessingTurn = true;

    const botHand = playerHands?.[1];
    const opponentHandSize = playerHands?.[0]?.length || 0;
    let cardToPlay = null;
    let chosenColor = null;

    // รีเซ็ต flag 'usedInTurn' สำหรับทุกกลยุทธ์ก่อนเริ่มเลือกกลยุทธ์ในเทิร์นนี้
    for (const key in botStrategyUsage) {
        if (botStrategyUsage.hasOwnProperty(key) && botStrategyUsage[key].usedInTurn !== undefined) {
            botStrategyUsage[key].usedInTurn = false;
        }
    }

    const playableCards = botHand?.filter(card => canPlay(card, centerCard)) || [];

    if (playableCards.length === 0) {
        console.log("Bot: ไม่มีไพ่เล่นได้, ต้องจั่ว.");
        await drawCard(1, true);
        endTurn();
        return;
    }

    // --- เริ่มต้นกลยุทธ์ระดับ "โปร" พร้อมกลยุทธ์ใหม่ ---

    // 1. Priority 1: กลยุทธ์การจบเกม (ถ้าบอทเหลือไพ่น้อย)
    if (botHand.length <= 2) {
        console.log(`Bot: เหลือไพ่ ${botHand.length} ใบ, พิจารณากลยุทธ์จบเกม.`);
        // 1.1. พยายามใช้ +2 หรือ +4
        cardToPlay = playableCards.find(c => (c.value === "+2" || c.value === "+4") && canPlay(c, centerCard));
        if (cardToPlay) {
            if (cardToPlay.value === "+4") {
                chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
                if (!chosenColor) chosenColor = "red";
                botStrategyUsage.colorBaiting.usedInTurn = true;
            }
            botStrategyUsage.aggressiveDraw.usedInTurn = true;
            botStrategyUsage.counterUNO.usedInTurn = true; // ยังคงเป็น counterUNO
            console.log("Bot: กำลังจะชนะ! ใช้ Action Card โจมตี/ชะลอ.");
        }

        // 1.2. ถ้าไม่มี +2/+4 ให้ใช้ Skip/Reverse
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "Skip" && canPlay(c, centerCard));
            if (cardToPlay) {
                botStrategyUsage.aggressiveSkip.usedInTurn = true;
                botStrategyUsage.preventUNO.usedInTurn = true; // กลยุทธ์ใหม่: ป้องกัน UNO
                console.log("Bot: กำลังจะชนะ! ใช้ Skip.");
            }
        }
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "Reverse" && canPlay(c, centerCard));
            if (cardToPlay) {
                botStrategyUsage.reverseTactics.usedInTurn = true;
                botStrategyUsage.strategicReverse.usedInTurn = true; // กลยุทธ์ใหม่: Strategic Reverse
                console.log("Bot: กำลังจะชนะ! ใช้ Reverse.");
            }
        }

        // 1.3. หากยังไม่มีไพ่ให้เล่น ให้หาไพ่ตัวเลข/สีปกติ (เน้นกำจัดไพ่ให้หมด)
        if (!cardToPlay) {
            cardToPlay = playableCards.filter(c => c.color !== "black").find(c => true);
            if (cardToPlay) {
                botStrategyUsage.handOptimization.usedInTurn = true;
                botStrategyUsage.discardHighValue.usedInTurn = true; // กลยุทธ์ใหม่: กำจัดแต้มสูง
                console.log("Bot: กำลังจะชนะ! ลงไพ่ปกติ.");
            }
        }

        // 1.4. สุดท้าย ถ้ายังไม่มีอะไรเล่น ให้ใช้ Wild/Draw +4 เพื่อเปลี่ยนสีที่จบเกมได้
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "Wild" && canPlay(c, centerCard));
            if (cardToPlay) {
                chosenColor = getMostFrequentColor(botHand, cardToPlay) || getOpponentWeakColor();
                if (!chosenColor) chosenColor = "red";
                botStrategyUsage.wildDelay.usedInTurn = true;
                botStrategyUsage.colorBaiting.usedInTurn = true; // Wild ก็มีผลกับการ baiting สี
                console.log("Bot: กำลังจะชนะ! ใช้ Wild เพื่อจบเกม.");
            }
        }
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "+4" && canPlay(c, centerCard));
            if (cardToPlay) {
                chosenColor = getMostFrequentColor(botHand, cardToPlay) || getOpponentWeakColor();
                if (!chosenColor) chosenColor = "red";
                botStrategyUsage.colorBaiting.usedInTurn = true;
                botStrategyUsage.aggressiveDraw.usedInTurn = true;
                botStrategyUsage.counterUNO.usedInTurn = true;
                console.log("Bot: กำลังจะชนะ! ใช้ +4 เพื่อโจมตีและจบเกม.");
            }
        }
    }


    // 2. Priority 2: กลยุทธ์การป้องกันและโจมตี (เมื่อคู่ต่อสู้เหลือน้อย)
    if (!cardToPlay && opponentHandSize <= 3) {
        console.log(`Bot: คู่ต่อสู้เหลือไพ่ ${opponentHandSize} ใบ, โจมตี/ป้องกัน.`);
        
        // 2.1. พยายามใช้ +4 หรือ +2 เพื่อบังคับให้คู่ต่อสู้จั่ว และพยายาม Stacking
        const drawCards = playableCards.filter(c => c.value === "+4" || c.value === "+2");
        if (drawCards.length > 0 && shouldUseStrategy("forceOpponentDraw")) { // ใช้กลยุทธ์ forceOpponentDraw
            cardToPlay = drawCards.find(c => c.value === "+4"); // เลือก +4 ก่อน
            if (!cardToPlay) cardToPlay = drawCards.find(c => c.value === "+2");

            if (cardToPlay) {
                if (cardToPlay.value === "+4") {
                    chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
                    if (!chosenColor) chosenColor = "red";
                    botStrategyUsage.colorBaiting.usedInTurn = true;
                }
                botStrategyUsage.aggressiveDraw.usedInTurn = true;
                botStrategyUsage.counterUNO.usedInTurn = true;
                botStrategyUsage.forceOpponentDraw.usedInTurn = true; // กลยุทธ์ใหม่: บังคับจั่ว
                botStrategyUsage.stackingAttack.usedInTurn = true; // กลยุทธ์ใหม่: Stacking
                console.log("Bot: ใช้ Draw Card เพื่อโจมตีและบังคับจั่ว.");
            }
        }

        // 2.2. ถ้าไม่มี Draw Cards ให้ใช้ Skip/Reverse
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "Skip" && canPlay(c, centerCard));
            if (cardToPlay) {
                botStrategyUsage.aggressiveSkip.usedInTurn = true;
                botStrategyUsage.preventUNO.usedInTurn = true; // กลยุทธ์ใหม่: ป้องกัน UNO
                console.log("Bot: ใช้ Skip เพื่อข้ามตาคู่ต่อสู้.");
            }
        }
        if (!cardToPlay) {
            cardToPlay = playableCards.find(c => c.value === "Reverse" && canPlay(c, centerCard));
            if (cardToPlay) {
                botStrategyUsage.reverseTactics.usedInTurn = true;
                botStrategyUsage.strategicReverse.usedInTurn = true; // กลยุทธ์ใหม่: Strategic Reverse
                botStrategyUsage.preventUNO.usedInTurn = true; // ป้องกัน UNO
                console.log("Bot: ใช้ Reverse เพื่อเปลี่ยนทิศทาง/ให้ตัวเองเล่นอีกรอบ.");
            }
        }
        
        // 2.3. พิจารณา Wild Card เพื่อเปลี่ยนสีที่คู่ต่อสู้ไม่มี
        if (!cardToPlay) {
            const wildCard = playableCards.find(c => c.value === "Wild");
            if (wildCard) {
                const weakColor = getOpponentWeakColor();
                if (weakColor && weakColor !== centerCard?.color) { // ถ้าเปลี่ยนสีแล้วได้เปรียบ
                    cardToPlay = wildCard;
                    chosenColor = weakColor;
                    botStrategyUsage.colorBaiting.usedInTurn = true;
                    botStrategyUsage.wildDelay.usedInTurn = true; // อาจจะใช้ Wild ก่อนเวลา
                    console.log("Bot: ใช้ Wild เพื่อเปลี่ยนสีที่คู่ต่อสู้ไม่มี.");
                }
            }
        }
    }

    // 3. Priority 3: กลยุทธ์การจัดการไพ่ในมือ (ลดไพ่ที่ไม่จำเป็น / เตรียมพร้อม)
    if (!cardToPlay) {
        console.log("Bot: จัดการไพ่ในมือ / เล่นไพ่ปกติ.");
        const nonWildCards = playableCards.filter(c => c.color !== "black");

        // 3.1. พิจารณา Bluff +4 (ถ้ามี และไม่มีไพ่สีตรง หรือต้องการโจมตีแรงๆ)
        const drawFourCard = playableCards.find(c => c.value === "+4");
        if (drawFourCard && shouldUseStrategy("bluffPlusFour")) { // ใช้สถิติในการตัดสินใจบลัฟ
            const canPlayColorCard = playableCards.some(c => c.color === centerCard?.color && c.color !== "black");
            // บลัฟ: ถ้าไม่มีไพ่สีที่เล่นได้เลย หรือตัดสินใจบลัฟ
            if (!canPlayColorCard || opponentHandSize > 3 || botHand.length > 5) {
                cardToPlay = drawFourCard;
                chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
                if (!chosenColor) chosenColor = "red";
                botStrategyUsage.bluffPlusFour.usedInTurn = true;
                botStrategyUsage.aggressiveDraw.usedInTurn = true;
                botStrategyUsage.colorBaiting.usedInTurn = true;
                console.log("Bot: บลัฟด้วย +4.");
            }
        }

        // 3.2. เล่น Action Card ที่ไม่ใช่ Wild (+2, Skip, Reverse) (ถ้ายังไม่มี cardToPlay)
        // พิจารณาเก็บ Action Card ไว้ด้วย
        const actionCards = nonWildCards.filter(c => ["+2", "Skip", "Reverse"].includes(c.value));
        const hasManyCards = botHand.length > 5; // มีไพ่เยอะ อาจจะลง Action Card ได้ง่ายขึ้น
        const opponentCloseToWin = opponentHandSize <= 3; // คู่ต่อสู้ใกล้ชนะ

        if (actionCards.length > 0 && !shouldUseStrategy("keepActionCards")) { // ถ้าไม่ควรเก็บ ให้พยายามลง
            cardToPlay = actionCards.find(c => c.value === "+2" && canPlay(c, centerCard));
            if (cardToPlay) {
                botStrategyUsage.aggressiveDraw.usedInTurn = true;
                console.log("Bot: เล่น +2.");
            }
            if (!cardToPlay) {
                cardToPlay = actionCards.find(c => c.value === "Skip" && canPlay(c, centerCard));
                if (cardToPlay) {
                    botStrategyUsage.aggressiveSkip.usedInTurn = true;
                    console.log("Bot: เล่น Skip.");
                }
            }
            if (!cardToPlay) {
                cardToPlay = actionCards.find(c => c.value === "Reverse" && canPlay(c, centerCard));
                if (cardToPlay) {
                    botStrategyUsage.reverseTactics.usedInTurn = true;
                    console.log("Bot: เล่น Reverse.");
                }
            }
        }
        // ถ้า shouldUseStrategy("keepActionCards") เป็น true บอทจะพยายามเก็บ Action Card เหล่านี้ไว้
        // ดังนั้น cardToPlay จะยังเป็น null ในกรณีนี้

        // 3.3. เล่นไพ่ตัวเลข (Regular Cards)
        if (!cardToPlay && nonWildCards.length > 0) {
            // **เน้น Hand Optimization: กำจัดไพ่สีที่บอทมีเยอะสุด หรือไพ่แต้มสูงที่ไม่จำเป็น**
            const colorsInHand = {};
            botHand.forEach(card => {
                if (card.color !== "black") {
                    colorsInHand[card.color] = (colorsInHand[card.color] || 0) + 1;
                }
            });
            const mostCommonColorInHand = Object.keys(colorsInHand).sort((a, b) => colorsInHand[b] - colorsInHand[a])[0];

            // 3.3.1. เล่นไพ่สีที่บอทมีเยอะที่สุดและตรงกับ Center Card (เพื่อลดจำนวนไพ่ในสีนั้นๆ)
            if (mostCommonColorInHand && shouldUseStrategy("handOptimization")) {
                cardToPlay = nonWildCards.filter(c => c.color === mostCommonColorInHand && c.color === centerCard?.color && !isNaN(c.value))
                                        .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // เล่นไพ่แต้มสูงในสีนั้นก่อน
                                        .find(c => true);
                if (cardToPlay) {
                    botStrategyUsage.handOptimization.usedInTurn = true;
                    botStrategyUsage.discardHighValue.usedInTurn = true; // กลยุทธ์นี้มักจะทิ้งแต้มสูง
                    console.log("Bot: เล่นไพ่สีที่ตัวเองมีเยอะสุด (เน้นลดไพ่):", cardToPlay);
                }
            }
            
            // 3.3.2. เล่นไพ่ตัวเลขที่มีค่าตรงกับ Center Card (ถ้ายังไม่มี cardToPlay)
            if (!cardToPlay && shouldUseStrategy("handOptimization")) {
                cardToPlay = nonWildCards.filter(c => c.value === centerCard?.value && !isNaN(c.value))
                                        .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // เล่นไพ่แต้มสูงก่อน
                                        .find(c => true);
                if (cardToPlay) {
                    botStrategyUsage.handOptimization.usedInTurn = true;
                    botStrategyUsage.discardHighValue.usedInTurn = true;
                    console.log("Bot: เล่นไพ่ค่าตรง:", cardToPlay);
                }
            }

            // 3.3.3. เล่นไพ่ตัวเลขที่มีสีตรงกับ Center Card (ถ้ายังไม่มี cardToPlay)
            if (!cardToPlay && shouldUseStrategy("handOptimization")) {
                cardToPlay = nonWildCards.filter(c => c.color === centerCard?.color && !isNaN(c.value))
                                        .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // เล่นไพ่แต้มสูงก่อน
                                        .find(c => true);
                if (cardToPlay) {
                    botStrategyUsage.handOptimization.usedInTurn = true;
                    botStrategyUsage.discardHighValue.usedInTurn = true;
                    console.log("Bot: เล่นไพ่สีตรง:", cardToPlay);
                }
            }

            // 3.3.4. พยายาม Drain Opponent Color (กลยุทธ์ใหม่)
            if (!cardToPlay && shouldUseStrategy("drainOpponentColor")) {
                const weakColorForOpponent = getOpponentWeakColor(); // สีที่คู่ต่อสู้น่าจะไม่มี
                if (weakColorForOpponent && weakColorForOpponent !== centerCard?.color) { // ถ้าไม่ใช่สีปัจจุบัน
                    cardToPlay = nonWildCards.filter(c => c.color === weakColorForOpponent && canPlay(c, centerCard))
                                            .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // เล่นไพ่แต้มสูงก่อน
                                            .find(c => true);
                    if (cardToPlay) {
                        botStrategyUsage.drainOpponentColor.usedInTurn = true;
                        console.log("Bot: พยายาม Drain สีคู่ต่อสู้:", cardToPlay);
                    }
                }
            }

            // 3.3.5. สุดท้าย: เล่นไพ่ตัวเลขแต้มสูงที่เล่นได้ (ถ้ายังไม่มี cardToPlay)
            if (!cardToPlay) {
                cardToPlay = nonWildCards.filter(c => !isNaN(c.value))
                                        .sort((a, b) => parseInt(b.value) - parseInt(a.value)) // เรียงจากมากไปน้อย
                                        .find(c => canPlay(c, centerCard));
                if (cardToPlay) {
                    botStrategyUsage.discardHighValue.usedInTurn = true;
                    botStrategyUsage.handOptimization.usedInTurn = true; // ก็ยังเป็น Hand Optimization
                    console.log("Bot: เล่นไพ่ตัวเลขแต้มสูงเพื่อกำจัด:", cardToPlay);
                }
            }
        }
    }
    
    // 4. Priority 4: กลยุทธ์การใช้ Wild Card (ถ้าจำเป็นจริงๆ หรือเพื่อเปลี่ยนสถานการณ์)
    if (!cardToPlay) {
        console.log("Bot: พิจารณา Wild Card.");
        const wildCard = playableCards.find(c => c.value === "Wild");
        const hasOtherPlayableCards = playableCards.some(c => c.color !== "black");
        const avoidWild = shouldAvoidStrategy("wildDelay");

        // ใช้ Wild เมื่อ:
        // 1. ไม่มีไพ่อื่นให้เล่นเลย (ต้องใช้)
        // 2. มีไพ่อื่นให้เล่น แต่บอทมีไพ่ในมือเยอะ (เช่น > 7 ใบ) และต้องการลดจำนวนไพ่
        // 3. คู่ต่อสู้เหลือไพ่น้อย (เพื่อเปลี่ยนสีที่คู่ต่อสู้ไม่มี)
        // 4. สถิติบอกว่าควรใช้ Wild ในตอนนี้ (avoidWild เป็น false)
        // 5. หาก observeOpponentWild ระบุว่าคู่ต่อสู้มักจะไม่มีสีนั้นๆ
        if (wildCard && (!hasOtherPlayableCards || botHand.length > 7 || opponentHandSize <= 3) && !avoidWild) {
            cardToPlay = wildCard;
            chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
            if (!chosenColor) chosenColor = "red";
            
            botStrategyUsage.wildDelay.usedInTurn = true;
            botStrategyUsage.colorBaiting.usedInTurn = true;
            botStrategyUsage.observeOpponentWild.usedInTurn = true; // กลยุทธ์ใหม่: สังเกต Wild คู่ต่อสู้
            console.log("Bot: ใช้ Wild Card.");
        }
    }
    
    // 5. หากยังไม่มีไพ่จะเล่น ให้จั่ว
    if (!cardToPlay) {
        console.log("Bot: ไม่มีไพ่ที่เหมาะจะเล่น, จั่ว.");
        await drawCard(1, true);
        endTurn();
        return;
    }

    // --- สิ้นสุดกลยุทธ์ระดับ "โปร" ---

    // 6. ตรวจสอบ chosenColor อีกครั้งสำหรับไพ่ Wild/Draw +4 (หากยังไม่ได้เลือก)
    if (cardToPlay?.color === "black" && !chosenColor) {
        chosenColor = getOpponentWeakColor() || getMostFrequentColor(botHand, cardToPlay);
        if (!chosenColor) chosenColor = "red";
        console.log("Bot: กำหนดสี Wild เป็น:", chosenColor);
    }

    console.log("Bot: เลือกเล่นไพ่:", cardToPlay);
    console.log("กลยุทธ์บอทที่ใช้ในเทิร์นนี้: ", JSON.parse(JSON.stringify(botStrategyUsage))); // Clone เพื่อแสดงค่าที่ถูกใช้จริงๆ

    // 7. ทำการเล่นการ์ด
    const index = botHand.indexOf(cardToPlay);
    const startX = 50 + index * 90;
    const startY = 80;
    const endX = 400;
    const endY = 250;

    const playedCardFinal = cardToPlay.color === "black"
        ? { ...cardToPlay, color: chosenColor }
        : cardToPlay;

    botHand.splice(index, 1);
    discardPile.push(centerCard);
    centerCard = playedCardFinal;

    await animateCardMovement(playedCardFinal, startX, startY, endX, endY, 'play', currentPlayer);
    
    // ตรวจสอบชัยชนะทันทีหลังเล่นไพ่
    if (checkWin()) {
        saveOpponentStatsToLocalStorage();
        return;
    }

    // จัดการ Effect ของไพ่ที่เล่น
    switch (playedCardFinal.value) {
        case "Reverse":
            direction *= -1;
            endTurn();
            break;
        case "Skip":
            endTurn(true);
            break;
        case "+2":
            const target2 = (currentPlayer + direction + 2) % 2;
            for (let i = 0; i < 2; i++) await drawCard(target2, true);
            endTurn();
            break;
        case "+4":
            const target4 = (currentPlayer + direction + 2) % 2;
            for (let i = 0; i < 4; i++) await drawCard(target4, true);
            endTurn();
            break;
        default:
            endTurn();
            break;
    }
    saveOpponentStatsToLocalStorage();
}