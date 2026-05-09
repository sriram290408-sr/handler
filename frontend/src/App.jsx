import { RouterProvider } from "react-router-dom";
import router from "./routes/routes";
import "./index.css";

export default function App() {
  return <RouterProvider router={router} />;
}