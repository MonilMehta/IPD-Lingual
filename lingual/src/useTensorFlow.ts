
import { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

export function useTensorFlowLoaded() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    tf.ready().then(() => setIsLoaded(true));
  }, []);
  return isLoaded;
}