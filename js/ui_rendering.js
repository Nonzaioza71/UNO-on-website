const animationDuration = 400; // คงเดิม

// --- ฟังก์ชัน drawRoundedCard ---
function drawRoundedCard(x, y, width, height, radius = 12, color = "red", value = "5", textColor = "white") {
    const isFaceDown = (color === "#333" && value === "UNO");

    ctx.save();

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

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    if (isFaceDown) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, "#444");
        gradient.addColorStop(0.5, "#666");
        gradient.addColorStop(1, "#444");
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "bold 28px 'Comic Sans MS', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("UNO", x + width / 2, y + height / 2);

    } else {
        let displayColor = color;
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        switch (displayColor) {
            case "red":
                gradient.addColorStop(0, "#CC0000");
                gradient.addColorStop(1, "#FF0000");
                break;
            case "green":
                gradient.addColorStop(0, "#006400");
                gradient.addColorStop(1, "#00CD00");
                break;
            case "blue":
                gradient.addColorStop(0, "#0000CD");
                gradient.addColorStop(1, "#0000FF");
                break;
            case "yellow":
                gradient.addColorStop(0, "#CCCC00");
                gradient.addColorStop(1, "#FFFF00");
                break;
            case "black":
                gradient.addColorStop(0, "#333");
                gradient.addColorStop(1, "#000");
                break;
            default:
                gradient.addColorStop(0, "#CCC");
                gradient.addColorStop(1, "#FFF");
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        ctx.fillStyle = (displayColor === "yellow" || displayColor === "black") ? "black" : "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const drawSymbol = (val, cx, cy, s) => { // cx, cy = center x, y; s = scale (ขนาด)
            const symbolColor = (displayColor === "yellow" || displayColor === "black") ? "black" : "white";
            ctx.lineWidth = 2;
            ctx.strokeStyle = symbolColor;

            switch (val) {
                case "Skip":
                    // สัญลักษณ์ Skip แบบ UNO (วงกลมสีขาว ขอบดำ ขีดดำเฉียง)
                    const circleRadius = s * 0.35;
                    ctx.beginPath();
                    ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
                    ctx.fillStyle = "white";
                    ctx.strokeStyle = "black"
                    ctx.fill();
                    ctx.stroke(); // ขอบวงกลมสีดำ

                    ctx.beginPath();
                    ctx.moveTo(cx - circleRadius * 0.7, cy - circleRadius * 0.7);
                    ctx.lineTo(cx + circleRadius * 0.7, cy + circleRadius * 0.7);
                    ctx.lineWidth = s * 0.1; // ความหนาของขีด
                    ctx.strokeStyle = "black"; // สีขีดเป็นสีดำ
                    ctx.stroke();
                    ctx.lineWidth = 2; // คืนค่า default
                    ctx.strokeStyle = symbolColor; // คืนค่าสีเส้นเดิม
                    break;

                case "Reverse": {
                    const radius = s * 0.35;
                    const startAngle = Math.PI * 0.25;
                    const endAngle = Math.PI * 1.5;
                    const headSize = s * 0.18;

                    // ------ วาดเส้นโค้งขอบดำ ------
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = s * 0.12;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
                    ctx.stroke();

                    // ------ วาดเส้นโค้งเนื้อขาว ------
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = s * 0.08;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
                    ctx.stroke();

                    // ------ คำนวณตำแหน่งและมุมหัวลูกศร ------
                    const arrowX = cx + radius * Math.cos(endAngle);
                    const arrowY = cy + radius * Math.sin(endAngle);
                    const tangentAngle = endAngle + Math.PI * 0.5;

                    // ------ วาดหัวลูกศรสีขาว ขอบดำ ------
                    ctx.save();
                    ctx.translate(arrowX, arrowY);
                    ctx.rotate(tangentAngle);
                    ctx.beginPath();
                    ctx.moveTo(8, 0);
                    ctx.lineTo(-headSize * 0.4, -headSize * 0.5);
                    ctx.lineTo(-headSize * 0.4, headSize * 0.5);
                    ctx.closePath();
                    ctx.fillStyle = "white";
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = headSize * 0.12;
                    ctx.stroke();
                    ctx.fill();
                    ctx.restore();

                    // ------ คืนค่า default ------
                    ctx.lineCap = "butt";
                    ctx.lineJoin = "miter";
                }
                    break;

                case "+2":
                    ctx.font = `bold ${s * 0.7}px Arial`;
                    ctx.fillText("+2", cx, cy + s * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - s * 0.2, cy + s * 0.25);
                    ctx.lineTo(cx + s * 0.2, cy + s * 0.25);
                    ctx.lineWidth = s * 0.05;
                    ctx.stroke();
                    break;
                case "+4":
                    const circleOffset = s * 0.18;
                    const smallRadius = s * 0.1;
                    const colorsForWild = ["red", "green", "blue", "yellow"];
                    colorsForWild.forEach((c, i) => {
                        ctx.fillStyle = c;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(i * Math.PI / 2) * circleOffset, cy + Math.sin(i * Math.PI / 2) * circleOffset, smallRadius, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    break;
                case "Wild":
                    const wildCircleRadius = s * 0.2;
                    const wildColors = ["red", "green", "blue", "yellow"];
                    wildColors.forEach((c, i) => {
                        ctx.fillStyle = c;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(i * Math.PI / 2 + Math.PI / 4) * wildCircleRadius, cy + Math.sin(i * Math.PI / 2 + Math.PI / 4) * wildCircleRadius, wildCircleRadius, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    break;
                default: // ตัวเลขปกติ
                    ctx.font = `bold ${s * 0.7}px Arial`;
                    ctx.fillText(val, cx, cy + s * 0.05);
            }
        };

        // วาดสัญลักษณ์ตรงกลาง (ยกเว้น +4)
        if (value !== "+4") {
            drawSymbol(value, x + width / 2, y + height / 2, Math.min(width, height) * 0.7);
        } else {
            // วาดสี่วงกลมเล็กๆ ตรงกลางเสมอสำหรับ Wild +4
            const s = Math.min(width, height) * 0.7;
            const cx = x + width / 2;
            const cy = y + height / 2;
            const circleOffset = s * 0.18;
            const smallRadius = s * 0.1;
            const colorsForWild = ["red", "green", "blue", "yellow"];
            colorsForWild.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(i * Math.PI / 2) * circleOffset, cy + Math.sin(i * Math.PI / 2) * circleOffset, smallRadius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // วาดสัญลักษณ์เล็กๆ ที่มุม (สำหรับ +4 จะวาด +4 แทน)
        if (value !== "+4") {
            ctx.save();
            ctx.translate(x + 10, y + 10);
            ctx.scale(0.3, 0.3);
            drawSymbol(value, 0, 0, Math.min(width, height) * 0.7);
            ctx.restore();

            ctx.save();
            ctx.translate(x + width - 10, y + height - 10);
            ctx.rotate(Math.PI);
            ctx.scale(0.3, 0.3);
            drawSymbol(value, 0, 0, Math.min(width, height) * 0.7);
            ctx.restore();
        } else {
            // วาด +4 ที่มุมซ้ายล่าง
            ctx.save();
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.font = `bold ${Math.min(width, height) * 0.3}px Arial`;
            ctx.fillStyle = "black";
            ctx.fillText("+4", x + 10, y + height - 10);
            ctx.restore();

            // วาด +4 ที่มุมบนขวา (กลับหัว)
            ctx.save();
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            ctx.font = `bold ${Math.min(width, height) * 0.15}px Arial`;
            ctx.fillStyle = "black";
            ctx.fillText("+4", x + width - 10, y + 10);
            ctx.restore();
        }

        // ถ้าเป็น Wild หรือ +4 ที่มีสีแล้ว (หลังเลือกสี) ให้วาดวงกลมสีเล็กๆ ที่มุม
        if (color !== "black" && (value === "Wild" || value === "+4")) {
            const circleRadius = 10;
            ctx.beginPath();
            ctx.arc(x + width - circleRadius - 5, y + circleRadius + 5, circleRadius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    ctx.restore();
}

// --- ฟังก์ชัน drawGame (คงเดิมทุกประการ) ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deckRadius = 15;
    const cardWidth = 80;
    const cardHeight = 120;
    const centerCardX = 400;
    const centerCardY = 250;
    const drawPileX = 750;
    const drawPileY = 250;

    // ตรวจสอบให้แน่ใจว่า centerCard มีค่าก่อนเรียกใช้
    const currentCenterCardColor = centerCard?.color === "black" ? "#000" : centerCard?.color || "#fff";
    const currentCenterCardValue = centerCard?.value || "";

    drawRoundedCard(drawPileX, drawPileY, cardWidth, cardHeight, deckRadius, "#333", "UNO", "white");
    drawRoundedCard(centerCardX, centerCardY, cardWidth, cardHeight, deckRadius, currentCenterCardColor, currentCenterCardValue, "white");

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("🧑‍💻 YOU", 50, 470);

    // ตรวจสอบให้แน่ใจว่า playerHands และ currentPlayer ถูกกำหนดค่า
    document.getElementById("unoButton").style.display = (Array.isArray(playerHands?.[0]) && playerHands[0].length === 2 && currentPlayer === 0) ? "inline-block" : "none";

    const playerHand = playerHands?.[0];
    const cardSpacing = 90;
    const initialX = 50;
    const playerHandY = 500;

    // ตรวจสอบว่า playerHand เป็น array ก่อนใช้ .length
    const totalHandWidth = (Array.isArray(playerHand) ? playerHand.length : 0) * cardSpacing;
    const maxOffset = Math.max(0, totalHandWidth - canvas.width + initialX + cardWidth + 20);

    // ตรวจสอบว่า handOffset ถูกประกาศแล้ว
    if (typeof handOffset === 'undefined') handOffset = 0;
    handOffset = Math.max(0, Math.min(handOffset, maxOffset));

    playerHand?.forEach((card, i) => {
        const isAnimatingThisCard = activeAnimations.some(anim => (anim.type === 'play' && anim.card === card) || (anim.type === 'draw' && anim.card === card && anim.targetHand === 0));
        if (isAnimatingThisCard) return;

        const x = initialX + i * cardSpacing - handOffset;
        const y = playerHandY;
        const textColor = card?.color === "yellow" ? "#000" : "white";
        drawRoundedCard(x, y, 80, 100, 12, card?.color === "black" ? "#000" : card?.color || "#fff", card?.value || "", textColor);

        // ตรวจสอบว่า centerCard ถูกกำหนดค่า และ canPlay, justDrawnCard ถูกกำหนด
        if (currentPlayer === 0 && centerCard && (typeof canPlay === 'function' ? canPlay(card, centerCard) : true || justDrawnCard)) {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, 80, 100);
        }
    });
    ctx.fillStyle = "white";
    ctx.fillText("🤖 BOT", 50, 50);
    playerHands?.[1]?.forEach((card, i) => {
        const isAnimatingThisCard = activeAnimations.some(anim => (anim.type === 'play' && anim.card === card) || (anim.type === 'draw' && anim.card === card && anim.targetHand === 1));
        if (isAnimatingThisCard) return;

        const x = 50 + i * 90, y = 80;
        drawRoundedCard(x, y, 80, 100, 12, "#333", "UNO", "white");
    });

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    // ตรวจสอบว่า currentPlayer ถูกกำหนดค่า
    ctx.fillText(typeof currentPlayer !== 'undefined' ? (currentPlayer === 0 ? "📢 Your turn!" : "🤖 Bot's turn!") : "", canvas.width - 20, 30);
    ctx.textAlign = "left";
}

let activeAnimations = [];


function animateCardMovement(card, startX, startY, endX, endY, type, targetHand = null) {
    return new Promise(resolve => {
        const animationInstance = { card, startX, startY, endX, endY, startTime: performance.now(), duration: animationDuration, type, targetHand, resolve };
        activeAnimations.push(animationInstance);
        if (activeAnimations.length === 1) requestAnimationFrame(animationLoop);
    });
}

// --- ฟังก์ชัน animationLoop ---
function animationLoop(currentTime) {
    let animationsFinished = [];
    activeAnimations.forEach(anim => {
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        anim.currentX = anim.startX + (anim.endX - anim.startX) * progress;
        anim.currentY = anim.startY + (anim.endY - anim.startY) * progress;
        if (progress === 1) animationsFinished.push(anim);
    });

    drawGame(); // วาดเกมปกติก่อน

    // วาดการ์ดที่กำลังเคลื่อนที่ทับลงไป
    activeAnimations.forEach(anim => {
        let displayColor = anim.card.color;
        let displayValue = anim.card.value;
        let textColor = displayColor === "yellow" ? "#000" : "white";

        // หากเป็นการ์ดที่บอทจั่ว หรือผู้เล่นจั่วแต่ยังอยู่กลางอากาศ ให้แสดงเป็นไพ่คว่ำ
        if (anim.type === 'draw' && anim.targetHand === 1) {
            displayColor = "#333";
            displayValue = "UNO";
            textColor = "white";
        } else if (anim.type === 'draw' && anim.targetHand === 0 && anim.currentY < 400) {
            displayColor = "#333";
            displayValue = "UNO";
            textColor = "white";
        }
        drawRoundedCard(anim.currentX, anim.currentY, 80, 100, 12, displayColor, displayValue, textColor);
    });

    activeAnimations = activeAnimations.filter(anim => {
        if (animationsFinished.includes(anim)) {
            anim.resolve(); // resolve promise เมื่อ animation จบ
            return false; // ลบ animation นี้ออกจาก list
        }
        return true; // เก็บ animation นี้ไว้
    });

    if (activeAnimations.length > 0) {
        requestAnimationFrame(animationLoop); // เรียก loop ต่อไปถ้ายังมี animation
    }
}