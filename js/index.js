const canvas = document.getElementById("unoCanvas");
const ctx = canvas.getContext("2d");

const wildColorPicker = document.getElementById("wildColorPicker");
const unoButton = document.getElementById("unoButton");

canvas.addEventListener("click", async function (event) {
    if (currentPlayer !== 0 || isProcessingTurn) return;

    const mx = event.offsetX, my = event.offsetY;

    if (mx >= 750 && mx <= 830 && my >= 250 && my <= 370) {
        if (!justDrawnCard) {
            await drawCard(currentPlayer, true);
            justDrawnCard = true;

            const playableCardsAfterDraw = playerHands[0].filter(card => canPlay(card, centerCard));
            if (playableCardsAfterDraw.length === 0) {
                justDrawnCard = false;
                endTurn();
                return;
            }
            return;
        } else {
            Swal.fire({ title: "❗ คุณเพิ่งจั่วไพ่ไปแล้ว", text: "คุณต้องเล่นไพ่หรือคลิกที่ว่างเพื่อจบตา", icon: "warning", timer: 2000, showConfirmButton: false });
            return;
        }
    }

    for (let i = 0; i < (playerHands?.[0]?.length || 0); i++) {
        const card = playerHands?.[0]?.[i];
        const x = 50 + i * 90 - handOffset;
        const y = 500;
        const canPlayThisCard = canPlay(card, centerCard);

        if (mx >= x && mx <= x + 80 && my >= y && my <= y + 100) {
            if (justDrawnCard) {
                if (canPlayThisCard) {
                    if (card?.value === "Wild" || card?.value === "+4") {
                        wildCardTemp = card;
                        wildCardIndex = i;
                        wildColorPicker.style.display = "block";
                        return;
                    }
                    await playCard(i);
                    justDrawnCard = false;
                    return;
                } else {
                    Swal.fire({ title: "❗ เล่นไพ่นี้ไม่ได้", text: "คุณต้องเล่นไพ่ที่สามารถเล่นได้ หรือคลิกที่ว่างเพื่อจบตา", icon: "warning", timer: 2000, showConfirmButton: false });
                    return;
                }
            } else if (canPlayThisCard) {
                if (card?.value === "Wild" || card?.value === "+4") {
                    wildCardTemp = card;
                    wildCardIndex = i;
                    wildColorPicker.style.display = "block";
                    return;
                }
                await playCard(i);
                return;
            } else {
                Swal.fire({ title: "❗ เล่นไพ่นี้ไม่ได้", text: "คุณต้องเล่นไพ่ที่สามารถเล่นได้", icon: "warning", timer: 2000, showConfirmButton: false });
                return;
            }
        }
    }

    if (justDrawnCard) {
        justDrawnCard = false;
        endTurn();
        return;
    }
});

canvas.addEventListener('wheel', (event) => {
    const playerHandY = 500;
    const playerHandHeight = 100;
    if (event.offsetY >= playerHandY && event.offsetY <= playerHandY + playerHandHeight) {
        const scrollSpeed = 50;
        handOffset += event.deltaY > 0 ? scrollSpeed : -scrollSpeed;

        const playerHand = playerHands?.[0];
        const cardSpacing = 90;
        const initialX = 50;
        const cardWidth = 80;
        const totalHandWidth = (playerHand?.length || 0) * cardSpacing;
        const maxOffset = Math.max(0, totalHandWidth - canvas.width + initialX + cardWidth + 20);

        handOffset = Math.max(0, Math.min(handOffset, maxOffset));
        drawGame();
        event.preventDefault();
    }
}, { passive: false });

unoButton.addEventListener("click", () => {
    unoDeclared = true;
    Swal.fire({ title: "คุณประกาศ UNO แล้ว! ✅", timer: 1200, showConfirmButton: false });
});

// function showGuide() {
//     Swal.fire({
//         title: '📘 คู่มือการเล่น UNO',
//         html: `
//         <div style="text-align: left; font-size: 1rem; line-height: 1.6;">
//           <strong>🎯 เป้าหมาย:</strong><br/>
//           ทิ้งไพ่ให้หมดก่อนใคร เพื่อชนะเกม<br/><br/>

//           <strong>🔄 กติกา:</strong><br/>
//           - ไพ่ต้องตรง <em>สี</em> หรือ <em>เลข</em> กับไพ่ก่อนหน้า<br/>
//           - ใช้ <em>ไพ่พิเศษ</em> เช่น +2, Skip, Reverse เพื่อเปลี่ยนเกม<br/>
//           - <strong>Wild</strong> ใช้เปลี่ยนสีได้ทุกเวลา<br/>
//           - <strong>+4</strong> ใช้เมื่อไม่มีไพ่ตรงกับสีใดเลย<br/><br/>

//           <strong>📣 UNO!</strong><br/>
//           อย่าลืมกดปุ่ม “ประกาศ UNO” เมื่อเหลือไพ่ใบเดียว มิฉะนั้นจะโดนลงโทษ!<br/><br/>

//           <strong>🧠 AI จะเล่นอัตโนมัติ</strong> และพยายามชนะคุณแบบโปร!
//         </div>
//       `,
//         icon: 'info',
//         confirmButtonText: 'เริ่มเล่นเลย!',
//         background: '#1f2937',
//         color: '#fff',
//         confirmButtonColor: '#ef4444',
//         customClass: {
//             popup: 'rounded-xl shadow-2xl backdrop-blur-sm border border-gray-600'
//         }
//     });
// }

initGame();