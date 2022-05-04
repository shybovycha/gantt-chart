export const roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
    if (typeof stroke === "undefined") {
      stroke = false;
    }

    if (typeof radius === "undefined") {
      radius = 0;
    }

    if (typeof radius === "number") {
      radius = {
        topRight: radius,
        topLeft: radius,
        bottomRight: radius,
        bottomLeft: radius,
      };
    } else {
      const defaultRadius = {
        topLeft: 0,
        topRight: 0,
        bottomRight: 0,
        bottomLeft: 0,
      };

      for (let side of defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }

    ctx.beginPath();

    ctx.moveTo(x + radius.topLeft, y);

    ctx.lineTo(x + width - radius.topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);

    ctx.lineTo(x + width, y + height - radius.bottomRight);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.bottomRight,
      y + height
    );

    ctx.lineTo(x + radius.bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bottomLeft);

    ctx.lineTo(x, y + radius.topLeft);
    ctx.quadraticCurveTo(x, y, x + radius.topLeft, y);

    ctx.closePath();

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
};
