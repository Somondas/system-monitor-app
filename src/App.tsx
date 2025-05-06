import { useEffect, useState } from "react";
import { BG_BLACK, DARK_PURPLE, PINK } from "./constants";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function App() {
  const [stats, setStats] = useState({
    cpuUsage: 0,
    usedMem: 0,
    totalMem: 1,
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await window.ipcRenderer.invoke("get-system-stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const memPercent = (stats.usedMem / stats.totalMem) * 100;

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center text-white"
      style={{ backgroundColor: BG_BLACK }}
    >
      <h1 className="text-2xl font-bold text-blue-500 mb-8">System Monitor</h1>
      <div className="flex gap-12">
        {/* Memory Chart */}
        <div className="flex flex-col items-center">
          <div className="w-40 h-40">
            <CircularProgressbar
              value={memPercent}
              text={`${memPercent.toFixed(0)}%`}
              styles={buildStyles({
                pathColor: PINK, // blue
                textColor: "#e5e7eb",
                trailColor: DARK_PURPLE, // dark gray
              })}
            />
          </div>
          <p className="mt-4 text-sm text-gray-300">
            Memory Usage: {memPercent.toFixed(2)}%
          </p>
        </div>

        {/* CPU Chart */}
        <div className="flex flex-col items-center">
          <div className="w-40 h-40">
            <CircularProgressbar
              value={stats.cpuUsage}
              text={`${stats.cpuUsage.toFixed(0)}%`}
              styles={buildStyles({
                pathColor: "#10b981", // green
                textColor: "#e5e7eb",
                trailColor: "#1f2937",
              })}
            />
          </div>
          <p className="mt-4 text-sm text-gray-300">
            CPU Usage: {stats.cpuUsage.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
