"use client";

import React from "react";
import { Group } from "@visx/group";
import genBins, { Bin, Bins } from "@visx/mock-data/lib/generators/genBins";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { getSeededRandom } from "@visx/mock-data";

const cool1 = "#122549";
const cool2 = "#b4fbde";
export const background = "#28272c";

const seededRandom = getSeededRandom(0.41);

const binData2 = genBins(
  /* length = */ 16,
  /* height = */ 16,
  /** binFunc */ (idx) => 150 * idx,
  /** countFunc */ (i, number) => 25 * (number - i) * seededRandom()
);
console.log(binData2);

//console.log(binData);

interface WdBin extends Bin {
  name: string;
}

interface WdBins extends Bins {
  bins: WdBin[];
}

// const binData: WdBins[] = [
//   {
//     bin: 0,
//     bins: [
//       { bin: 0, count: 53, name: "Ville Komulainen" },
//       { bin: 1, count: 6, name: "Sami Oksanen" },
//       { bin: 2, count: 14, name: "Taru Airola" },
//       { bin: 3, count: 39, name: "Estefanía Carballés Lorenzo" },
//       { bin: 4, count: 23, name: "Miki Wiik" },
//       { bin: 5, count: 29, name: "Prerit Kimtani" },
//       { bin: 6, count: 14, name: "Ari Paasonen" },
//       { bin: 7, count: 23, name: "Samuli Ulmanen" },
//       { bin: 8, count: 26, name: "Perttu Raivio" },
//       { bin: 9, count: 21, name: "Mika Viljanen" },
//       { bin: 10, count: 11, name: "Antti Urpelainen" },
//       { bin: 11, count: 4, name: "Lauri Arimo" },
//       { bin: 12, count: 44, name: "Ville Nuutinen" },
//       { bin: 13, count: 11, name: "Sami Ollila" },
//       { bin: 14, count: 50, name: "Ulf Byskov" },
//       { bin: 15, count: 2, name: "Salla Gebhard" },
//       { bin: 16, count: 34, name: "Jussi Kinnula" },
//       { bin: 17, count: 7, name: "Jarno Elovirta" },
//       { bin: 18, count: 6, name: "Juuso Elo-Rauta" },
//       { bin: 19, count: 3, name: "Pauli Perälä" },
//       { bin: 20, count: 10, name: "Jussi Kinnunen" },
//       { bin: 21, count: 3, name: "Miika Kasnio" },
//       { bin: 22, count: 10, name: "Joonas Kykkänen" },
//       { bin: 23, count: 4, name: "Alejandro Brozzo" },
//       { bin: 24, count: 6, name: "Victor Mazzoni" },
//       { bin: 25, count: 10, name: "Elsa Nyrhinen" },
//       { bin: 26, count: 2, name: "Tero Dubrovin" },
//       { bin: 27, count: 21, name: "Mikael Bärlund" },
//       { bin: 28, count: 2, name: "Joonas Aalto" },
//       { bin: 29, count: 5, name: "Anton Räihä" },
//       { bin: 30, count: 1, name: "Joonas Karttunen" },
//       { bin: 31, count: 2, name: "Nikita Skryt" },
//       { bin: 32, count: 2, name: "Ville Jokela" },
//       { bin: 33, count: 3, name: "Antero Törhönen" },
//       { bin: 34, count: 2, name: "Jarl-Erik Malmström" },
//       { bin: 35, count: 3, name: "Matti Kaivanto" },
//       { bin: 36, count: 1, name: "Levon" },
//       { bin: 37, count: 1, name: "Ilia Tiulenev" },
//       { bin: 38, count: 3, name: "Mateus Freitas" },
//       { bin: 39, count: 1, name: "Victor Antonio Barzana Crespo" },
//       { bin: 40, count: 1, name: "Anastasiia Kovalenko" },
//       { bin: 41, count: 8, name: "Miikka Kajanne" },
//       { bin: 42, count: 2, name: "Mikael Harju" },
//       { bin: 43, count: 3, name: "Antti Lehtonen" },
//       { bin: 44, count: 2, name: "Lauri Oherd" },
//       { bin: 45, count: 1, name: "Maxi Marquez Fernandez" },
//       { bin: 46, count: 1, name: "Aleksei Iuferev" },
//       { bin: 47, count: 1, name: "jarkko matikainen" },
//       { bin: 48, count: 2, name: "Tuomas Tuominen" },
//     ].sort((a, b) => a.count - b.count),
//   },
// ];

function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
  return Math.max(...data.map(value));
}

// accessors
const bins = (d: Bins) => d.bins;
const count = (d: Bin) => d.count;

export type HeatmapProps = {
  width: number;
  height: number;
  data: { count: number; name: string }[];
  margin?: { top: number; right: number; bottom: number; left: number };
  separation?: number;
  events?: boolean;
};

const defaultMargin = { top: 10, left: 20, right: 20, bottom: 110 };

export default function Graph({
  width,
  height,
  data,
  events = false,
  margin = defaultMargin,
  separation = 20,
}: HeatmapProps) {
  const binData: WdBins[] = [
    {
      bin: 0,
      bins: data.map((d, i) => ({ bin: i, count: d.count, name: d.name })),
    },
  ];

  const colorMax = max(binData, (d) => max(bins(d), count));
  const bucketSizeMax = max(binData, (d) => bins(d).length);

  // scales
  const xScale = scaleLinear<number>({
    domain: [0, binData.length],
  });
  const yScale = scaleLinear<number>({
    domain: [0, bucketSizeMax],
  });
  const rectColorScale = scaleLinear<string>({
    range: [cool1, cool2],
    domain: [0, colorMax],
  });
  const opacityScale = scaleLinear<number>({
    range: [0.1, 1],
    domain: [0, colorMax],
  });

  // bounds
  const size =
    width > margin.left + margin.right
      ? width - margin.left - margin.right - separation
      : width;
  const xMax = size / 2;
  const yMax = height - margin.bottom - margin.top;
  const binWidth = xMax / binData.length;

  xScale.range([0, xMax]);
  yScale.range([yMax, 0]);

  return width < 10 ? null : (
    <svg width={width} height={height}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={14}
        fill={background}
      />
      <Group top={margin.top} left={xMax / 2 + margin.left + separation}>
        <HeatmapRect
          data={binData}
          xScale={(d) => xScale(d) ?? 0}
          yScale={(d) => yScale(d) ?? 0}
          colorScale={rectColorScale}
          opacityScale={opacityScale}
          binWidth={binWidth}
          binHeight={binWidth}
          gap={2}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) =>
              heatmapBins.map((bin) => (
                <rect
                  key={`heatmap-rect-${bin.row}-${bin.column}`}
                  className="visx-heatmap-rect"
                  width={bin.width}
                  height={bin.height}
                  x={bin.x}
                  y={bin.y}
                  fill={bin.color}
                  fillOpacity={bin.opacity}
                  onClick={() => {
                    if (!events) return;
                    alert(`${bin.bin.name} has ${bin.count} messages`);
                  }}
                />
              ))
            )
          }
        </HeatmapRect>
      </Group>
    </svg>
  );
}
