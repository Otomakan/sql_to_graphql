const snakeToCamel = (str) => str.replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
                  .replace('-', '')
                  .replace('_', '')
)

const strip = (string, iterations) => {
  iterations = iterations || 1
  if(iterations > 1){
    iterations -= 1
    return strip(string.substr(1, string.length-2),  iterations)
  }
  return string.substr(1, string.length-2)

}

const shave = (string) => {
  const quoteOrPar =  new RegExp(/\'|\"|\(|\)/)
  if(string[0].match(quoteOrPar) && string[string.length-1].match(quoteOrPar)){
    return shave(strip(string))
  }
  return string
}
module.exports  = {
  snakeToCamel, 
  strip,
  shave
}