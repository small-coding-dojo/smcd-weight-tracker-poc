import WeightTracker from "./components/weight-tracker";

// Server component shell. All entry state lives in the client island below;
// this file touches no storage and does no data access.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Weight Tracker</h1>
        <p className="text-sm opacity-70">
          A proof of concept. Weights are saved in this browser only, one entry
          per day, and the chart appears once you have two dates.
        </p>
      </header>
      <WeightTracker />
    </main>
  );
}
