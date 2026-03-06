// 这个文件包含了需要添加到 game.js 中的代码
// 1. 添加提示系统
// 2. 修复回血显示问题

// 在 Game 类中添加以下属性（在 constructor 中）：
// this.powerupMessages = [];

// 在 Game 类中添加以下方法：

showPowerupMessage(message, color) {
    const messageObj = {
        text: message,
        x: this.width / 2,
        y: this.height / 2 - 100,
        color: color,
        alpha: 1,
        scale: 1
    };
    this.powerupMessages.push(messageObj);

    // 2 秒后自动消失
    setTimeout(() => {
        const index = this.powerupMessages.indexOf(messageObj);
        if (index > -1) {
            this.powerupMessages.splice(index, 1);
        }
    }, 2000);
}

updatePowerupMessages(deltaTime) {
    this.powerupMessages.forEach(msg => {
        msg.y -= 0.5; // 向上漂浮
        msg.alpha -= deltaTime / 2000; // 渐隐
        msg.scale += deltaTime / 1000; // 放大
    });

    // 移除已消失的消息
    this.powerupMessages = this.powerupMessages.filter(msg => msg.alpha > 0);
}

renderPowerupMessages(ctx) {
    this.powerupMessages.forEach(msg => {
        ctx.save();
        ctx.globalAlpha = msg.alpha;
        ctx.translate(msg.x, msg.y);
        ctx.scale(msg.scale, msg.scale);

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = msg.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(msg.text, 0, 0);

        ctx.restore();
    });
}

// 修改 applyPowerup 方法：
/*
applyPowerup(powerup) {
    const config = CONFIG.POWERUPS[powerup.type.toUpperCase()];

    switch (powerup.type) {
        case 'heal':
            const healAmount = this.player.heal(config.effect);
            this.showPowerupMessage(`+${config.effect} 生命值`, config.color);
            break;
        case 'speed':
            this.player.speed *= config.effect;
            this.showPowerupMessage(`速度提升 ${(config.effect - 1) * 100}%！`, config.color);
            setTimeout(() => {
                this.player.speed /= config.effect;
                this.showPowerupMessage(`速度恢复正常`, '#aaa');
            }, config.duration);
            break;
        case 'damage':
            this.player.damageMultiplier *= config.effect;
            this.showPowerupMessage(`伤害提升 ${(config.effect - 1) * 100}%！`, config.color);
            setTimeout(() => {
                this.player.damageMultiplier /= config.effect;
                this.showPowerupMessage(`伤害恢复正常`, '#aaa');
            }, config.duration);
            break;
        case 'shield':
            this.player.hasShield = true;
            this.player.shieldHealth = 50;
            this.showPowerupMessage(`护盾激活！`, config.color);
            setTimeout(() => {
                this.player.hasShield = false;
                this.showPowerupMessage(`护盾消失`, '#aaa');
            }, config.duration);
            break;
    }

    this.createParticles(powerup.x, powerup.y, config.color, 10);
}
*/

// 修改 update 方法，添加：
// this.updatePowerupMessages(deltaTime);

// 修改 render 方法，添加：
// this.renderPowerupMessages(this.ctx);

// 修改 Player 类的 heal 方法：
/*
heal(amount) {
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - oldHealth; // 返回实际恢复的生命值
}
*/
