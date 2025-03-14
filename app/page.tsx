import { Suspense } from "react";
import { CirclePacking } from "./components/CirclePacking";
import { countMessages } from "./lib/messageCounter";

export interface DataNode extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  value: number;
}

export default async function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeScreen />
    </Suspense>
  );
}

const Loading = () => (
  <div className="flex justify-center items-center h-screen w-screen">
    <p className="text-white text-xl animate-pulse">Loading...</p>
  </div>
);

async function HomeScreen() {
  const data = await countMessages();

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <p className="text-white text-xl">Loading data failed :(</p>
      </div>
    );
  }

  return <DataRenderer data={data} />;
}

const DataRenderer = ({ data }: { data: DataNode[] }) => {
  return (
    <div className="flex flex-row flex-1">
      <CirclePacking data={data} width={1000} height={1000} />
      <div>
        <h1 className="text-2xl text-center pb-4">MVPs</h1>
        <ul className="pl-5">
          {data.toReversed().map((item, index) => (
            <li key={item.group} className="text-lg">
              {++index}.{item.group}: {item.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
