"use client"
import { useEffect , useState } from "react";

export function useFauxProgress(isLoading: boolean, expectedDurationMs = 8000) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100); // real completion always overrides and snaps to 100
      return;
    }

    setProgress(0);
    const start = Date.now(); // suppose start = 10:00:00.000

    //*1
    // run after each 100 mili sec = 0.1 sec
    const interval = setInterval(() => { 
      
      //* 2
      // minus the start time with the time after setInterval Runs 
      // (ab tak kitne milliseconds guzre?) i.e 
      //  start = 0ms , current = 1000ms so elapsed = 1000
      const elapsed = Date.now() - start; 

      //* 3
      // Iska matlab fake progress ka maximum which will be 99:
      // never let the fake bar claim it's actually done
      // ease-out curve: moves fast at first, slows as it nears the ceiling —
      // reads as "still working" instead of stalling at a fixed number
      const ceiling = 99;   

      //*4
      // Ye ease-out exponential curve hain. Means that
      // Start mein progress relatively fast move karegi, phir gradually slow hoti jayegi.

      
      const pct = ceiling * (1 - Math.exp(-elapsed / expectedDurationMs));
      setProgress(Math.min(pct, ceiling));
    }, 100);

    return () => clearInterval(interval);

  }, [isLoading, expectedDurationMs]);

  return progress;
}