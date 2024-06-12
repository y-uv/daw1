export const constrainBpm = (value) => {
    return Math.max(80, Math.min(200, value));
  };
  
  export const sanitizeBpmInput = (input) => {
    let sanitizedInput = input.replace(/[^0-9]/g, '');
    let parsedInput = parseInt(sanitizedInput, 10);
    if (isNaN(parsedInput) || parsedInput < 80) {
      sanitizedInput = 80;
    } else if (parsedInput > 200) {
      sanitizedInput = 200;
    }
    return sanitizedInput;
  };
  
  