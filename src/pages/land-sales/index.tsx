import { Routes, Route } from "react-router-dom";
import { LandSalesDashboard } from "./LandSalesDashboard";
import { LandProperties } from "./LandProperties";
import { LandBrokers } from "./LandBrokers";
import LandClients from "./LandClients";
import { LandTasks } from "./LandTasks";
import { AdvancedTasks } from "./AdvancedTasks";
import { LandReports } from "./LandReports";

export default function LandSalesIndex() {
  return (
    <Routes>
      <Route index element={<LandSalesDashboard />} />
      <Route path="properties" element={<LandProperties />} />
      <Route path="brokers" element={<LandBrokers />} />
      <Route path="clients" element={<LandClients />} />
      <Route path="tasks" element={<LandTasks />} />
      <Route path="advanced-tasks" element={<AdvancedTasks />} />
      <Route path="reports" element={<LandReports />} />
    </Routes>
  );
}