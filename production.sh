cat libs/Iuppiter.js libs/modernizr.js src/Sburb.js src/Sprite.js src/Fighter.js src/Character.js src/SpriteButton.js src/Animation.js src/Room.js src/FontEngine.js src/Action.js src/events.js src/Trigger.js src/commands.js src/serialization.js src/Dialoger.js src/Chooser.js src/Audio.js src/Assets.js src/Debugger.js src/Path.js src/ActionQueue.js > Sburb.js
./jsmin.exe < Sburb.js > Sburb.min.js
cp index.html index_dev.html
rm index.html
cp index_production.html index.html
zip -r Sburb.zip Sburb.min.js index.html README.md resources levels
rm Sburb.js
rm Sburb.min.js
rm index.html
cp index_dev.html index.html
rm index_dev.html