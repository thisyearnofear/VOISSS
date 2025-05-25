import React, { useEffect } from "react";
import { router } from "expo-router";

export default function ImportRedirect() {
  useEffect(() => {
    // Redirect to the tabs/import route
    router.replace({
      pathname: "/tabs/import",
    });
  }, []);

  // Return null since this is just a redirect component
  return null;
}
