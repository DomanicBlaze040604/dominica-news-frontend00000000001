import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { NotFoundPage } from "./ErrorPages";
import { config } from "../config/environment";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (config.logging.enableConsole) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return <NotFoundPage />;
};

export default NotFound;
