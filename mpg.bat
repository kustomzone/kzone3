var Mpg = require('mpg123')
 
var player = new Mpg()
  .play(filename)
  .on('end', function () {
    //play the next song. 
    player.play(nextTrack)
    //etc. 
  })
  