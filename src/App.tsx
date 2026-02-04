import React, { useEffect, useState } from "react";
import { StatusDashboard } from "./components/StatusDashboard";
import type { Status, Subsystem, SystemData, SystemDataInput } from "./types";

const initialData: SystemData = {
  system_status: "OK",
  subsystems: [
    { id: "TSC-1", status: "OK" },
    { id: "TSC-2", status: "OK" },
    { id: "TSC-3", status: "OK" },
    { id: "TSC-4", status: "OK" },
  ],
  last_update: new Date().toISOString(),
};

function generate100Subsystems(): Subsystem[] {
  const subsystems: Subsystem[] = [];
  for (let i = 1; i <= 100; i++) {
    const rand = Math.random();
    let status: Status = "OK";
    if (rand > 0.9) status = "ERROR";
    else if (rand > 0.75) status = "WARNING";
    subsystems.push({ id: `TSC-${i}`, status });
  }
  return subsystems;
}

const scenarios: SystemDataInput[] = [
  {
    system_status: "OK",
    subsystems: [
      { id: "TSC-1", status: "OK" },
      { id: "TSC-2", status: "OK" },
      { id: "TSC-3", status: "OK" },
      { id: "TSC-4", status: "OK" },
    ],
  },
  {
    system_status: "WARNING",
    subsystems: [
      { id: "TSC-1", status: "OK" },
      { id: "TSC-2", status: "WARNING" },
      { id: "TSC-3", status: "OK" },
      { id: "TSC-4", status: "OK" },
      { id: "TSC-5", status: "OK" },
      { id: "TSC-6", status: "OK" },
      { id: "TSC-7", status: "OK" },
      { id: "TSC-8", status: "WARNING" },
    ],
  },
  {
    system_status: "ERROR",
    subsystems: [
      { id: "TSC-1", status: "OK" },
      { id: "TSC-2", status: "ERROR" },
      { id: "TSC-3", status: "WARNING" },
      { id: "TSC-4", status: "OK" },
      { id: "TSC-5", status: "OK" },
      { id: "TSC-6", status: "ERROR" },
      { id: "TSC-7", status: "OK" },
      { id: "TSC-8", status: "OK" },
      { id: "TSC-9", status: "WARNING" },
      { id: "TSC-10", status: "OK" },
      { id: "TSC-11", status: "OK" },
      { id: "TSC-12", status: "OK" },
    ],
  },
  {
    system_status: "WARNING",
    subsystems: generate100Subsystems(),
  },
];

export default function App() {
  const [systemData, setSystemData] = useState<SystemData>(initialData);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % scenarios.length;
      setSystemData({
        ...scenarios[currentIndex],
        last_update: new Date().toISOString(),
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StatusDashboard
      data={systemData}
      layout="spiral"
      onSubsystemClick={(subsystem) => {
        console.log("클릭한 서브시스템:", subsystem);
        // 예: 상세 패널 열기, 라우팅 등
      }}
    />
  );
}
