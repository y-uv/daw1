// Define the resetTapBpm function which takes a tapTimeoutRef and a resetFunction as arguments.
export const resetTapBpm = (tapTimeoutRef, resetFunction) => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(resetFunction, 3000);
  };
  
  // Define a function to reset tap times.
  export const resetTapTimeout = (setTapTimes) => {
    setTapTimes([]);
  };
  