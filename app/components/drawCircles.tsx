import { scaleOrdinal, ScalePower } from "d3";
import { DataNode } from "../page";

const COLORS = [
  "#e0ac2b",
  "#e85252",
  "#6689c6",
  "#9a6fb0",
  "#a53253",
  "#69b3a2",
];

export const drawCircles = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  nodes: DataNode[],
  sizeScale: ScalePower<number, number, never>
) => {
  // Color Scale
  const allGroups = [...new Set(nodes.map((d) => d.group))];
  const colorScale = scaleOrdinal<string>().domain(allGroups).range(COLORS);

  context.clearRect(0, 0, width, height);

  // Draw the nodes
  nodes.forEach((node) => {
    if (!node.x || !node.y) {
      return;
    }
    const scale = sizeScale(node.value);
    context.beginPath();
    context.moveTo(node.x + 12, node.y);
    context.arc(node.x, node.y, sizeScale(node.value), 0, 2 * Math.PI);
    context.fillStyle = colorScale(node.group);
    context.fill();

    // Add label
    if (scale > 25) {
      context.fillStyle = "#fff"; // Set text color
      context.font = `${scale * 0.35}px Arial`; // Set font size and family
      const words = node.group.split(".");
      words.forEach((word, index) => {
        const textWidth = context.measureText(word).width;
        context.fillText(
          word,
          node.x! - textWidth / 2,
          node.y! + 5 + index * (scale * 0.35)
        ); // Adjust position as needed
      });
    }
  });
};
