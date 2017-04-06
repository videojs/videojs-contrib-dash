export default function findKeyByValue(obj, value) {
  for (let key in obj) {
    if (obj[key] === value) {
      return key;
    }
  }
}