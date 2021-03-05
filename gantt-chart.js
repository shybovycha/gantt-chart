import {
  addMilliseconds,
  format as formatDate,
  min as minDate,
  max as maxDate
} from "date-fns";

export const createGanttChart = (parentElt, milestones) => {
  const canvas = document.createElement("canvas");
  parentElt.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const DEFAULT_ROW_HEIGHT = 40;
  const DEFAULT_WIDTH = 1800;
  const DEFAULT_FONT_SIZE = 12;
  const DEFAULT_ROW_PADDING = 10;

  const SLIDER_WIDTH = 10;

  const fontSize = DEFAULT_FONT_SIZE;

  const canvasWidth = canvas.outerWidth || DEFAULT_WIDTH;
  const canvasHeight =
    canvas.outerHeight ||
    (milestones.length + 1) * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2);

  // canvas.style.width = `${canvasWidth / 2}px`;
  // canvas.style.height = `${canvasHeight / 2}px`;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  console.log("canvas", canvasWidth, canvasHeight);

  // create header / scale
  // find the shortest and the longest milestones
  const minStart = minDate(milestones.map(({ start }) => start));
  const maxEnd = maxDate(milestones.map(({ end }) => end));

  const overallDuration = maxEnd.getTime() - minStart.getTime();

  const shortestMilestoneDuration = milestones
    .map(({ start, end }) => end.getTime() - start.getTime())
    .reduce(
      (acc, duration) => (acc < duration ? acc : duration),
      Number.MAX_VALUE
    );

  // shortest milestone should occupy 3 "columns"
  // hence the overall number of "columns" is overallDuration / (shortest / 3)

  const columnDuration = Math.ceil(shortestMilestoneDuration / 3);

  const overallColumns = Math.ceil(overallDuration / columnDuration);

  const columnWidth = Math.ceil(canvasWidth / overallColumns);

  // console.log(
  //   "Columns:",
  //   overallColumns,
  //   "of",
  //   columnWidth,
  //   "px",
  //   columnDuration,
  //   "ms"
  // );

  /*
   * linear interpolation of a point (x, y) between two known points (x0, y0) and (x1, y1):
   *
   * y = y0 + (x - x0) * ((y1 - y0) / (x1 - x0))
   *
   * in our case, x0 would be the minStart and x1 would be the maxEnd
   * whilst y0 would be 0 and y1 would be canvasWidth
   *
   * and for any given point `date` (x) we are looking for corresponding x coordinate on canvas (y)
   *
   * so the equation is
   *
   * result = 0 + (date - minStart) * ((canvasWidth - 0) / (maxEnd - minStart))
   *
   * and since we know the (maxEnd - minStart) as overallDuration,
   *
   * result = (date - minStart) * (canvasWidth / overallDuration)
   */
  const scaleX = (date) =>
    Math.ceil((date.getTime() - minStart) * (canvasWidth / overallDuration));

  console.log(
    "scaled start",
    minStart,
    scaleX(minStart),
    "scaled end",
    maxEnd,
    scaleX(maxEnd)
  );

  const bars = [];

  let currentRow = 0;

  for (let { title, start, end } of milestones) {
    const x = scaleX(start);
    const y =
      fontSize +
      currentRow++ * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2) +
      DEFAULT_ROW_PADDING;

    const width = scaleX(end) - x;
    const height = DEFAULT_ROW_HEIGHT;

    bars.push({ x, y, width, height, title });
  }

  let selectedBar = null;
  let selectedSlider = null;
  let isMouseDragging = false;
  let initialMousePosition = { x: 0, y: 0 };

  canvas.addEventListener("mousedown", (e) => {
    const { layerX, layerY } = e;
    const { offsetLeft, offsetTop } = canvas;

    const mouseX = layerX - offsetLeft;
    const mouseY = layerY - offsetTop;

    initialMousePosition = {
      x: mouseX,
      y: mouseY
    };

    if (selectedBar) {
      isMouseDragging = true;
      console.log("Start dragging", selectedBar);
    }
  });

  canvas.addEventListener("mouseup", () => {
    initialMousePosition = {
      x: 0,
      y: 0
    };

    if (selectedBar) {
      isMouseDragging = false;
      selectedBar = null;
      selectedSlider = null;
      render();
      console.log("Stop dragging");
    }
  });

  // welcome interactions!
  canvas.addEventListener("mousemove", (e) => {
    // console.log('>> ', e.clientX, e.clientY);
    const { layerX, layerY } = e;
    const { offsetLeft, offsetTop } = canvas;

    const mouseX = layerX - offsetLeft;
    const mouseY = layerY - offsetTop;

    let needsRendering = false;

    for (let i = 0; i < bars.length; i++) {
      const {
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        isSelected: wasSelected,
        leftSliderSelected: wasLeftSliderSelected,
        rightSliderSelected: wasRightSliderSelected
      } = bars[i];

      bars[i].isSelected = false;
      bars[i].rightSliderSelected = false;
      bars[i].leftSliderSelected = false;

      if (!isMouseDragging) {
        if (
          mouseX > barX + SLIDER_WIDTH / 2 &&
          mouseX < barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].isSelected = true;
          selectedBar = bars[i];
        }

        if (
          mouseX >= barX - SLIDER_WIDTH / 2 &&
          mouseX <= barX + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].leftSliderSelected = true;
          selectedBar = bars[i];
          selectedSlider = "left";
        }

        if (
          mouseX >= barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseX <= barX + barWidth + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].rightSliderSelected = true;
          selectedBar = bars[i];
          selectedSlider = "right";
        }
      }

      if (
        bars[i].isSelected !== wasSelected ||
        bars[i].leftSliderSelected !== wasLeftSliderSelected ||
        bars[i].rightSliderSelected !== wasRightSliderSelected
      ) {
        needsRendering = true;
      }
    }

    if (isMouseDragging) {
      // drag the whole bar
      if (!selectedSlider) {
        // for now only allow horizontal drags
        // console.log(
        //   "Dragging bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.x += mouseX - initialMousePosition.x;
      } else if (selectedSlider === "left") {
        // console.log(
        //   "Shrinking and moving bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.x += mouseX - initialMousePosition.x;
        selectedBar.width -= mouseX - initialMousePosition.x;
      } else if (selectedSlider === "right") {
        // console.log(
        //   "Expanding bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.width += mouseX - initialMousePosition.x;
      }

      // TODO: can add debouncing here
      needsRendering = true;

      initialMousePosition = { x: mouseX, y: mouseY };
    }

    if (needsRendering) {
      render();
    }
  });

  const render = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // draw background columns
    for (let i = 0; i < overallColumns; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(220, 225, 220, 0.4)";
      } else {
        ctx.fillStyle = "white";
      }

      // TODO make columns aligned to day/hour/minute
      ctx.fillRect(i * columnWidth, 0, columnWidth, canvasHeight);

      ctx.fillStyle = "black";
      ctx.font = `${fontSize}px Sans Serif`;

      const columnDate = addMilliseconds(minStart, i * columnDuration);

      const columnLabel = formatDate(columnDate, "dd/MM/yy hh:mm");

      ctx.fillText(columnLabel, i * columnWidth, fontSize);
    }

    // draw bars
    for (let bar of bars) {
      const {
        x,
        y,
        width,
        height,
        title,
        isSelected,
        leftSliderSelected,
        rightSliderSelected
      } = bar;
      // console.log("Drawing rect at ", x, y, width, height, title, start, end);

      if (!isMouseDragging || selectedBar !== bar) {
        ctx.fillStyle = isSelected
          ? "rgba(200, 10, 25, 1.0)"
          : "rgba(220, 220, 220, 0.8)";

        ctx.fillRect(x, y, width, height);

        if (leftSliderSelected) {
          ctx.fillStyle = "rgba(200, 100, 25, 1.0)";

          ctx.fillRect(
            x - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2
          );
        }

        if (rightSliderSelected) {
          ctx.fillStyle = "rgba(200, 100, 25, 1.0)";

          ctx.fillRect(
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2
          );
        }

        // TODO count for label' width
        ctx.fillStyle = "black";
        ctx.font = `${fontSize}px Sans Serif`;

        console.log("bar", title, x + width / 2, y + fontSize / 2 + height / 2);

        ctx.fillText(title, x + width / 2, y + fontSize / 2 + height / 2);
      } else if (isMouseDragging && selectedBar === bar) {
        ctx.fillStyle = "rgba(200, 10, 25, 0.8)";
        ctx.fillRect(x, y, width, height);

        if (!selectedSlider) {
          ctx.strokeStyle = "rgba(10, 10, 10, 0.8)";
          ctx.strokeRect(x, y, width, height);
        } else if (selectedSlider === "left") {
          ctx.fillStyle = "rgba(200, 100, 25, 0.8)";

          ctx.fillRect(
            x - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2
          );
        } else if (selectedSlider === "right") {
          ctx.fillStyle = "rgba(200, 100, 25, 0.8)";

          ctx.fillRect(
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2
          );
        }
      }
    }

    // draw today's marker line
    {
      const x = scaleX(new Date());

      console.log("today", x);

      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(x, fontSize);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
  };

  render();
};
