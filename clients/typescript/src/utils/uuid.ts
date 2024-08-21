export function uuidv4() {
  const hexDigits = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 14) {
      uuid += '4'; // UUID version
    } else if (i === 19) {
      uuid += hexDigits.substr((Math.random() * 4) | (0 + 8), 1); // Set bits 6-7 to 10b
    } else if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else {
      uuid += hexDigits.substr((Math.random() * 16) | 0, 1);
    }
  }
  return uuid;
}
