TYPE libs\Iuppiter.js libs\modernizr.js src\Sburb.js src\Sprite.js src\Fighter.js src\Character.js src\SpriteButton.js src\Animation.js src\Room.js src\FontEngine.js src\Action.js src\events.js src\Trigger.js src\commands.js src\serialization.js src\Dialoger.js src\Chooser.js src\Audio.js src\Assets.js src\Debugger.js src\Path.js src\ActionQueue.js >> Sburb.js
jsmin.exe < Sburb.js > Sburb.min.js
COPY index.html index_dev.html
DEL index.html
COPY index_production.html index.html
zip.exe -r Sburb.zip Sburb.min.js index.html README.md resources levels
DEL Sburb.js
DEL Sburb.min.js
DEL index.html
COPY index_dev.html index.html
DEL index_dev.html