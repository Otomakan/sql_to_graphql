const path = require('path')
const fs = require('fs')

const writeSourceFiles = (targetDirectory, destinationDirectory, recursionLevel) => {
  recursionLevel = recursionLevel || 1
  if (!fs.existsSync(destinationDirectory )){
    fs.mkdirSync(destinationDirectory )
  }
  if (!fs.existsSync(destinationDirectory + `/src`)){
    fs.mkdirSync(destinationDirectory + `/src`)
  }
  if (!fs.existsSync(destinationDirectory + `/src/graphql`)){
    fs.mkdirSync(destinationDirectory + `/src/graphql`)
  }
  const dotenvData = `
  DB_HOST=${process.env.DB_HOST}
  DB_USER=${process.env.DB_USER}
  DB_PASSWORD=${process.env.DB_PASSWORD}
  DB_NAME=${process.env.DB_NAME}
`

  fs.writeFile(destinationDirectory + `/.env`, dotenvData, ()=>{
    console.log('written')
  })
  fs.readdir(targetDirectory, (err, fileList) => {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    fileList.forEach( (file) => {
    
      file = path.resolve(targetDirectory, file)
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          writeSourceFiles(file, destinationDirectory, recursionLevel + 1)
         
        } else {
          const splitedFile = file.split('\\')
          let destinationFileName = destinationDirectory
         
          for (let i = recursionLevel; i > 0; i--){
            destinationFileName += '/' + splitedFile[splitedFile.length  - i]

            if(i > 1){
              if (!fs.existsSync(destinationFileName)){
                fs.mkdirSync(destinationFileName)
              }
            }
          }
          fs.writeFile(destinationFileName, fs.readFileSync(file), (e)=>{
            if(e){
              console.log('in error')
              console.log( destinationFileName)

              throw e
            }
          })
        }
      })
    });
  })
}

module.exports = writeSourceFiles