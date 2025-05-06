import { useEffect, useState } from "react";
import { BG_BLACK, DARK_PURPLE, PINK, PURPLE } from "./constants";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { formatBytes } from "./utils";
import ProgressBar from "@ramonak/react-progress-bar";

function App() {
  const [stats, setStats] = useState({
    cpuUsage: 0,
    usedMem: 0,
    totalMem: 1,
  });

  const [diskInfo, setDiskInfo] = useState({
    total: 0,
    used: 0,
    available: 0,
    mount: 0,
  });

  useEffect(() => {
    const getDisk = async () => {
      try {
        const data = await window.ipcRenderer.invoke("get-disk-info");
        setDiskInfo(data);
      } catch (error) {
        console.error("Failed to fetch disk info", error);
      }
    };
    getDisk();
  }, []);

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
  const diskSpace = ((diskInfo.used / diskInfo.total) * 100).toFixed(1);

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center gap-12 text-white px-6"
      style={{ backgroundColor: BG_BLACK }}
    >
      {/* CPU + Memory */}
      <div className="flex gap-16">
        {/* Memory */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-56 h-56">
            <CircularProgressbar
              value={memPercent}
              text={`${memPercent.toFixed(0)}%`}
              styles={buildStyles({
                pathColor: PINK,
                textColor: "#e5e7eb",
                trailColor: DARK_PURPLE,
              })}
            />
          </div>
          <p className="text-gray-300 text-base">
            Memory Usage: {memPercent.toFixed(2)}%
          </p>
        </div>

        {/* CPU */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-56 h-56">
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
          <p className="text-gray-300 text-base">
            CPU Usage: {stats.cpuUsage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Disk Usage */}
      <div className="w-full max-w-xl text-center space-y-2">
        <ProgressBar
          bgColor={PINK}
          baseBgColor={PURPLE}
          completed={Math.round(parseFloat(diskSpace))}
          maxCompleted={100}
          height="20px"
          labelAlignment="outside"
          labelColor="#fff"
        />
        <p className="text-gray-400 text-sm mt-1">
          Disk Usage: {diskSpace}% | Total: {formatBytes(diskInfo.total)} GB |
          Free: {formatBytes(diskInfo.available)} GB
        </p>
      </div>
    </div>
  );
}

export default App;
